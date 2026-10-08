// Supabase Edge Function: reservering
//
// Alles wat met een reservering gebeurt loopt hierlangs, zodat de database
// nooit rechtstreeks door bezoekers beschreven wordt en elke mail hoort bij
// een echte wijziging in de database.
//
// Acties (POST, JSON-body met "action"):
//   create        bezoeker   reservering aanmaken, mail naar gast + café
//   cancel-info   bezoeker   gegevens voor de annuleerpagina (id uit de mail)
//   cancel        bezoeker   annuleren via de link in de mail
//   unsubscribe   bezoeker   afmelden voor nieuws via de link in de mail
//   confirm       personeel  bevestigen, mail naar gast
//   staff-cancel  personeel  annuleren door het café, mail naar gast (optioneel)
//   staff-save    personeel  reservering invoeren of wijzigen, mail optioneel
//   team-list     personeel  wie heeft toegang tot het beheer
//   team-add      personeel  collega toegang geven (maakt inlogaccount)
//   team-remove   personeel  toegang intrekken
//
// Secrets (Supabase, Edge Functions, Secrets; zet installeer/installeer.mjs):
//   RESEND_API_KEY    (of BREVO_API_KEY) voor mail
//   FROM_EMAIL        afzender, standaard reserveren@lunchcafezusenzo.nl
//   SITE_URL          adres van de website
// Het adres voor meldingen aan het café staat in het beheer (Instellingen).
// Door Supabase zelf gezet: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Instellingen ─────────────────────────────────────────────────────────────

const env = (k: string, fallback = '') => Deno.env.get(k) || fallback

const SITE_URL = env('SITE_URL', 'https://michaelbeset-ops.github.io/zus-en-zo-website').replace(/\/+$/, '')

const CAFE = {
  name: 'Lunchcafé Zus & Zo',
  street: 'Raadhuisplein 37',
  city: '4873 BH Etten-Leur',
  phone: '076 504 1134',
  phoneHref: 'tel:+31765041134',
  email: 'info@lunchcafezusenzo.nl',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Lunchcaf%C3%A9+Zus+%26+Zo+Raadhuisplein+37+Etten-Leur',
}

const FROM_EMAIL = env('FROM_EMAIL', 'reserveren@lunchcafezusenzo.nl')
const FROM_NAME = CAFE.name

// Per verzoek opgehaald uit de database (beheer, Instellingen en Openingstijden).
type MailContext = { notifyEmail: string; hours: string; types: Record<string, string> }

const DAY_SHORT = ['', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

type HourRow = { isodow: number; closed: boolean; open_time: string | null; close_time: string | null }

// "Di t/m do 09:00 tot 17:00 · Vr 09:00 tot 22:00 · ... · Ma gesloten"
function hoursText(rows: HourRow[]): string {
  const label = (h: HourRow) => (h.closed || !h.open_time ? 'gesloten' : `${h.open_time} tot ${h.close_time ?? ''}`.trim())
  const sorted = [...rows].sort((a, b) => a.isodow - b.isodow)
  const groups: { from: number; to: number; text: string }[] = []
  for (const h of sorted) {
    const text = label(h)
    const last = groups[groups.length - 1]
    if (last && last.text === text && last.to === h.isodow - 1) last.to = h.isodow
    else groups.push({ from: h.isodow, to: h.isodow, text })
  }
  const open = groups.filter((g) => g.text !== 'gesloten')
  const closed = groups.filter((g) => g.text === 'gesloten')
  const days = (g: { from: number; to: number }) =>
    g.from === g.to ? DAY_SHORT[g.from] : `${DAY_SHORT[g.from]} ${g.to - g.from === 1 ? 'en' : 't/m'} ${DAY_SHORT[g.to].toLowerCase()}`
  return [...open.map((g) => `${days(g)} ${g.text}`), ...closed.map((g) => `${days(g)} gesloten`)].join(' · ')
}

async function mailContext(): Promise<MailContext> {
  const { data } = await rpc<{ notify_email: string; hours: HourRow[]; types: Record<string, string> }>('get_mail_settings', {})
  return {
    notifyEmail: data?.notify_email || env('RESTAURANT_EMAIL', CAFE.email),
    hours: data?.hours ? hoursText(data.hours) : '',
    types: data?.types ?? {},
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Alles wat een gast intypt gaat door escape() voordat het in de HTML komt.
const escape = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const nl2br = (v: string): string => escape(v).replace(/\r?\n/g, '<br>')

function formatDutchDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  const d = new Date(dateStr + 'T12:00:00Z')
  const s = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function shortDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

const guestsLabel = (n: number) => `${n} ${n === 1 ? 'persoon' : 'personen'}`
const cancelUrl = (id: string) => `${SITE_URL}/#annuleren?id=${encodeURIComponent(id)}`
const unsubscribeUrl = (token: string) => `${SITE_URL}/#afmelden?token=${encodeURIComponent(token)}`
const beheerUrl = () => `${SITE_URL}/beheer.html`

// Kleuren uit styles.css: aubergine, zand, warm bruin.
const C = {
  bg: '#E3D6C0',
  card: '#F4EAD6',
  ink: '#2A1F1A',
  text: '#5E4A3C',
  muted: '#8B7355',
  line: '#D2C2A2',
  accent: '#6B4E71',
  wash: '#EFE3CD',
}
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

// ─── Bouwstenen ───────────────────────────────────────────────────────────────

const wrapper = (ctx: MailContext, preheader: string, content: string, footerNote: string) => `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="color-scheme" content="light">
<title>${escape(CAFE.name)}</title>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${escape(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.bg};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border-radius:4px;overflow:hidden;">
        <tr>
          <td style="background-color:${C.accent};padding:28px 40px;">
            <p style="margin:0 0 4px 0;font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#E6D6E0;">Lunchcafé &middot; Etten-Leur</p>
            <p style="margin:0;font-family:${SANS};font-size:28px;font-weight:700;color:#F4EAD6;letter-spacing:-0.5px;">Zus <span style="font-style:italic;font-weight:400;color:#C9A875;">&amp;</span> Zo</p>
          </td>
        </tr>
        <tr><td style="padding:36px 40px 8px 40px;">${content}</td></tr>
        <tr>
          <td style="padding:22px 40px 30px 40px;border-top:1px solid ${C.line};font-family:${SANS};font-size:13px;color:${C.muted};line-height:1.8;">
            <p style="margin:0 0 14px 0;font-size:12px;">${footerNote}</p>
            <strong style="color:${C.ink};">${escape(CAFE.name)}</strong><br>
            <a href="${CAFE.mapsUrl}" style="color:${C.muted};text-decoration:none;">${escape(CAFE.street)}, ${escape(CAFE.city)}</a><br>
            <a href="${CAFE.phoneHref}" style="color:${C.accent};text-decoration:none;">${escape(CAFE.phone)}</a> &middot;
            <a href="mailto:${escape(CAFE.email)}" style="color:${C.accent};text-decoration:none;">${escape(CAFE.email)}</a>
            ${ctx.hours ? `<br><span>${escape(ctx.hours)}</span>` : ''}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

const row = (label: string, value: string, last = false) => `
      <tr>
        <td style="padding:12px 20px;${last ? '' : `border-bottom:1px solid ${C.line};`}">
          <span style="font-family:${SANS};font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};">${label}</span><br>
          <span style="font-family:${SANS};font-size:16px;color:${C.ink};display:block;margin-top:2px;line-height:1.4;">${value}</span>
        </td>
      </tr>`

const table = (rows: string) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.wash};border-left:3px solid ${C.accent};margin:0 0 24px 0;">
      ${rows}
    </table>`

const heading = (title: string, intro: string) => `
    <h1 style="margin:0 0 10px 0;font-family:${SANS};font-size:26px;font-weight:700;color:${C.ink};line-height:1.25;letter-spacing:-0.5px;">${title}</h1>
    <p style="margin:0 0 24px 0;font-family:${SANS};font-size:15px;color:${C.text};line-height:1.7;">${intro}</p>`

const para = (html: string) =>
  `<p style="margin:0 0 20px 0;font-family:${SANS};font-size:14px;color:${C.text};line-height:1.8;">${html}</p>`

const button = (href: string, label: string) => `
    <div style="margin:0 0 26px 0;">
      <a href="${href}" style="display:inline-block;background:${C.accent};color:#F4EAD6;font-family:${SANS};font-size:14px;font-weight:600;text-decoration:none;padding:13px 24px;border-radius:2px;">${label}</a>
    </div>`

const signOff = () => para(`Tot zo,<br><strong style="color:${C.ink};">${escape(CAFE.name)}</strong>`)

const link = (href: string, label: string) => `<a href="${href}" style="color:${C.accent};">${label}</a>`

type Res = {
  id?: string
  name: string
  email?: string | null
  phone?: string
  date: string
  time: string
  guests: number
  reservation_type: string
  type_name?: string
  message?: string | null
}

type Mail = { subject: string; html: string; text: string }

const typeName = (ctx: MailContext, r: Res) => r.type_name || ctx.types[r.reservation_type] || 'Reservering'

const detailRows = (ctx: MailContext, r: Res, withMessage = true) => [
  row('Reservering', escape(typeName(ctx, r))),
  row('Datum', escape(formatDutchDate(r.date))),
  row('Tijd', `${escape(r.time)} uur`),
  row('Aantal personen', escape(guestsLabel(r.guests)), !(withMessage && r.message)),
  withMessage && r.message ? row('Opmerking', nl2br(r.message), true) : '',
].join('')

const detailText = (ctx: MailContext, r: Res, withMessage = true) => [
  `Reservering:     ${typeName(ctx, r)}`,
  `Datum:           ${formatDutchDate(r.date)}`,
  `Tijd:            ${r.time} uur`,
  `Aantal personen: ${guestsLabel(r.guests)}`,
  withMessage && r.message ? `Opmerking:       ${r.message}` : null,
].filter((l) => l !== null) as string[]

const marketingNote = (token?: string | null) => token
  ? para(`Je hebt aangegeven dat je af en toe nieuws van ons wilt ontvangen. Bedacht? ${link(unsubscribeUrl(token), 'Meld je hier af')}.`)
  : ''

// ─── Mails naar de gast ───────────────────────────────────────────────────────

function mailReceived(ctx: MailContext, r: Res & { id: string }, token?: string | null): Mail {
  const d = formatDutchDate(r.date)
  return {
    subject: `Aanvraag ontvangen: ${typeName(ctx, r).toLowerCase()} op ${d.toLowerCase()} om ${r.time}`,
    html: wrapper(ctx,
      `${typeName(ctx, r)} voor ${guestsLabel(r.guests)} op ${d.toLowerCase()} om ${r.time}.`,
      `
      ${heading('We hebben je aanvraag', `Hoi ${escape(r.name)}, dank je wel! Hieronder staat wat je hebt aangevraagd.`)}
      ${table(detailRows(ctx, r))}
      ${para(`<strong style="color:${C.ink};">Wat gebeurt er nu?</strong><br>
        We kijken je aanvraag na en sturen je zo snel mogelijk een bevestiging. Hoor je binnen een dag niets,
        bel ons dan even op ${link(CAFE.phoneHref, escape(CAFE.phone))}.`)}
      ${para(`Kun je toch niet? ${link(cancelUrl(r.id), 'Annuleer je aanvraag online')}.`)}
      ${marketingNote(token)}
      ${signOff()}`,
      'Je krijgt deze mail omdat je via onze website een reservering hebt aangevraagd. Antwoorden op deze mail komen bij ons terecht.',
    ),
    text: [
      `Hoi ${r.name},`,
      '',
      'Dank je wel! We hebben je aanvraag ontvangen en sturen je zo snel mogelijk een bevestiging.',
      '',
      ...detailText(ctx, r),
      '',
      `Hoor je binnen een dag niets? Bel ${CAFE.phone}.`,
      `Annuleren kan via: ${cancelUrl(r.id)}`,
      token ? `Afmelden voor nieuws: ${unsubscribeUrl(token)}` : null,
      '',
      'Tot zo,',
      CAFE.name,
      `${CAFE.street}, ${CAFE.city}`,
    ].filter((l) => l !== null).join('\n'),
  }
}

function mailConfirmed(ctx: MailContext, r: Res & { id: string }, token?: string | null): Mail {
  const d = formatDutchDate(r.date)
  return {
    subject: `Bevestigd: ${typeName(ctx, r).toLowerCase()} op ${d.toLowerCase()} om ${r.time}`,
    html: wrapper(ctx,
      `Je reservering op ${d.toLowerCase()} om ${r.time} staat vast.`,
      `
      ${heading('Je reservering staat vast', `Hoi ${escape(r.name)}, leuk dat je komt! We houden een tafel voor je vrij.`)}
      ${table(detailRows(ctx, r))}
      ${para(`We zitten aan het ${link(CAFE.mapsUrl, `${escape(CAFE.street)} in Etten-Leur`)}.
        Iets wijzigen? Bel ${link(CAFE.phoneHref, escape(CAFE.phone))} of antwoord op deze mail.`)}
      ${para(`Kun je toch niet? ${link(cancelUrl(r.id), 'Annuleer je reservering online')}, dan geven we de tafel aan iemand anders.`)}
      ${marketingNote(token)}
      ${signOff()}`,
      'Je krijgt deze mail omdat je bij ons hebt gereserveerd. Antwoorden op deze mail komen bij ons terecht.',
    ),
    text: [
      `Hoi ${r.name},`,
      '',
      'Je reservering staat vast. Leuk dat je komt!',
      '',
      ...detailText(ctx, r),
      '',
      `Adres: ${CAFE.street}, ${CAFE.city}`,
      `Wijzigen? Bel ${CAFE.phone}.`,
      `Annuleren kan via: ${cancelUrl(r.id)}`,
      token ? `Afmelden voor nieuws: ${unsubscribeUrl(token)}` : null,
      '',
      'Tot zo,',
      CAFE.name,
    ].filter((l) => l !== null).join('\n'),
  }
}

function mailChanged(ctx: MailContext, r: Res & { id: string }): Mail {
  const d = formatDutchDate(r.date)
  return {
    subject: `Gewijzigd: je reservering op ${d.toLowerCase()} om ${r.time}`,
    html: wrapper(ctx,
      `Je reservering is aangepast: ${d.toLowerCase()} om ${r.time}.`,
      `
      ${heading('Je reservering is aangepast', `Hoi ${escape(r.name)}, we hebben je reservering bijgewerkt. Dit zijn de nieuwe gegevens.`)}
      ${table(detailRows(ctx, r))}
      ${para(`Klopt er iets niet? Bel ${link(CAFE.phoneHref, escape(CAFE.phone))} of antwoord op deze mail.`)}
      ${para(`Kun je toch niet? ${link(cancelUrl(r.id), 'Annuleer je reservering online')}.`)}
      ${signOff()}`,
      'Je krijgt deze mail omdat je reservering bij ons is aangepast.',
    ),
    text: [
      `Hoi ${r.name},`,
      '',
      'We hebben je reservering bijgewerkt. Dit zijn de nieuwe gegevens:',
      '',
      ...detailText(ctx, r),
      '',
      `Klopt er iets niet? Bel ${CAFE.phone}.`,
      `Annuleren kan via: ${cancelUrl(r.id)}`,
      '',
      CAFE.name,
    ].join('\n'),
  }
}

function mailCancelledToGuest(ctx: MailContext, r: Res, byGuest: boolean): Mail {
  const d = formatDutchDate(r.date)
  const intro = byGuest
    ? `Hoi ${escape(r.name)}, je hebt je reservering geannuleerd. Jammer, hopelijk tot een andere keer!`
    : `Hoi ${escape(r.name)}, helaas hebben we je reservering moeten annuleren. Bel ons gerust als je wilt weten waarom, of om samen een ander moment te kiezen.`
  return {
    subject: `Geannuleerd: je reservering op ${d.toLowerCase()} om ${r.time}`,
    html: wrapper(ctx,
      `Je reservering op ${d.toLowerCase()} om ${r.time} is geannuleerd.`,
      `
      ${heading('Je reservering is geannuleerd', intro)}
      ${table(detailRows(ctx, r, false))}
      ${button(`${SITE_URL}/`, 'Opnieuw reserveren')}
      ${para(`Vragen? Bel ${link(CAFE.phoneHref, escape(CAFE.phone))}.`)}
      ${signOff()}`,
      'Je krijgt deze mail omdat een reservering op jouw naam bij ons is geannuleerd.',
    ),
    text: [
      `Hoi ${r.name},`,
      '',
      byGuest
        ? 'Je hebt je reservering geannuleerd.'
        : 'Helaas hebben we je reservering moeten annuleren. Bel ons gerust om een ander moment te kiezen.',
      '',
      `${typeName(ctx, r)} op ${d} om ${r.time} uur, ${guestsLabel(r.guests)}.`,
      '',
      `Opnieuw reserveren: ${SITE_URL}/`,
      `Vragen? Bel ${CAFE.phone}.`,
      '',
      CAFE.name,
    ].join('\n'),
  }
}

// ─── Mails naar het café ──────────────────────────────────────────────────────

function mailNewToCafe(ctx: MailContext, r: Res & { id: string; email: string; phone: string }, autoConfirmed: boolean, subscribed: boolean): Mail {
  const phoneDigits = r.phone.replace(/[^\d+]/g, '')
  const label = autoConfirmed ? 'Nieuwe reservering' : 'Nieuwe aanvraag'
  return {
    subject: `${label}: ${typeName(ctx, r).toLowerCase()}, ${shortDate(r.date)} ${r.time}, ${guestsLabel(r.guests)} (${r.name})`,
    html: wrapper(ctx,
      `${r.name}, ${guestsLabel(r.guests)}, ${shortDate(r.date)} om ${r.time}.${autoConfirmed ? '' : ' Nog bevestigen.'}`,
      `
      ${heading(autoConfirmed ? 'Nieuwe reservering' : 'Nieuwe reserveringsaanvraag',
        autoConfirmed
          ? 'Deze reservering is <strong>automatisch bevestigd</strong> (zie Instellingen in het beheer). De gast heeft de bevestiging al.'
          : 'Deze aanvraag staat in het beheer op <strong>aangevraagd</strong>. De gast krijgt pas een bevestiging als je op Bevestigen drukt.')}
      ${table(
        row('Naam', escape(r.name)) +
        row('Telefoon', `<a href="tel:${escape(phoneDigits)}" style="color:${C.accent};text-decoration:none;">${escape(r.phone)}</a>`) +
        row('E-mail', `<a href="mailto:${escape(r.email)}" style="color:${C.accent};text-decoration:none;">${escape(r.email)}</a>${subscribed ? ' (wil nieuws ontvangen)' : ''}`) +
        detailRows(ctx, r),
      )}
      ${button(beheerUrl(), autoConfirmed ? 'Open het beheer' : 'Open het beheer om te bevestigen')}
      ${para('Antwoord je op deze mail, dan gaat je antwoord rechtstreeks naar de gast.')}`,
      'Automatisch verstuurd door het reserveringssysteem van de website.',
    ),
    text: [
      `${label} via de website`,
      '',
      `Naam:            ${r.name}`,
      `Telefoon:        ${r.phone}`,
      `E-mail:          ${r.email}${subscribed ? ' (wil nieuws ontvangen)' : ''}`,
      ...detailText(ctx, r),
      '',
      `${autoConfirmed ? 'Beheer' : 'Bevestigen in het beheer'}: ${beheerUrl()}`,
    ].join('\n'),
  }
}

function mailGuestCancelledToCafe(ctx: MailContext, r: Res): Mail {
  return {
    subject: `Geannuleerd door gast: ${r.name}, ${shortDate(r.date)} ${r.time}`,
    html: wrapper(ctx,
      `${r.name} heeft ${shortDate(r.date)} om ${r.time} geannuleerd.`,
      `
      ${heading('Een gast heeft geannuleerd', 'De reservering staat in het beheer al op geannuleerd en de plek is weer vrij. Je hoeft niets te doen.')}
      ${table(row('Naam', escape(r.name)) + detailRows(ctx, r, false))}`,
      'Automatisch verstuurd door het reserveringssysteem van de website.',
    ),
    text: [
      'Een gast heeft via de website geannuleerd.',
      '',
      `Naam:            ${r.name}`,
      ...detailText(ctx, r, false),
      '',
      'De plek is weer vrij.',
    ].join('\n'),
  }
}

// ─── Mail versturen (Resend, of Brevo als dat is ingesteld) ───────────────────

type Addr = { email: string; name?: string }

async function sendMail(to: Addr, replyTo: Addr, mail: Mail, tag: string): Promise<boolean> {
  const resendKey = env('RESEND_API_KEY')
  const brevoKey = env('BREVO_API_KEY')
  try {
    let res: Response
    if (resendKey) {
      res = await fetch(env('RESEND_API_URL', 'https://api.resend.com/emails'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [to.email],
          reply_to: replyTo.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          tags: [{ name: 'type', value: tag }],
        }),
      })
    } else if (brevoKey) {
      res = await fetch(env('BREVO_API_URL', 'https://api.brevo.com/v3/smtp/email'), {
        method: 'POST',
        headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: FROM_NAME, email: FROM_EMAIL },
          to: [to],
          replyTo,
          subject: mail.subject,
          htmlContent: mail.html,
          textContent: mail.text,
          tags: [tag],
        }),
      })
    } else {
      console.error('[reservering] Geen RESEND_API_KEY of BREVO_API_KEY ingesteld; mail niet verstuurd:', tag)
      return false
    }
    if (!res.ok) {
      console.error('[reservering] Mail mislukt:', tag, res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (e) {
    console.error('[reservering] Mail mislukt:', tag, e)
    return false
  }
}

// ─── Database en Auth (met de service role) ──────────────────────────────────

type DbError = { code?: string; message?: string }

function serviceHeaders(): Record<string, string> {
  const key = env('SUPABASE_SERVICE_ROLE_KEY')
  const h: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' }
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`
  return h
}

async function rest<T>(method: string, path: string, body?: unknown, extra: Record<string, string> = {}): Promise<{ data: T | null; error: DbError | null; status: number }> {
  try {
    const res = await fetch(`${env('SUPABASE_URL')}${path}`, {
      method,
      headers: { ...serviceHeaders(), ...extra },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    const data = text ? JSON.parse(text) : null
    if (!res.ok) return { data: null, error: (data as DbError) ?? { message: `HTTP ${res.status}` }, status: res.status }
    return { data: data as T, error: null, status: res.status }
  } catch (e) {
    return { data: null, error: { message: String(e) }, status: 0 }
  }
}

const rpc = <T>(fn: string, args: Record<string, unknown>) => rest<T>('POST', `/rest/v1/rpc/${fn}`, args)

// Ingelogd personeel? Eerst het token laten controleren door Supabase Auth,
// dan is_staff() met dat token (leest auth.uid()).
async function staffUser(req: Request): Promise<{ id: string; email: string } | null> {
  const auth = req.headers.get('Authorization') ?? ''
  if (!/^Bearer\s+eyJ/.test(auth)) return null
  const anon = env('SUPABASE_ANON_KEY')
  try {
    const u = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, { headers: { apikey: anon, Authorization: auth } })
    if (!u.ok) return null
    const user = await u.json()
    if (!user?.id) return null
    const s = await fetch(`${env('SUPABASE_URL')}/rest/v1/rpc/is_staff`, {
      method: 'POST',
      headers: { apikey: anon, Authorization: auth, 'Content-Type': 'application/json' },
      body: '{}',
    })
    if (!s.ok || (await s.json()) !== true) return null
    return { id: user.id, email: user.email ?? '' }
  } catch {
    return null
  }
}

// ─── Invoer ───────────────────────────────────────────────────────────────────

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254

// Databasefout naar een vaste code die de site kan vertalen.
const ERROR_CODES: Record<string, string> = {
  P0001: 'vol',
  P0002: 'gesloten',
  P0003: 'ongeldig',
  P0004: 'niet_gevonden',
  P0005: 'geannuleerd',
  P0006: 'voorbij',
  P0007: 'te_veel',
  P0008: 'al_bevestigd',
}
const dbFail = (error: DbError) => {
  const code = ERROR_CODES[error.code ?? ''] ?? 'fout'
  if (code === 'fout') console.error('[reservering] Databasefout:', JSON.stringify(error))
  return json({ ok: false, code }, code === 'fout' ? 500 : 400)
}

const cafeAddr = (ctx: MailContext) => ({ email: ctx.notifyEmail, name: CAFE.name })
const replyCafe = { email: CAFE.email, name: CAFE.name }

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handle(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ ok: false, code: 'methode' }, 405)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ ok: false, code: 'ongeldig' }, 400)
  }

  const action = str(body.action, 20)
  const id = str(body.id, 36)

  // ── Bezoekers ──

  if (action === 'create') {
    // Honeypot: een verborgen veld dat mensen niet invullen, bots wel.
    if (str(body.website)) return json({ ok: true, id: null, status: 'aangevraagd', mailed: false })

    const input = {
      p_name: str(body.name, 100),
      p_email: str(body.email, 254),
      p_phone: str(body.phone, 40),
      p_date: str(body.date, 10),
      p_time: str(body.time, 5),
      p_guests: Math.floor(Number(body.guests)) || 0,
      p_type: str(body.type, 30),
      p_message: str(body.message, 1000) || null,
      p_marketing: body.marketing === true,
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.p_date)) return json({ ok: false, code: 'ongeldig' }, 400)

    const { data, error } = await rpc<{ id: string; status: string; unsubscribe_token: string | null }[]>('create_reservation', input)
    const created = data?.[0]
    if (error || !created) return dbFail(error ?? {})

    const ctx = await mailContext()
    const r = {
      id: created.id,
      name: input.p_name,
      email: input.p_email.toLowerCase(),
      phone: input.p_phone,
      date: input.p_date,
      time: input.p_time,
      guests: input.p_guests,
      reservation_type: input.p_type,
      message: input.p_message,
    }
    const confirmed = created.status === 'bevestigd'
    const token = created.unsubscribe_token
    const [toGuest] = await Promise.all([
      sendMail({ email: r.email, name: r.name }, replyCafe,
        confirmed ? mailConfirmed(ctx, r, token) : mailReceived(ctx, r, token), confirmed ? 'confirmed' : 'received'),
      sendMail(cafeAddr(ctx), { email: r.email, name: r.name }, mailNewToCafe(ctx, r, confirmed, !!token), 'new'),
    ])
    return json({ ok: true, id: created.id, status: created.status, mailed: toGuest })
  }

  if (action === 'cancel-info') {
    if (!isUuid(id)) return json({ ok: false, code: 'niet_gevonden' }, 404)
    const { data, error } = await rpc<Res[]>('get_reservation_for_cancel', { p_id: id })
    if (error) return dbFail(error)
    const r = data?.[0]
    if (!r) return json({ ok: false, code: 'niet_gevonden' }, 404)
    return json({ ok: true, reservation: r })
  }

  if (action === 'cancel') {
    if (!isUuid(id)) return json({ ok: false, code: 'niet_gevonden' }, 404)
    const { data, error } = await rpc<Res[]>('cancel_reservation', { p_id: id, p_by: 'gast' })
    if (error) return dbFail(error)
    const r = data?.[0]
    if (r) {
      const ctx = await mailContext()
      await Promise.all([
        sendMail(cafeAddr(ctx), r.email ? { email: r.email, name: r.name } : replyCafe, mailGuestCancelledToCafe(ctx, r), 'guest_cancelled'),
        r.email ? sendMail({ email: r.email, name: r.name }, replyCafe, mailCancelledToGuest(ctx, r, true), 'cancelled') : Promise.resolve(false),
      ])
    }
    return json({ ok: true })
  }

  if (action === 'unsubscribe') {
    const token = str(body.token, 36)
    if (!isUuid(token)) return json({ ok: false, code: 'niet_gevonden' }, 404)
    const { data, error } = await rpc<string | null>('unsubscribe', { p_token: token })
    if (error) return dbFail(error)
    if (!data) return json({ ok: false, code: 'niet_gevonden' }, 404)
    return json({ ok: true })
  }

  // ── Personeel ──

  const staffActions = ['confirm', 'staff-cancel', 'staff-save', 'team-list', 'team-add', 'team-remove']
  if (!staffActions.includes(action)) return json({ ok: false, code: 'onbekende_actie' }, 400)

  const me = await staffUser(req)
  if (!me) return json({ ok: false, code: 'geen_toegang' }, 401)

  if (action === 'confirm') {
    if (!isUuid(id)) return json({ ok: false, code: 'niet_gevonden' }, 404)
    const { data, error } = await rpc<Res[]>('confirm_reservation', { p_id: id })
    if (error) return dbFail(error)
    const r = data?.[0]
    let mailed = false
    if (r?.email) {
      const ctx = await mailContext()
      mailed = await sendMail({ email: r.email, name: r.name }, replyCafe, mailConfirmed(ctx, { ...r, id }), 'confirmed')
    }
    return json({ ok: true, mailed, hasEmail: !!r?.email })
  }

  if (action === 'staff-cancel') {
    if (!isUuid(id)) return json({ ok: false, code: 'niet_gevonden' }, 404)
    const { data, error } = await rpc<Res[]>('cancel_reservation', { p_id: id, p_by: 'cafe' })
    if (error) return dbFail(error)
    const r = data?.[0]
    let mailed = false
    if (r?.email && body.notify !== false) {
      const ctx = await mailContext()
      mailed = await sendMail({ email: r.email, name: r.name }, replyCafe, mailCancelledToGuest(ctx, r, false), 'cancelled')
    }
    return json({ ok: true, mailed, hasEmail: !!r?.email })
  }

  if (action === 'staff-save') {
    const status = str(body.status, 20)
    const input = {
      p_id: id ? (isUuid(id) ? id : 'x') : null,
      p_name: str(body.name, 100),
      p_email: str(body.email, 254) || null,
      p_phone: str(body.phone, 40),
      p_date: str(body.date, 10),
      p_time: str(body.time, 5),
      p_guests: Math.floor(Number(body.guests)) || 0,
      p_type: str(body.type, 30),
      p_message: str(body.message, 1000) || null,
      p_status: status || null,
    }
    if (input.p_id === 'x') return json({ ok: false, code: 'niet_gevonden' }, 404)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.p_date)) return json({ ok: false, code: 'ongeldig' }, 400)
    const { data, error } = await rpc<(Res & { id: string; status: string })[]>('staff_save_reservation', input)
    if (error) return dbFail(error)
    const r = data?.[0]
    let mailed = false
    if (r?.email && body.notify === true && r.status !== 'geannuleerd') {
      const ctx = await mailContext()
      const mail = input.p_id ? mailChanged(ctx, r) : mailConfirmed(ctx, r)
      mailed = await sendMail({ email: r.email, name: r.name }, replyCafe, mail, input.p_id ? 'changed' : 'confirmed')
    }
    return json({ ok: true, id: r?.id, mailed })
  }

  if (action === 'team-list') {
    const staff = await rest<{ user_id: string; note: string | null; created_at: string }[]>('GET', '/rest/v1/staff?select=user_id,note,created_at&order=created_at')
    const users = await rest<{ users: { id: string; email: string; last_sign_in_at: string | null }[] }>('GET', '/auth/v1/admin/users?per_page=1000')
    if (staff.error || users.error) return json({ ok: false, code: 'fout' }, 500)
    const byId = new Map((users.data?.users ?? []).map((u) => [u.id, u]))
    return json({
      ok: true,
      me: me.id,
      team: (staff.data ?? []).map((s) => ({
        user_id: s.user_id,
        email: byId.get(s.user_id)?.email ?? '(onbekend)',
        note: s.note,
        last_sign_in_at: byId.get(s.user_id)?.last_sign_in_at ?? null,
      })),
    })
  }

  if (action === 'team-add') {
    const email = str(body.email, 254).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    const note = str(body.note, 60) || null
    if (!isEmail(email)) return json({ ok: false, code: 'ongeldig_email' }, 400)
    if (password.length < 8 || password.length > 72) return json({ ok: false, code: 'wachtwoord_kort' }, 400)

    let userId = ''
    const created = await rest<{ id: string }>('POST', '/auth/v1/admin/users', { email, password, email_confirm: true })
    if (created.data?.id) userId = created.data.id
    else {
      // Bestaat het account al? Dan alleen toegang geven.
      const list = await rest<{ users: { id: string; email: string }[] }>('GET', '/auth/v1/admin/users?per_page=1000')
      userId = list.data?.users.find((u) => (u.email ?? '').toLowerCase() === email)?.id ?? ''
      if (!userId) return json({ ok: false, code: 'fout' }, 500)
    }
    const ins = await rest('POST', '/rest/v1/staff', { user_id: userId, note }, { Prefer: 'resolution=ignore-duplicates' })
    if (ins.error) return json({ ok: false, code: 'fout' }, 500)
    return json({ ok: true, existing: !created.data?.id })
  }

  if (action === 'team-remove') {
    const userId = str(body.user_id, 36)
    if (!isUuid(userId)) return json({ ok: false, code: 'niet_gevonden' }, 404)
    if (userId === me.id) return json({ ok: false, code: 'jezelf' }, 400)
    const del = await rest('DELETE', `/rest/v1/staff?user_id=eq.${userId}`)
    if (del.error) return json({ ok: false, code: 'fout' }, 500)
    await rest('DELETE', `/auth/v1/admin/users/${userId}`)
    return json({ ok: true })
  }

  return json({ ok: false, code: 'onbekende_actie' }, 400)
}

Deno.serve(handle)
