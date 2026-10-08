-- =============================================================
-- Lunchcafé Zus & Zo: reserveringssysteem
-- =============================================================
-- Draai dit bestand eenmalig in een NIEUW Supabase-project:
-- Supabase, SQL Editor, alles plakken, Run.
--
-- Opzet (afgeleid van de module van Den Witten Haen):
--   reservations   de reserveringen
--   blocked_slots  sluitingen (hele dag of een reeks tijdsloten)
--   settings       capaciteit, door het café zelf aan te passen
--   staff          wie in het beheer mag (koppeling met Supabase Auth)
--
-- Beveiliging:
--   * Bezoekers (anon) kunnen de tabel NIET lezen of schrijven. Ze zien
--     alleen beschikbaarheid via get_availability(), zonder persoonsgegevens.
--   * Reserveren en annuleren gaat via de Edge Function "reservering", die
--     met de service role de functies hieronder aanroept en de mails stuurt.
--   * Alleen ingelogde gebruikers die in "staff" staan, zien reserveringen.
--     Een willekeurig aangemaakt Supabase-account krijgt dus niets te zien.
-- =============================================================

create extension if not exists pgcrypto;

-- ─── Tabellen ─────────────────────────────────────────────────────────────────

create table if not exists public.reservations (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  name             text not null check (char_length(name) between 1 and 100),
  email            text not null check (char_length(email) between 3 and 254),
  phone            text not null check (char_length(phone) between 6 and 40),
  date             date not null,
  time             text not null check (time ~ '^\d{2}:\d{2}$'),
  guests           integer not null check (guests between 1 and 20),
  reservation_type text not null check (reservation_type in ('lunch', 'hightea', 'diner')),
  message          text check (message is null or char_length(message) <= 1000),
  status           text not null default 'aangevraagd'
                   check (status in ('aangevraagd', 'bevestigd', 'geannuleerd')),
  cancelled_by     text check (cancelled_by is null or cancelled_by in ('gast', 'cafe'))
);

create index if not exists reservations_date_idx on public.reservations (date, time);
create index if not exists reservations_email_created_idx on public.reservations (lower(email), created_at);

create table if not exists public.blocked_slots (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date       date not null,
  time_from  text check (time_from is null or time_from ~ '^\d{2}:\d{2}$'), -- null = hele dag dicht
  time_to    text check (time_to is null or time_to ~ '^\d{2}:\d{2}$'),     -- null = tot einde dag
  reason     text check (reason is null or char_length(reason) <= 200)
);

create index if not exists blocked_slots_date_idx on public.blocked_slots (date);

-- Een rij, id = 1.
create table if not exists public.settings (
  id                   integer primary key default 1 check (id = 1),
  max_guests_window    integer not null default 40 check (max_guests_window between 1 and 500),
  max_guests_online    integer not null default 8  check (max_guests_online between 1 and 20),
  min_minutes_ahead    integer not null default 60 check (min_minutes_ahead between 0 and 1440),
  max_days_ahead       integer not null default 180 check (max_days_ahead between 1 and 730),
  updated_at           timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.staff (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  note       text
);

-- ─── Hulpfuncties ─────────────────────────────────────────────────────────────

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

-- Nederlandse tijd, ook als de database in UTC draait.
create or replace function public.nl_now()
returns timestamp
language sql
stable
as $$ select (now() at time zone 'Europe/Amsterdam'); $$;

-- Tijdsloten per soort en datum. Enige bron van waarheid; src/reserve.jsx
-- spiegelt dit (TIME_SLOTS) alleen om de knoppen te tekenen.
--   Maandag gesloten.
--   Lunch en high tea: dinsdag t/m zondag.
--   Diner: alleen vrijdag.
create or replace function public.slots_for(p_type text, p_date date)
returns text[]
language sql
immutable
as $$
  select case
    when extract(isodow from p_date) = 1 then array[]::text[]
    when p_type = 'lunch' then
      array['11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00']
    when p_type = 'hightea' then
      array['13:00','13:30','14:00','14:30','15:00']
    when p_type = 'diner' and extract(isodow from p_date) = 5 then
      array['17:30','18:00','18:30','19:00','19:30','20:00','20:30']
    else array[]::text[]
  end;
$$;

create or replace function public.slot_blocked(p_date date, p_time text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocked_slots b
    where b.date = p_date
      and (
        b.time_from is null
        or (p_time >= b.time_from and (b.time_to is null or p_time <= b.time_to))
      )
  );
$$;

-- Hoogste gelijktijdige bezetting in een rollend venster van 2 uur, als er
-- p_extra gasten op p_time bij komen. Een tafel bezet zo'n 2 uur; we kijken
-- naar de vier halfuursvensters die p_time raken.
create or replace function public.window_load(p_date date, p_time text, p_extra integer default 0)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  max_load integer := 0;
  sub_load integer;
  k        integer;
begin
  for k in 0..3 loop
    select coalesce(sum(r.guests), 0) + p_extra
      into sub_load
      from public.reservations r
     where r.date = p_date
       and r.status <> 'geannuleerd'
       and extract(epoch from (r.time::time - p_time::time)) / 60 >  (k - 4) * 30
       and extract(epoch from (r.time::time - p_time::time)) / 60 <=  k      * 30;
    if sub_load > max_load then
      max_load := sub_load;
    end if;
  end loop;
  return max_load;
end;
$$;

-- ─── Publiek: beschikbaarheid ─────────────────────────────────────────────────
-- Geeft per tijdslot terug of er nog plek is voor p_guests personen.
-- Geen persoonsgegevens, geen aantallen: alleen ja/nee per slot.
create or replace function public.get_availability(p_date date, p_type text, p_guests integer default 2)
returns table (slot text, available boolean, reason text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  s        public.settings%rowtype;
  t        text;
  slot_ts  timestamp;
  g        integer := greatest(1, least(coalesce(p_guests, 2), 20));
begin
  select * into s from public.settings where id = 1;

  foreach t in array public.slots_for(p_type, p_date) loop
    slot_ts := p_date + t::time;
    slot := t;
    if p_date > (public.nl_now())::date + s.max_days_ahead then
      available := false; reason := 'te_ver';
    elsif slot_ts < public.nl_now() + make_interval(mins => s.min_minutes_ahead) then
      available := false; reason := 'voorbij';
    elsif public.slot_blocked(p_date, t) then
      available := false; reason := 'gesloten';
    elsif public.window_load(p_date, t, g) > s.max_guests_window then
      available := false; reason := 'vol';
    else
      available := true; reason := null;
    end if;
    return next;
  end loop;
end;
$$;

-- ─── Reservering maken (alleen via de Edge Function) ──────────────────────────
-- Foutcodes:
--   P0001 vol         P0002 gesloten       P0003 ongeldige invoer
--   P0007 te veel aanvragen vanaf dit e-mailadres
create or replace function public.create_reservation(
  p_name    text,
  p_email   text,
  p_phone   text,
  p_date    date,
  p_time    text,
  p_guests  integer,
  p_type    text,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  s       public.settings%rowtype;
  new_id  uuid;
  recent  integer;
begin
  select * into s from public.settings where id = 1;

  p_name    := nullif(btrim(p_name), '');
  p_email   := lower(nullif(btrim(p_email), ''));
  p_phone   := nullif(btrim(p_phone), '');
  p_message := nullif(btrim(p_message), '');

  if p_name is null or p_email is null or p_phone is null then
    raise exception 'Naam, e-mail en telefoon zijn verplicht' using errcode = 'P0003';
  end if;
  if p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Ongeldig e-mailadres' using errcode = 'P0003';
  end if;
  if p_type is null or p_type not in ('lunch', 'hightea', 'diner') then
    raise exception 'Ongeldig soort reservering' using errcode = 'P0003';
  end if;
  if p_guests is null or p_guests < 1 or p_guests > s.max_guests_online then
    raise exception 'Ongeldig aantal personen' using errcode = 'P0003';
  end if;
  if p_date is null or p_time is null or not (p_time = any (public.slots_for(p_type, p_date))) then
    raise exception 'Ongeldig tijdslot' using errcode = 'P0003';
  end if;
  if p_date > (public.nl_now())::date + s.max_days_ahead then
    raise exception 'Datum ligt te ver vooruit' using errcode = 'P0003';
  end if;
  if (p_date + p_time::time) < public.nl_now() + make_interval(mins => s.min_minutes_ahead) then
    raise exception 'Dit tijdslot is al voorbij' using errcode = 'P0003';
  end if;

  -- Rem op misbruik: maximaal 3 aanvragen per e-mailadres per uur.
  select count(*) into recent
    from public.reservations
   where lower(email) = p_email
     and created_at > now() - interval '1 hour';
  if recent >= 3 then
    raise exception 'Te veel aanvragen' using errcode = 'P0007';
  end if;

  if public.slot_blocked(p_date, p_time) then
    raise exception 'Dit tijdslot is gesloten' using errcode = 'P0002';
  end if;

  -- Gelijktijdige boekingen op dezelfde dag na elkaar afhandelen, zodat twee
  -- gasten niet samen over de capaciteit heen gaan.
  perform pg_advisory_xact_lock(hashtext('zz-res-' || p_date::text));

  if public.window_load(p_date, p_time, p_guests) > s.max_guests_window then
    raise exception 'Dit tijdslot heeft niet genoeg ruimte' using errcode = 'P0001';
  end if;

  insert into public.reservations (name, email, phone, date, time, guests, reservation_type, message)
  values (left(p_name, 100), p_email, left(p_phone, 40), p_date, p_time, p_guests, p_type, left(p_message, 1000))
  returning id into new_id;

  return new_id;
end;
$$;

-- ─── Annuleren door de gast (alleen via de Edge Function) ─────────────────────
-- De link in de mail bevat het id (willekeurige uuid, niet te raden).
create or replace function public.get_reservation_for_cancel(p_id uuid)
returns table (
  name             text,
  date             date,
  "time"           text,
  guests           integer,
  status           text,
  reservation_type text,
  is_past          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select r.name, r.date, r.time, r.guests, r.status, r.reservation_type,
         (r.date + r.time::time) < public.nl_now() as is_past
    from public.reservations r
   where r.id = p_id;
$$;

-- Foutcodes: P0004 niet gevonden, P0005 al geannuleerd, P0006 voorbij
create or replace function public.cancel_reservation(p_id uuid, p_by text default 'gast')
returns table (
  name             text,
  email            text,
  date             date,
  "time"           text,
  guests           integer,
  reservation_type text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations%rowtype;
begin
  select * into r from public.reservations where id = p_id for update;

  if not found then
    raise exception 'Reservering niet gevonden' using errcode = 'P0004';
  end if;
  if r.status = 'geannuleerd' then
    raise exception 'Deze reservering is al geannuleerd' using errcode = 'P0005';
  end if;
  if p_by = 'gast' and (r.date + r.time::time) < public.nl_now() then
    raise exception 'Deze reservering ligt in het verleden' using errcode = 'P0006';
  end if;

  update public.reservations
     set status = 'geannuleerd',
         cancelled_by = case when p_by = 'cafe' then 'cafe' else 'gast' end
   where id = p_id;

  return query select r.name, r.email, r.date, r.time, r.guests, r.reservation_type;
end;
$$;

-- ─── Bevestigen door het café (alleen via de Edge Function) ───────────────────
-- Foutcodes: P0004 niet gevonden, P0005 geannuleerd, P0008 al bevestigd
create or replace function public.confirm_reservation(p_id uuid)
returns table (
  name             text,
  email            text,
  date             date,
  "time"           text,
  guests           integer,
  reservation_type text,
  message          text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reservations%rowtype;
begin
  select * into r from public.reservations where id = p_id for update;

  if not found then
    raise exception 'Reservering niet gevonden' using errcode = 'P0004';
  end if;
  if r.status = 'geannuleerd' then
    raise exception 'Deze reservering is geannuleerd' using errcode = 'P0005';
  end if;
  if r.status = 'bevestigd' then
    raise exception 'Deze reservering is al bevestigd' using errcode = 'P0008';
  end if;

  update public.reservations set status = 'bevestigd' where id = p_id;

  return query select r.name, r.email, r.date, r.time, r.guests, r.reservation_type, r.message;
end;
$$;

-- ─── Rechten ──────────────────────────────────────────────────────────────────

alter table public.reservations  enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.settings      enable row level security;
alter table public.staff         enable row level security;

-- Reserveringen: alleen personeel. Status wijzigen gaat via de Edge Function
-- (die ook de mail stuurt), maar personeel mag bijvoorbeeld een opmerking of
-- telefoonnummer corrigeren.
drop policy if exists staff_select on public.reservations;
create policy staff_select on public.reservations
  for select to authenticated using (public.is_staff());
drop policy if exists staff_update on public.reservations;
create policy staff_update on public.reservations
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Sluitingen: personeel beheert; het publiek leest via get_availability().
drop policy if exists staff_all_blocked on public.blocked_slots;
create policy staff_all_blocked on public.blocked_slots
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Instellingen: personeel leest en wijzigt.
drop policy if exists staff_select_settings on public.settings;
create policy staff_select_settings on public.settings
  for select to authenticated using (public.is_staff());
drop policy if exists staff_update_settings on public.settings;
create policy staff_update_settings on public.settings
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Staff-tabel: je ziet alleen je eigen rij (om te checken of je erin staat).
drop policy if exists staff_self on public.staff;
create policy staff_self on public.staff
  for select to authenticated using (user_id = auth.uid());

-- Supabase geeft anon en authenticated standaard alle rechten op nieuwe
-- tabellen. Eerst alles intrekken, dan alleen teruggeven wat nodig is.
revoke all on public.reservations, public.blocked_slots, public.settings, public.staff from anon, authenticated;
grant all on public.reservations, public.blocked_slots, public.settings, public.staff to service_role;
grant select, update on public.reservations to authenticated;
grant select, insert, update, delete on public.blocked_slots to authenticated;
grant select, update on public.settings to authenticated;
grant select on public.staff to authenticated;

-- Functies: standaard mag iedereen alles uitvoeren; dat zetten we dicht en
-- geven alleen gericht terug.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.get_availability(date, text, integer) to anon, authenticated;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.slots_for(text, date) to anon, authenticated;

grant execute on function public.create_reservation(text, text, text, date, text, integer, text, text) to service_role;
grant execute on function public.get_reservation_for_cancel(uuid) to service_role;
grant execute on function public.cancel_reservation(uuid, text) to service_role;
grant execute on function public.confirm_reservation(uuid) to service_role;
grant execute on function public.is_staff() to service_role;

-- Nieuwe functies in de toekomst niet automatisch openzetten.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ─── Opruimen (privacybeleid: tot 6 maanden na bezoek) ────────────────────────
create or replace function public.purge_old_reservations()
returns integer
language sql
security definer
set search_path = public
as $$
  with d as (
    delete from public.reservations where date < current_date - interval '6 months' returning 1
  ), b as (
    delete from public.blocked_slots where date < current_date - interval '1 month' returning 1
  )
  select (select count(*) from d)::integer;
$$;
revoke execute on function public.purge_old_reservations() from public, anon, authenticated;

-- Elke nacht om 03:17 opruimen met pg_cron (staat standaard klaar in
-- Supabase). Lukt dat niet, dan gaat de rest van dit bestand gewoon door;
-- zet pg_cron dan aan via Database, Extensions en draai dit blok opnieuw.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('zz-opruimen', '17 3 * * *', 'select public.purge_old_reservations()');
exception when others then
  raise notice 'pg_cron niet beschikbaar (%), opruimtaak niet ingepland', sqlerrm;
end $$;

-- Live bijwerken van het beheer.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reservations'
     ) then
    alter publication supabase_realtime add table public.reservations;
  end if;
end $$;

-- =============================================================
-- Personeel toegang geven (na het aanmaken van de gebruiker in
-- Supabase, Authentication, Users, "Add user"):
--
--   insert into public.staff (user_id, note)
--   select id, 'Eigenaar' from auth.users where email = 'info@lunchcafezusenzo.nl';
-- =============================================================
