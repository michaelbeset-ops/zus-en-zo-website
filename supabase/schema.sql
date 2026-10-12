-- =============================================================
-- Lunchcafé Zus & Zo: reserveringssysteem
-- =============================================================
-- Wordt automatisch gedraaid door installeer/installeer.mjs.
-- Handmatig kan ook: Supabase, SQL Editor, alles plakken, Run.
-- Het bestand mag vaker gedraaid worden; bestaande gegevens en
-- instellingen blijven staan.
--
-- Tabellen:
--   reservations       de reserveringen
--   reservation_types  lunch, high tea, diner, ...: dagen en tijden (beheer)
--   opening_hours      openingstijden per weekdag (beheer, ook op de site)
--   blocked_slots      sluitingen: hele dag of een reeks tijden (beheer)
--   settings           capaciteit, termijnen, meldingen (beheer)
--   subscribers        mailinglijst, alleen met toestemming
--   staff              wie in het beheer mag
--
-- Beveiliging:
--   * Bezoekers (anon) lezen alleen openbare instellingen en beschikbaarheid
--     via get_public_config() en get_availability(). Geen persoonsgegevens.
--   * Reserveren, annuleren, afmelden en alle mails lopen via de Edge
--     Function "reservering" (service role).
--   * Alleen ingelogde gebruikers in "staff" zien en wijzigen gegevens.
-- =============================================================

create extension if not exists pgcrypto;

-- ─── Tabellen ─────────────────────────────────────────────────────────────────

create table if not exists public.reservation_types (
  id           text primary key check (id ~ '^[a-z0-9_-]{2,30}$'),
  name         text not null check (char_length(name) between 1 and 40),
  description  text not null default '' check (char_length(description) <= 200),
  tag          text not null default '' check (char_length(tag) <= 60),
  active       boolean not null default true,
  sort_order   integer not null default 0,
  days         smallint[] not null default '{2,3,4,5,6,7}', -- ISO: 1 = maandag, 7 = zondag
  first_slot   text not null check (first_slot ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  last_slot    text not null check (last_slot ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  interval_min integer not null default 30 check (interval_min in (15, 30, 60)),
  check (last_slot >= first_slot),
  check (days <@ '{1,2,3,4,5,6,7}'::smallint[])
);

insert into public.reservation_types (id, name, description, tag, sort_order, days, first_slot, last_slot, interval_min) values
  ('lunch',   'Lunch',    'Belegde broodjes, salades, koffie & lekkers',   '',                       1, '{1,2,3,4,5,6}', '11:30', '15:00', 30),
  ('hightea', 'High Tea', 'Uitgebreide 3-gangen high tea op reservering', '',                       2, '{1,2,3,4,5,6}', '13:00', '15:00', 30),
  ('diner',   'Diner',    'We trekken alles uit de kast',                   'Alleen op vrijdagavond', 3, '{5}',           '17:30', '19:00', 30)
on conflict (id) do nothing;

create table if not exists public.opening_hours (
  isodow     smallint primary key check (isodow between 1 and 7),
  closed     boolean not null default false,
  open_time  text check (open_time is null or open_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  close_time text check (close_time is null or close_time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  note       text not null default '' check (char_length(note) <= 60),
  highlight  boolean not null default false
);

insert into public.opening_hours (isodow, closed, open_time, close_time, note, highlight) values
  (1, false, '10:00', '17:30', '',            false),
  (2, false, '10:00', '17:30', '',            false),
  (3, false, '10:00', '17:30', '',            false),
  (4, false, '10:00', '17:30', '',            false),
  (5, false, '10:00', '21:00', 'Diner-avond', true),
  (6, false, '10:00', '17:00', '',            false),
  (7, false, '11:00', '17:00', 'Alleen koopzondag (laatste zondag van de maand)', false)
on conflict (isodow) do nothing;

create table if not exists public.reservations (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  name              text not null check (char_length(name) between 1 and 100),
  email             text check (email is null or char_length(email) between 3 and 254),
  phone             text not null default '' check (char_length(phone) <= 40),
  date              date not null,
  time              text not null check (time ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  guests            integer not null check (guests between 1 and 500),
  reservation_type  text not null references public.reservation_types (id) on update cascade,
  message           text check (message is null or char_length(message) <= 1000),
  status            text not null default 'aangevraagd'
                    check (status in ('aangevraagd', 'bevestigd', 'geannuleerd')),
  cancelled_by      text check (cancelled_by is null or cancelled_by in ('gast', 'cafe')),
  source            text not null default 'website' check (source in ('website', 'cafe')),
  marketing_consent boolean not null default false
);

create index if not exists reservations_date_idx on public.reservations (date, time);
create index if not exists reservations_email_created_idx on public.reservations (lower(email), created_at);

create table if not exists public.blocked_slots (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date       date not null,
  time_from  text check (time_from is null or time_from ~ '^([01]\d|2[0-3]):[0-5]\d$'), -- null = hele dag dicht
  time_to    text check (time_to is null or time_to ~ '^([01]\d|2[0-3]):[0-5]\d$'),     -- null = tot einde dag
  reason     text check (reason is null or char_length(reason) <= 200)
);

create index if not exists blocked_slots_date_idx on public.blocked_slots (date);

-- Een rij, id = 1.
create table if not exists public.settings (
  id                 integer primary key default 1 check (id = 1),
  max_guests_window  integer not null default 40  check (max_guests_window between 1 and 1000),
  table_minutes      integer not null default 120 check (table_minutes between 30 and 480),
  max_guests_online  integer not null default 8   check (max_guests_online between 1 and 50),
  min_minutes_ahead  integer not null default 60  check (min_minutes_ahead between 0 and 10080),
  max_days_ahead     integer not null default 180 check (max_days_ahead between 1 and 730),
  auto_confirm       boolean not null default false,
  notify_email       text not null default 'info@lunchcafezusenzo.nl' check (notify_email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  ask_marketing      boolean not null default true,
  marketing_text     text not null default 'Ja, stuur me af en toe nieuws en acties van Zus & Zo per mail. Afmelden kan altijd.'
                     check (char_length(marketing_text) between 10 and 300),
  updated_at         timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.subscribers (
  email           text primary key check (email = lower(email) and email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  name            text check (name is null or char_length(name) <= 100),
  created_at      timestamptz not null default now(),
  consent_at      timestamptz not null default now(),
  consent_text    text not null,
  source          text not null default 'reservering',
  token           uuid not null unique default gen_random_uuid(),
  unsubscribed_at timestamptz
);

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

create or replace function public.to_min(p_time text)
returns integer
language sql
immutable
as $$ select split_part(p_time, ':', 1)::int * 60 + split_part(p_time, ':', 2)::int; $$;

-- Tijdsloten voor een soort op een datum, volgens reservation_types en
-- opening_hours (een dag die dicht staat heeft geen sloten).
create or replace function public.slots_for(p_type text, p_date date)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(to_char(make_time(m / 60, m % 60, 0), 'HH24:MI') order by m), array[]::text[])
    from public.reservation_types t
    join public.opening_hours h on h.isodow = extract(isodow from p_date)
    cross join lateral generate_series(public.to_min(t.first_slot), public.to_min(t.last_slot), t.interval_min) as m
   where t.id = p_type
     and t.active
     and not h.closed
     and extract(isodow from p_date)::smallint = any (t.days);
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

-- Hoogste aantal gasten tegelijk binnen, als er p_extra gasten om p_time
-- binnenkomen. Een tafel is bezet gedurende settings.table_minutes. We
-- kijken naar elk moment waarop er iemand binnenkomt tijdens het bezoek van
-- de nieuwe gasten.
create or replace function public.window_load(p_date date, p_time text, p_extra integer default 0)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with s as (select table_minutes as dur from public.settings where id = 1),
  r as (
    select public.to_min(time) as t, guests
      from public.reservations
     where date = p_date and status <> 'geannuleerd'
  ),
  moments as (
    select public.to_min(p_time) as x
    union
    select r.t from r, s where r.t >= public.to_min(p_time) and r.t < public.to_min(p_time) + s.dur
  )
  select coalesce(max(
           (select coalesce(sum(r.guests), 0) from r, s where r.t > m.x - s.dur and r.t <= m.x)
         ), 0)::int + coalesce(p_extra, 0)
    from moments m;
$$;

-- ─── Publiek: instellingen voor de website ────────────────────────────────────
create or replace function public.get_public_config()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'types', coalesce((
      select json_agg(json_build_object(
               'id', id, 'name', name, 'description', description, 'tag', tag,
               'days', days, 'first_slot', first_slot, 'last_slot', last_slot,
               'interval_min', interval_min) order by sort_order, name)
        from public.reservation_types where active), '[]'::json),
    'hours', (
      select json_agg(json_build_object(
               'isodow', isodow, 'closed', closed, 'open_time', open_time,
               'close_time', close_time, 'note', note, 'highlight', highlight) order by isodow)
        from public.opening_hours),
    'settings', (
      select json_build_object(
               'max_guests_online', max_guests_online, 'min_minutes_ahead', min_minutes_ahead,
               'max_days_ahead', max_days_ahead, 'ask_marketing', ask_marketing,
               'marketing_text', marketing_text, 'auto_confirm', auto_confirm)
        from public.settings where id = 1)
  );
$$;

-- ─── Publiek: beschikbaarheid ─────────────────────────────────────────────────
-- Per tijdslot of er nog plek is voor p_guests personen. Geen aantallen,
-- geen persoonsgegevens.
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
  g        integer := greatest(1, least(coalesce(p_guests, 2), 1000));
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

-- ─── Reservering door een gast (alleen via de Edge Function) ──────────────────
-- Foutcodes:
--   P0001 vol         P0002 gesloten       P0003 ongeldige invoer
--   P0007 te veel aanvragen vanaf dit e-mailadres
drop function if exists public.create_reservation(text, text, text, date, text, integer, text, text);
create or replace function public.create_reservation(
  p_name      text,
  p_email     text,
  p_phone     text,
  p_date      date,
  p_time      text,
  p_guests    integer,
  p_type      text,
  p_message   text default null,
  p_marketing boolean default false
)
returns table (id uuid, status text, unsubscribe_token uuid)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  s       public.settings%rowtype;
  new_id  uuid;
  new_st  text;
  tok     uuid;
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
    from public.reservations r
   where lower(r.email) = p_email
     and r.created_at > now() - interval '1 hour';
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

  new_st := case when s.auto_confirm then 'bevestigd' else 'aangevraagd' end;

  insert into public.reservations (name, email, phone, date, time, guests, reservation_type, message, status, marketing_consent)
  values (left(p_name, 100), p_email, left(p_phone, 40), p_date, p_time, p_guests, p_type, left(p_message, 1000),
          new_st, coalesce(p_marketing, false) and s.ask_marketing)
  returning reservations.id into new_id;

  -- Toestemming voor nieuws: alleen als de gast het vinkje zelf aanzette.
  if coalesce(p_marketing, false) and s.ask_marketing then
    insert into public.subscribers (email, name, consent_at, consent_text, source)
    values (p_email, left(p_name, 100), now(), s.marketing_text, 'reservering')
    on conflict (email) do update
      set name = excluded.name,
          consent_at = now(),
          consent_text = excluded.consent_text,
          unsubscribed_at = null
    returning subscribers.token into tok;
  end if;

  return query select new_id, new_st, tok;
end;
$$;

-- ─── Reservering door het café (alleen via de Edge Function) ──────────────────
-- Nieuw (p_id null) of wijzigen. Geen capaciteitscontrole: het café beslist.
-- Foutcodes: P0003 ongeldig, P0004 niet gevonden
create or replace function public.staff_save_reservation(
  p_id      uuid,
  p_name    text,
  p_email   text,
  p_phone   text,
  p_date    date,
  p_time    text,
  p_guests  integer,
  p_type    text,
  p_message text default null,
  p_status  text default null
)
returns setof public.reservations
language plpgsql
security definer
set search_path = public
as $$
begin
  p_name    := nullif(btrim(p_name), '');
  p_email   := lower(nullif(btrim(p_email), ''));
  p_phone   := coalesce(btrim(p_phone), '');
  p_message := nullif(btrim(p_message), '');

  if p_name is null then
    raise exception 'Naam is verplicht' using errcode = 'P0003';
  end if;
  if p_email is not null and p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Ongeldig e-mailadres' using errcode = 'P0003';
  end if;
  if p_guests is null or p_guests < 1 or p_guests > 500 then
    raise exception 'Ongeldig aantal personen' using errcode = 'P0003';
  end if;
  if p_date is null or p_time is null or p_time !~ '^([01]\d|2[0-3]):[0-5]\d$' then
    raise exception 'Ongeldige datum of tijd' using errcode = 'P0003';
  end if;
  if not exists (select 1 from public.reservation_types where id = p_type) then
    raise exception 'Onbekend soort reservering' using errcode = 'P0003';
  end if;
  if p_status is not null and p_status not in ('aangevraagd', 'bevestigd', 'geannuleerd') then
    raise exception 'Ongeldige status' using errcode = 'P0003';
  end if;

  if p_id is null then
    return query
      insert into public.reservations (name, email, phone, date, time, guests, reservation_type, message, status, source)
      values (left(p_name, 100), p_email, left(p_phone, 40), p_date, p_time, p_guests, p_type, left(p_message, 1000),
              coalesce(p_status, 'bevestigd'), 'cafe')
      returning *;
  else
    return query
      update public.reservations
         set name = left(p_name, 100), email = p_email, phone = left(p_phone, 40), date = p_date,
             time = p_time, guests = p_guests, reservation_type = p_type, message = left(p_message, 1000),
             status = coalesce(p_status, status),
             cancelled_by = case
               when coalesce(p_status, status) <> 'geannuleerd' then null
               when status <> 'geannuleerd' then 'cafe'
               else cancelled_by
             end,
             updated_at = now()
       where id = p_id
      returning *;
    if not found then
      raise exception 'Reservering niet gevonden' using errcode = 'P0004';
    end if;
  end if;
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
  type_name        text,
  is_past          boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select r.name, r.date, r.time, r.guests, r.status, r.reservation_type, t.name,
         (r.date + r.time::time) < public.nl_now() as is_past
    from public.reservations r
    join public.reservation_types t on t.id = r.reservation_type
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
  reservation_type text,
  type_name        text
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
         cancelled_by = case when p_by = 'cafe' then 'cafe' else 'gast' end,
         updated_at = now()
   where id = p_id;

  return query
    select r.name, r.email, r.date, r.time, r.guests, r.reservation_type,
           (select t.name from public.reservation_types t where t.id = r.reservation_type);
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
  type_name        text,
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

  update public.reservations set status = 'bevestigd', updated_at = now() where id = p_id;

  return query
    select r.name, r.email, r.date, r.time, r.guests, r.reservation_type,
           (select t.name from public.reservation_types t where t.id = r.reservation_type), r.message;
end;
$$;

-- ─── Afmelden voor nieuws (alleen via de Edge Function) ───────────────────────
create or replace function public.unsubscribe(p_token uuid)
returns text
language sql
security definer
set search_path = public
as $$
  update public.subscribers
     set unsubscribed_at = coalesce(unsubscribed_at, now()), name = null
   where token = p_token
  returning email;
$$;

-- ─── Gegevens voor de mails (alleen via de Edge Function) ─────────────────────
create or replace function public.get_mail_settings()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'notify_email', (select notify_email from public.settings where id = 1),
    'types', (select json_object_agg(id, name) from public.reservation_types),
    'hours', (select json_agg(json_build_object('isodow', isodow, 'closed', closed,
                'open_time', open_time, 'close_time', close_time, 'note', note) order by isodow)
                from public.opening_hours)
  );
$$;

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

-- ─── Rechten ──────────────────────────────────────────────────────────────────

alter table public.reservations      enable row level security;
alter table public.reservation_types enable row level security;
alter table public.opening_hours     enable row level security;
alter table public.blocked_slots     enable row level security;
alter table public.settings          enable row level security;
alter table public.subscribers       enable row level security;
alter table public.staff             enable row level security;

-- Personeel mag alles in de beheertabellen. Status wijzigen en nieuwe
-- reserveringen lopen via de Edge Function (die ook de mails stuurt).
do $$
declare t text;
begin
  foreach t in array array['reservation_types', 'opening_hours', 'blocked_slots', 'settings', 'subscribers'] loop
    execute format('drop policy if exists staff_all on public.%I', t);
    execute format('create policy staff_all on public.%I for all to authenticated using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;

drop policy if exists staff_select on public.reservations;
create policy staff_select on public.reservations
  for select to authenticated using (public.is_staff());
drop policy if exists staff_update on public.reservations;
create policy staff_update on public.reservations
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Staff-tabel: personeel ziet de lijst; toevoegen en verwijderen via de
-- Edge Function (die ook het inlogaccount aanmaakt).
drop policy if exists staff_self on public.staff;
drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff
  for select to authenticated using (public.is_staff());

-- Supabase geeft anon en authenticated standaard alle rechten op nieuwe
-- tabellen. Eerst alles intrekken, dan alleen teruggeven wat nodig is.
revoke all on public.reservations, public.reservation_types, public.opening_hours, public.blocked_slots,
              public.settings, public.subscribers, public.staff from anon, authenticated;
grant all on public.reservations, public.reservation_types, public.opening_hours, public.blocked_slots,
             public.settings, public.subscribers, public.staff to service_role;
grant select, update on public.reservations to authenticated;
grant select, insert, update, delete on public.reservation_types, public.blocked_slots, public.subscribers to authenticated;
grant select, insert, update on public.opening_hours to authenticated;
grant select, update on public.settings to authenticated;
grant select on public.staff to authenticated;

-- Functies: standaard mag iedereen alles uitvoeren; dat zetten we dicht en
-- geven alleen gericht terug.
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.get_public_config() to anon, authenticated;
grant execute on function public.get_availability(date, text, integer) to anon, authenticated;
grant execute on function public.is_staff() to authenticated, service_role;

grant execute on function public.create_reservation(text, text, text, date, text, integer, text, text, boolean) to service_role;
grant execute on function public.staff_save_reservation(uuid, text, text, text, date, text, integer, text, text, text) to service_role;
grant execute on function public.get_reservation_for_cancel(uuid) to service_role;
grant execute on function public.cancel_reservation(uuid, text) to service_role;
grant execute on function public.confirm_reservation(uuid) to service_role;
grant execute on function public.unsubscribe(uuid) to service_role;
grant execute on function public.get_mail_settings() to service_role;
grant execute on function public.purge_old_reservations() to service_role;

-- Nieuwe functies in de toekomst niet automatisch openzetten.
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- Elke nacht om 03:17 opruimen met pg_cron (staat klaar in Supabase).
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

-- De REST-laag van Supabase meteen de nieuwe tabellen en functies laten zien.
notify pgrst, 'reload schema';
