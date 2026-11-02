# Reserveringssysteem Zus & Zo

Online reserveren met Supabase (database, inloggen, Edge Function) en Brevo
(mails). Het café regelt alles zelf in het beheer op `/beheer.html`; aan de
code hoeft niets meer te gebeuren.

## Installeren (één keer, ongeveer 10 minuten)

Nodig: Node 18 of nieuwer, een Supabase-account en een Brevo-account
(gratis, 300 mails per dag). Resend kan ook: kies dan *resend* als het script
ernaar vraagt.

1. **Supabase access token**: https://supabase.com/dashboard/account/tokens,
   *Generate new token*.
2. **Brevo API key**: https://app.brevo.com/settings/keys/api, *Generate a new
   API key*. En voor de mail "wachtwoord vergeten" een **SMTP key**:
   https://app.brevo.com/settings/keys/smtp, *Generate a new SMTP key*.
   Zet bij Brevo **Authorised IPs** uit
   (https://app.brevo.com/security/authorised_ips), anders weigert Brevo de
   mails die vanuit Supabase komen.
3. In de map van deze repo:

   ```bash
   node installeer/installeer.mjs
   ```

   Het script vraagt om de sleutels, het adres van de website en het
   e-mailadres van het café, en doet daarna alles zelf:

   | Stap | Wat |
   |---|---|
   | 1 | Supabase-project `zus-en-zo` aanmaken in Frankfurt (of een bestaand project gebruiken) |
   | 2 | Database inrichten met `supabase/schema.sql`, plus de nachtelijke opruimtaak |
   | 3 | Inloggen afschermen (alleen accounts die het café toevoegt) en wachtwoordmails in het Nederlands via Brevo (of Resend) |
   | 4 | Edge Function `reservering` uitrollen met de juiste secrets |
   | 5 | Inlogaccount voor het café aanmaken, met toegang tot het beheer |
   | 6 | `lunchcafezusenzo.nl` en de afzender aanmelden bij Brevo (of Resend) en de DNS-records tonen |
   | 7 | `src/config.js` invullen, alles controleren, en desgewenst committen en pushen |

4. **Het enige handwerk**: de DNS-records die het script toont (ook in
   `installeer/dns-records.txt`) bij de registrar van lunchcafezusenzo.nl
   zetten. Tot Brevo het domein heeft geverifieerd, gaan er geen mails uit;
   reserveren werkt wel.
5. Geef het café het adres van het beheer, het e-mailadres en het wachtwoord
   dat het script aan het eind toont (ook in `installeer/.installatie.json`,
   dat bestand gaat niet naar GitHub).

Het script mag je altijd opnieuw draaien, bijvoorbeeld om later alsnog de
mailsleutel toe te voegen of na een wijziging aan de code. Bestaande
reserveringen, instellingen en wachtwoorden blijven staan.

## Wat het café zelf regelt in het beheer

| Tabblad | Wat |
|---|---|
| **Reserveringen** | Bevestigen, wijzigen, annuleren. Telefonische reserveringen zelf invoeren (ook zonder e-mail, buiten de vaste tijden of boven de capaciteit). Werkt live bij. Weergaven *Per dag*, *Tafelplan* (tijdlijn per tafel, dubbele boekingen rood), *Te bevestigen* en *Komend*. Tafels koppelen (met voorstel voor een vrije tafel en waarschuwing bij te weinig plaatsen of dubbel boeken), interne notitie voor personeel en **Print dagoverzicht** ter vervanging van de papieren agenda. |
| **Tafels** | Eigen tafels aanmaken (ook in één keer, bijvoorbeeld 8 tafels van 4), plaatsen, ruimte (Binnen, Terras, ...), volgorde, aan of uit. |
| **Openingstijden** | Per dag open/dicht, tijden en een notitie. Staat meteen op de website en onder elke mail. Op een dichte dag kan niemand online reserveren. |
| **Soorten en tijden** | Lunch, high tea, diner en eventueel nieuwe soorten: naam, omschrijving, dagen, eerste en laatste tijd, elk kwartier/half uur/uur, aan of uit. |
| **Sluitingen** | Een hele dag of een deel ervan dicht (vakantie, besloten feest). |
| **Mailinglijst** | Gasten die zelf toestemming gaven. Zoeken, exporteren (CSV voor bijvoorbeeld MailChimp of Brevo), verwijderen. |
| **Instellingen** | Capaciteit (gasten tegelijk, hoe lang een tafel bezet is), maximaal per online reservering, termijnen, **automatisch bevestigen** aan/uit, adres voor meldingen, nieuwsbriefvraag aan/uit en de tekst ervan, en **collega's toegang geven of intrekken**. |

## Mailadressen en toestemming (AVG)

- Bij het reserveren staat een vinkje *"Ja, stuur me af en toe nieuws..."*.
  Het staat **standaard uit**; alleen wie het zelf aanzet komt op de lijst.
- Per aanmelding worden het moment en de exacte tekst van het vinkje
  opgeslagen, als bewijs van toestemming.
- In elke mail aan een aangemelde gast staat een afmeldlink
  (`#afmelden?token=...`). Afmelden haalt het adres van de lijst en wist de
  naam.
- Het privacybeleid op de site beschrijft dit (gegevens, grondslag
  toestemming, bewaren tot afmelden, intrekken via link of mail).
- Reserveringen zelf worden 6 maanden na het bezoek automatisch verwijderd,
  zoals het privacybeleid belooft.

## Hoe het werkt

1. De gast kiest soort, aantal personen, datum en tijd. Volle, gesloten of
   voorbije tijden zijn niet te kiezen.
2. De gast krijgt een mail. Standaard is dat "aanvraag ontvangen"; staat
   automatisch bevestigen aan, dan krijgt de gast meteen de bevestiging. Het
   café krijgt een mail met alle gegevens en een knop naar het beheer.
3. In het beheer drukt het café op *Bevestigen*; de gast krijgt de
   bevestiging.
4. In elke mail staat een annuleerlink. Annuleert de gast, dan krijgen gast
   en café een mail en is de plek weer vrij.

Vaste regels in de database (de website kan ze niet omzeilen): de dag moet
open zijn en bij de soort horen, de tijd moet een van de tijden van die soort
zijn, binnen de termijnen vallen, niet gesloten zijn en er moet plek zijn.
Maximaal 3 aanvragen per e-mailadres per uur, plus een spamval.

## Beveiliging

- Met de publieke sleutel op de website kun je alleen de openbare
  instellingen en de beschikbaarheid (ja/nee per tijd) opvragen. Lezen,
  schrijven en de interne functies geven "permission denied".
- Alleen accounts in de tabel `staff` zien gegevens. Een willekeurig
  Supabase-account ziet niets; aanmelden staat bovendien uit.
- Alle mails en statuswijzigingen lopen via de Edge Function. Personeelsacties
  controleren eerst het inlogtoken en daarna of het account personeel is.
- De mailsleutel (Brevo of Resend) en de service-sleutel staan alleen als secret in Supabase,
  nooit in de website of in GitHub.

## Bestanden

| Bestand | Wat |
|---|---|
| `installeer/installeer.mjs` | Installatiescript |
| `supabase/schema.sql` | Tabellen, regels, rechten en opruimtaak |
| `supabase/functions/reservering/index.ts` | Edge Function: reserveren, annuleren, afmelden, beheer, mails |
| `supabase/config.toml` | JWT-controle van de functie uit (de functie controleert zelf) |
| `src/config.js` | Supabase-adres en publieke sleutel (vult het script in) |
| `src/reserve-api.js` | Koppeling met Supabase, gedeeld door site en beheer |
| `src/reserve.jsx` | Reserveringsvenster op de site |
| `src/page-annuleren.jsx` | Annuleer- en afmeldpagina |
| `beheer.html`, `src/beheer.jsx`, `beheer.css` | Beheer |
| `.github/workflows/supabase-keepalive.yml` | Houdt het gratis Supabase-project wakker |

## Getest

Lokaal met Postgres 16, PostgREST en Deno, de onderdelen waarop Supabase
draait, plus een nagebootste Supabase Management API, Brevo API en Resend API:

- Het installatiescript van leeg tot werkend, en opnieuw draaien zonder
  schade.
- Database: alle regels, wijzigingen in openingstijden en soorten die direct
  doorwerken, capaciteit, automatisch bevestigen, toestemming, afmelden,
  opruimen, rechten voor bezoeker, ingelogde niet-medewerker en medewerker.
- Edge Function: 73 controles (inclusief tafels koppelen en interne notitie) (reserveren, foutmeldingen, bevestigen,
  telefonisch invoeren en wijzigen, annuleren, afmelden, collega's toevoegen
  en verwijderen, ontvangers en inhoud van alle mails).
- Browser (Nederlandse en Engelse apparaatinstelling, 1440, 390 en 320 breed):
  de hele route van de gast en elk tabblad van het beheer.
