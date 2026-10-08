// Supabase Edge Function: reservering
//
// Alles wat met een reservering gebeurt loopt hierlangs, zodat de database
// nooit rechtstreeks door bezoekers beschreven wordt en elke mail hoort bij
// een echte wijziging in de database.
//
// Acties (POST, JSON-body met "action"):
//   create        bezoeker   reservering aanmaken, mail naar gast + café
//   cancel-info   bezoeker   gegevens voor de annuleerpagina (via id uit de mail)
//   cancel        bezoeker   annuleren via de link in de mail, mail naar café + gast
//   confirm       personeel  bevestigen, mail naar gast
//   staff-cancel  personeel  annuleren door het café, mail naar gast
//
// Secrets (Supabase, Edge Functions, Secrets):
//   RESEND_API_KEY    (of BREVO_API_KEY) verplicht voor mail
//   FROM_EMAIL        afzender, standaard reserveren@lunchcafezusenzo.nl (domein geverifieerd bij Resend/Brevo)
//   RESTAURANT_EMAIL  inbox van het café, standaard info@lunchcafezusenzo.nl
//   SITE_URL          adres van de site, standaard https://michaelbeset-ops.github.io/zus-en-zo-website
// Door Supabase zelf gezet: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Instellingen ─────────────────────────────────────────────────────────────

const env = (k: string, fallback = '') => Deno.env.get(k) ?? fallback

const SITE_URL = env('SITE_URL', 'https://michaelbeset-ops.github.io/zus-en-zo-website').replace(/\/+$/, '')

const CAFE = {
  name: 'Lunchcafé Zus & Zo',
  street: 'Raadhuisplein 37',
  city: '4873 BH Etten-Leur',
  phone: '076 504 1134',
  phoneHref: 'tel:+31765041134',
  email: env('RESTAURANT_EMAIL', 'info@lunchcafezusenzo.nl'),
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Lunchcaf%C3%A9+Zus+%26+Zo+Raadhuisplein+37+Etten-Leur',
  hours: 'Di t/m za 09:00 tot 17:00 · Vr tot 22:00 · Zo 10:00 tot 16:00 · Ma gesloten',
}

const FROM_EMAIL = env('FROM_EMAIL', 'reserveren@lunchcafezusenzo.nl')
const FROM_NAME = CAFE.name

const TYPE_LABELS: Record<string, string> = {
  lunch: 'Lunch',
  hightea: 'High tea',
  diner: 'Vrijdagavond diner',
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
const typeLabel = (t: string) => TYPE_LABELS[t] ?? 'Reservering'
const cancelUrl = (id: string) => `${SITE_URL}/#annuleren?id=${encodeURIComponent(id)}`
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
  accentDeep: '#4D3853',
  wash: '#EFE3CD',
}
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"

// ─── Bouwstenen ───────────────────────────────────────────────────────────────

const wrapper = (preheader: string, content: string, footerNote: string) => `<!DOCTYPE html>
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
            <a href="mailto:${escape(CAFE.email)}" style="color:${C.accent};text-decoration:none;">${escape(CAFE.email)}</a><br>
            <span>${escape(CAFE.hours)}</span>
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
  email?: string
  phone?: string
  date: string
  time: string
  guests: number
  reservation_type: string
  message?: string | null
}

type Mail = { subject: string; html: string; text: string }

const detailRows = (r: Res, withMessage = true) => [
  row('Reservering', escape(typeLabel(r.reservation_type))),
  row('Datum', escape(formatDutchDate(r.date))),
  row('Tijd', `${escape(r.time)} uur`),
  row('Aantal personen', escape(guestsLabel(r.guests)), !(withMessage && r.message)),
  withMessage && r.message ? row('Opmerking', nl2br(r.message), true) : '',
].join('')

// ─── Mails naar de gast ───────────────────────────────────────────────────────

function mailReceived(r: Res & { id: string }): Mail {
  const d = formatDutchDate(r.date)
  return {
    subject: `Aanvraag ontvangen: ${typeLabel(r.reservation_type).toLowerCase()} op ${d.toLowerCase()} om ${r.time}`,
    html: wrapper(
      `${typeLabel(r.reservation_type)} voor ${guestsLabel(r.guests)} op ${d.toLowerCase()} om ${r.time}.`,
      `
      ${heading('We hebben je aanvraag', `Hoi ${escape(r.name)}, dank je wel! Hieronder staat wat je hebt aangevraagd.`)}
      ${table(detailRows(r))}
      ${para(`<strong style="color:${C.ink};">Wat gebeurt er nu?</strong><br>
        We kijken je aanvraag na en sturen je zo snel mogelijk een bevestiging. Hoor je binnen een dag niets,
        bel ons dan even op ${link(CAFE.phoneHref, escape(CAFE.phone))}.`)}
      ${para(`Kun je toch niet? ${link(cancelUrl(r.id), 'Annuleer je aanvraag online')}.`)}
      ${signOff()}`,
      'Je krijgt deze mail omdat je via onze website een reservering hebt aangevraagd. Antwoorden op deze mail komen bij ons terecht.',
    ),
    text: [
      `Hoi ${r.name},`,
      '',
      `Dank je wel! We hebben je aanvraag ontvangen en sturen je zo snel mogelijk een bevestiging.`,
      '',
      `Reservering:     ${typeLabel(r.reservation_type)}`,
      `Datum:           ${d}`,
      `Tijd:            ${r.time} uur`,
      `Aantal personen: ${guestsLabel(r.guests)}`,
      r.message ? `Opmerking:       ${r.message}` : null,
      '',
      `Hoor je binnen een dag niets? Bel ${CAFE.phone}.`,
      `Annuleren kan via: ${cancelUrl(r.id)}`,
      '',
      'Tot zo,',
      CAFE.name,
      `${CAFE.street}, ${CAFE.city}`,
    ].filter((l) => l !== null).join('\n'),
  }
}

function mailConfirmed(r: Res & { id: string }): Mail {
  const d = formatDutchDate(r.date)
  return {
    subject: `Bevestigd: ${typeLabel(r.reservation_type).toLowerCase()} op ${d.toLowerCase()} om ${r.time}`,
    html: wrapper(
      `Je reservering op ${d.toLowerCase()} om ${r.time} staat vast.`,
      `
      ${heading('Je reservering staat vast', `Hoi ${escape(r.name)}, leuk dat je komt! We houden een tafel voor je vrij.`)}
      ${table(detailRows(r) )}
      ${para(`We zitten aan het ${link(CAFE.mapsUrl, `${escape(CAFE.street)} in Etten-Leur`)}.
        Iets wijzigen? Bel ${link(CAFE.phoneHref, escape(CAFE.phone))} of antwoord op deze mail.`)}
      ${para(`Kun je toch niet? ${link(cancelUrl(r.id), 'Annuleer je reservering online')}, dan geven we de tafel aan iemand anders.`)}
      ${signOff()}`,
      'Je krijgt deze mail omdat je via onze website hebt gereserveerd. Antwoorden op deze mail komen bij ons terecht.',
    ),
    text: [
      `Hoi ${r.name},`,
      '',
      'Je reservering staat vast. Leuk dat je komt!',
      '',
      `Reservering:     ${typeLabel(r.reservation_type)}`,
      `Datum:           ${d}`,
      `Tijd:            ${r.time} uur`,
      `Aantal personen: ${guestsLabel(r.guests)}`,
      r.message ? `Opmerking:       ${r.message}` : null,
      '',
      `Adres: ${CAFE.street}, ${CAFE.city}`,
      `Wijzigen? Bel ${CAFE.phone}.`,
      `Annuleren kan via: ${cancelUrl(r.id)}`,
      '',
      'Tot zo,',
      CAFE.name,
    ].filter((l) => l !== null).join('\n'),
  }
}

function mailCancelledToGuest(r: Res, byGuest: boolean): Mail {
  const d = formatDutchDate(r.date)
  const intro = byGuest
    ? `Hoi ${escape(r.name)}, je hebt je reservering geannuleerd. Jammer, hopelijk tot een andere keer!`
    : `Hoi ${escape(r.name)}, helaas hebben we je reservering moeten annuleren. Bel ons gerust als je wilt weten waarom, of om samen een ander moment te kiezen.`
  return {
    subject: `Geannuleerd: je reservering op ${d.toLowerCase()} om ${r.time}`,
    html: wrapper(
      `Je reservering op ${d.toLowerCase()} om ${r.time} is geannuleerd.`,
      `
      ${heading('Je reservering is geannuleerd', intro)}
      ${table(detailRows(r, false))}
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
      `${typeLabel(r.reservation_type)} op ${d} om ${r.time} uur, ${guestsLabel(r.guests)}.`,
      '',
      `Opnieuw reserveren: ${SITE_URL}/`,
      `Vragen? Bel ${CAFE.phone}.`,
      '',
      CAFE.name,
    ].join('\n'),
  }
}

// ─── Mails naar het café ──────────────────────────────────────────────────────

function mailNewToCafe(r: Res & { id: string; email: string; phone: string }): Mail {
  const phoneDigits = r.phone.replace(/[^\d+]/g, '')
  return {
    subject: `Nieuwe aanvraag: ${typeLabel(r.reservation_type).toLowerCase()}, ${shortDate(r.date)} ${r.time}, ${guestsLabel(r.guests)} (${r.name})`,
    html: wrapper(
      `${r.name}, ${guestsLabel(r.guests)}, ${shortDate(r.date)} om ${r.time}. Nog bevestigen.`,
      `
      ${heading('Nieuwe reserveringsaanvraag', 'Deze aanvraag staat in het beheer op <strong>aangevraagd</strong>. De gast krijgt pas een bevestiging als je op Bevestigen drukt.')}
      ${table(
        row('Naam', escape(r.name)) +
        row('Telefoon', `<a href="tel:${escape(phoneDigits)}" style="color:${C.accent};text-decoration:none;">${escape(r.phone)}</a>`) +
        row('E-mail', `<a href="mailto:${escape(r.email)}" style="color:${C.accent};text-decoration:none;">${escape(r.email)}</a>`) +
        detailRows(r),
      )}
      ${button(beheerUrl(), 'Open het beheer om te bevestigen')}
      ${para('Antwoord je op deze mail, dan gaat je antwoord rechtstreeks naar de gast.')}`,
      'Automatisch verstuurd door het reserveringssysteem van de website.',
    ),
    text: [
      'Nieuwe reserveringsaanvraag via de website',
      '',
      `Naam:            ${r.name}`,
      `Telefoon:        ${r.phone}`,
      `E-mail:          ${r.email}`,
      `Reservering:     ${typeLabel(r.reservation_type)}`,
      `Datum:           ${formatDutchDate(r.date)}`,
      `Tijd:            ${r.time} uur`,
      `Aantal personen: ${guestsLabel(r.guests)}`,
      `Opmerking:       ${r.message || 'geen'}`,
      '',
      `Bevestigen in het beheer: ${beheerUrl()}`,
    ].join('\n'),
  }
}

function mailGuestCancelledToCafe(r: Res & { email: string }): Mail {
  return {
    subject: `Geannuleerd door gast: ${r.name}, ${shortDate(r.date)} ${r.time}`,
    html: wrapper(
      `${r.name} heeft ${shortDate(r.date)} om ${r.time} geannuleerd.`,
      `
      ${heading('Een gast heeft geannuleerd', 'De reservering staat in het beheer al op geannuleerd en de plek is weer vrij. Je hoeft niets te doen.')}
      ${table(row('Naam', escape(r.name)) + detailRows(r, false))}`,
      'Automatisch verstuurd door het reserveringssysteem van de website.',
    ),
    text: [
      'Een gast heeft via de website geannuleerd.',
      '',
      `Naam:  ${r.name}`,
      `Datum: ${formatDutchDate(r.date)}`,
      `Tijd:  ${r.time} uur`,
      `Pers.: ${r.guests}`,
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

// ─── Database (PostgREST, met de service role) ────────────────────────────────

type DbError = { code?: string; message?: string }

async function rpc<T>(fn: string, args: Record<string, unknown>, authHeader?: string): Promise<{ data: T | null; error: DbError | null }> {
  const url = env('SUPABASE_URL')
  const key = authHeader ? env('SUPABASE_ANON_KEY') : env('SUPABASE_SERVICE_ROLE_KEY')
  const headers: Record<string, string> = { apikey: key, 'Content-Type': 'application/json' }
  if (authHeader) headers.Authorization = authHeader
  else if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: JSON.stringify(args) })
    const body = await res.json().catch(() => null)
    if (!res.ok) return { data: null, error: (body as DbError) ?? { message: `HTTP ${res.status}` } }
    return { data: body as T, error: null }
  } catch (e) {
    return { data: null, error: { message: String(e) } }
  }
}

// Is de aanroeper ingelogd personeel? is_staff() leest auth.uid() uit het
// meegestuurde token, dus een verlopen of vreemd token geeft gewoon "nee".
async function isStaff(req: Request): Promise<boolean> {
  const auth = req.headers.get('Authorization') ?? ''
  if (!/^Bearer\s+eyJ/.test(auth)) return false
  const { data, error } = await rpc<boolean>('is_staff', {}, auth)
  return !error && data === true
}

// ─── Invoer ───────────────────────────────────────────────────────────────────

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)

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

  if (action === 'create') {
    // Honeypot: een verborgen veld dat mensen niet invullen, bots wel.
    if (str(body.website)) return json({ ok: true, id: null, mailed: false })

    const input = {
      p_name: str(body.name, 100),
      p_email: str(body.email, 254),
      p_phone: str(body.phone, 40),
      p_date: str(body.date, 10),
      p_time: str(body.time, 5),
      p_guests: Math.floor(Number(body.guests)) || 0,
      p_type: str(body.type, 10),
      p_message: str(body.message, 1000) || null,
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.p_date)) return json({ ok: false, code: 'ongeldig' }, 400)

    const { data: newId, error } = await rpc<string>('create_reservation', input)
    if (error || !newId) return dbFail(error ?? {})

    const r = {
      id: newId,
      name: input.p_name,
      email: input.p_email.toLowerCase(),
      phone: input.p_phone,
      date: input.p_date,
      time: input.p_time,
      guests: input.p_guests,
      reservation_type: input.p_type,
      message: input.p_message,
    }
    const [toGuest] = await Promise.all([
      sendMail({ email: r.email, name: r.name }, { email: CAFE.email, name: CAFE.name }, mailReceived(r), 'received'),
      sendMail({ email: CAFE.email, name: CAFE.name }, { email: r.email, name: r.name }, mailNewToCafe(r), 'new'),
    ])
    return json({ ok: true, id: newId, mailed: toGuest })
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
    const { data, error } = await rpc<(Res & { email: string })[]>('cancel_reservation', { p_id: id, p_by: 'gast' })
    if (error) return dbFail(error)
    const r = data?.[0]
    if (r) {
      await Promise.all([
        sendMail({ email: CAFE.email, name: CAFE.name }, { email: r.email, name: r.name }, mailGuestCancelledToCafe(r), 'guest_cancelled'),
        sendMail({ email: r.email, name: r.name }, { email: CAFE.email, name: CAFE.name }, mailCancelledToGuest(r, true), 'cancelled'),
      ])
    }
    return json({ ok: true })
  }

  if (action === 'confirm' || action === 'staff-cancel') {
    if (!(await isStaff(req))) return json({ ok: false, code: 'geen_toegang' }, 401)
    if (!isUuid(id)) return json({ ok: false, code: 'niet_gevonden' }, 404)

    if (action === 'confirm') {
      const { data, error } = await rpc<(Res & { email: string })[]>('confirm_reservation', { p_id: id })
      if (error) return dbFail(error)
      const r = data?.[0]
      const mailed = r
        ? await sendMail({ email: r.email, name: r.name }, { email: CAFE.email, name: CAFE.name }, mailConfirmed({ ...r, id }), 'confirmed')
        : false
      return json({ ok: true, mailed })
    }

    const { data, error } = await rpc<(Res & { email: string })[]>('cancel_reservation', { p_id: id, p_by: 'cafe' })
    if (error) return dbFail(error)
    const r = data?.[0]
    const notify = body.notify !== false
    const mailed = r && notify
      ? await sendMail({ email: r.email, name: r.name }, { email: CAFE.email, name: CAFE.name }, mailCancelledToGuest(r, false), 'cancelled')
      : false
    return json({ ok: true, mailed })
  }

  return json({ ok: false, code: 'onbekende_actie' }, 400)
}

Deno.serve(handle)
