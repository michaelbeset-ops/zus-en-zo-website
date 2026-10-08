# Reserveringssysteem Zus & Zo

Online reserveren met Supabase (database, inloggen en Edge Function) en Resend
(mails). De opzet komt van de module van Den Witten Haen, met strengere
beveiliging: bezoekers kunnen de database niet zelf lezen of beschrijven en
elke mail hoort bij een echte wijziging.

## Hoe het werkt

1. **Gast** kiest op de site soort (lunch, high tea, diner), aantal personen,
   datum en tijd. Volle of gesloten tijden zijn niet te kiezen.
2. De aanvraag komt binnen als **aangevraagd**. De gast krijgt een mail
   ("we hebben je aanvraag") en het café krijgt een mail met alle gegevens
   en een knop naar het beheer.
3. In het **beheer** (`/beheer.html`) drukt het café op *Bevestigen*. De gast
   krijgt dan de bevestigingsmail. *Annuleren* kan ook; de gast krijgt
   daar bericht van.
4. In elke mail aan de gast staat een **annuleerlink**. Annuleert de gast,
   dan krijgen gast en café een mail en is de plek weer vrij.

Regels (staan in de database, de site kan ze niet omzeilen):

| Regel | Waarde |
|---|---|
| Maandag | Gesloten |
| Lunch | Di t/m zo, 11:30 tot en met 15:00, elk half uur |
| High tea | Di t/m zo, 13:00 tot en met 15:00 |
| Diner | Alleen vrijdag, 17:30 tot en met 20:30 |
| Online per reservering | 1 tot 8 personen, vanaf 9 bellen |
| Capaciteit | Max. **40** gasten tegelijk in een blok van 2 uur [[AANLEVEREN: echt maximum van Zus & Zo]] |
| Vooruit | Minimaal 60 minuten, maximaal 180 dagen |
| Misbruik | Max. 3 aanvragen per e-mailadres per uur, plus een spamval |
| Opruimen | Reserveringen ouder dan 6 maanden worden elke nacht verwijderd (zoals in het privacybeleid staat) |

Capaciteit, maximum per reservering en de termijnen past het café zelf aan
in het beheer onder *Instellingen*. Sluitingen (vakantie, besloten feest)
staan onder *Sluitingen*. De tijdsloten zelf staan in `slots_for()` in
`supabase/schema.sql` en in `TIME_SLOTS` in `src/reserve.jsx`.

## Bestanden

| Bestand | Wat |
|---|---|
| `supabase/schema.sql` | Tabellen, regels en rechten. Eenmalig draaien. |
| `supabase/functions/reservering/index.ts` | Edge Function: aanmaken, annuleren, bevestigen, mails |
| `supabase/config.toml` | Zet JWT-controle van de functie uit (de functie controleert zelf) |
| `src/config.js` | Supabase-URL en publieke sleutel voor de site |
| `src/reserve-api.js`, `src/reserve.jsx` | Reserveringsvenster op de site |
| `src/page-annuleren.jsx` | Annuleerpagina (`#annuleren?id=...`) |
| `beheer.html`, `src/beheer.jsx`, `beheer.css` | Beheer voor het café |
| `.github/workflows/supabase-keepalive.yml` | Houdt het gratis project wakker |

## Live zetten (eenmalig, ongeveer 30 minuten)

### 1. Supabase-project

1. https://supabase.com, *New project*. Naam `zus-en-zo`, regio
   **Central EU (Frankfurt)** (gegevens blijven in de EU), sterk
   databasewachtwoord.
2. *SQL Editor*, *New query*: plak de hele inhoud van `supabase/schema.sql`
   en klik *Run*. Er mag "pg_cron niet beschikbaar" staan; zet dan onder
   *Database, Extensions* `pg_cron` aan en draai het bestand nog een keer
   (dat kan veilig).

### 2. Inloggen afschermen

1. *Authentication, Sign In / Providers*: zet **Allow new users to sign up
   uit**. Accounts maak jij aan.
2. *Authentication, URL Configuration*: zet *Site URL* op het adres van de
   site en voeg bij *Redirect URLs* `https://<adres>/beheer.html` toe (nodig
   voor "wachtwoord vergeten").

### 3. Mail via Resend

1. https://resend.com, account, *Domains*, *Add domain*:
   `lunchcafezusenzo.nl`, regio EU.
2. Resend toont DNS-records (SPF/MX en DKIM). Die zet je bij de registrar
   van lunchcafezusenzo.nl en daarna klik je *Verify*.
3. *API Keys*, *Create API key* (rechten: *Sending access*).

(Liever Brevo, zoals bij Den Witten Haen? Zet dan `BREVO_API_KEY` in plaats
van `RESEND_API_KEY`; de functie kan met allebei.)

### 4. Edge Function

Met de CLI (vanuit de map van deze repo):

```bash
npx supabase login
npx supabase functions deploy reservering --project-ref <project-ref>
```

Of in het dashboard: *Edge Functions*, *Deploy a new function*, *Via
Editor*, naam `reservering`, plak `supabase/functions/reservering/index.ts`,
en zet bij de instellingen **Verify JWT uit**.

Daarna *Edge Functions, Secrets*:

| Secret | Waarde |
|---|---|
| `RESEND_API_KEY` | sleutel uit stap 3 |
| `FROM_EMAIL` | `reserveren@lunchcafezusenzo.nl` (moet op het geverifieerde domein) |
| `RESTAURANT_EMAIL` | `info@lunchcafezusenzo.nl` (waar aanvragen binnenkomen) |
| `SITE_URL` | adres van de site zonder `/` aan het eind, bijv. `https://www.lunchcafezusenzo.nl` |

`SUPABASE_URL`, `SUPABASE_ANON_KEY` en `SUPABASE_SERVICE_ROLE_KEY` zet
Supabase zelf.

### 5. Account voor het café

1. *Authentication, Users, Add user, Create new user*: e-mail van het café,
   een tijdelijk wachtwoord, *Auto Confirm User* aan.
2. *SQL Editor*:

   ```sql
   insert into public.staff (user_id, note)
   select id, 'Eigenaar' from auth.users where email = 'info@lunchcafezusenzo.nl';
   ```

Alleen accounts in `staff` zien reserveringen. Toegang intrekken:
`delete from public.staff where user_id = (select id from auth.users where email = '...');`

### 6. Site koppelen

*Project Settings, API*: kopieer de *Project URL* en de **anon public**
(of *publishable*) key naar `src/config.js`. Commit en push. Nooit de
`service_role`- of secret-key in de site zetten.

### 7. Testen

1. Reserveer op de site met je eigen e-mailadres.
2. Controleer: mail "aanvraag ontvangen" bij jou, mail "nieuwe aanvraag" in
   de inbox van het café.
3. Log in op `/beheer.html`, druk *Bevestigen*: bevestigingsmail komt binnen.
4. Klik de annuleerlink in de mail en annuleer: beide kanten krijgen een mail.

Komt er geen mail? *Edge Functions, reservering, Logs* laat zien wat Resend
terugstuurde (meestal: domein nog niet geverifieerd of `FROM_EMAIL` niet op
dat domein).

## Getest

Lokaal met Postgres 16, PostgREST en Deno (zoals Supabase draait):

- Databaseregels: maandag dicht, diner alleen vrijdag, max. 8 personen,
  capaciteit, sluitingen, termijnen, rem op aanvragen, opruimen.
- Rechten: met de publieke sleutel kun je alleen beschikbaarheid opvragen.
  Lezen, schrijven of functies aanroepen geeft "permission denied". Een
  ingelogd account dat niet in `staff` staat, ziet niets en kan niets wijzigen.
- Edge Function: 31 end-to-end controles (aanmaken, foutmeldingen,
  bevestigen alleen door personeel, annuleren door gast en café, inhoud en
  ontvangers van de mails, HTML in invoer wordt onschadelijk gemaakt).
- Browser (Chromium, 1440 en 390 breed): hele boekingsflow, volle tijden
  dicht, annuleerpagina, beheer (inloggen, bevestigen, sluitingen,
  instellingen, geen toegang voor niet-personeel).
