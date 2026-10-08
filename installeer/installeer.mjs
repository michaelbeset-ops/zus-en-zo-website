#!/usr/bin/env node
// =============================================================
// Zus & Zo: reserveringssysteem in een keer installeren
// =============================================================
// Gebruik (in de map van deze repo, Node 18 of nieuwer):
//
//   node installeer/installeer.mjs
//
// Het script vraagt om een Supabase access token en (liefst) een Resend
// API key en doet daarna alles zelf:
//   1. Supabase-project aanmaken (of een bestaand project gebruiken)
//   2. Database inrichten (supabase/schema.sql)
//   3. Inloggen afschermen, wachtwoordmails in het Nederlands via Resend
//   4. Edge Function "reservering" uitrollen met de juiste secrets
//   5. Inlogaccount voor het café aanmaken
//   6. Maildomein bij Resend aanmelden en de DNS-records klaarzetten
//   7. src/config.js invullen en alles controleren
//
// Opnieuw draaien mag altijd: het gaat verder waar het was en laat
// bestaande gegevens staan. Gegevens van de installatie (project, wachtwoorden)
// komen in installeer/.installatie.json; dat bestand gaat niet naar GitHub.
// =============================================================

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import readline from 'node:readline/promises'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STATE_FILE = path.join(ROOT, 'installeer', '.installatie.json')
const DNS_FILE = path.join(ROOT, 'installeer', 'dns-records.txt')

const MGMT = (process.env.ZZ_MGMT_API || 'https://api.supabase.com').replace(/\/+$/, '')
const RESEND = (process.env.ZZ_RESEND_API || 'https://api.resend.com').replace(/\/+$/, '')
const DOMAIN = 'lunchcafezusenzo.nl'
const DEFAULTS = {
  site: 'https://michaelbeset-ops.github.io/zus-en-zo-website',
  cafeEmail: 'info@lunchcafezusenzo.nl',
  fromEmail: `reserveren@${DOMAIN}`,
  region: 'eu-central-1',
  projectName: 'zus-en-zo',
}

// ─── Uitvoer ──────────────────────────────────────────────────────────────────

const color = (c, s) => (process.stdout.isTTY ? `\x1b[${c}m${s}\x1b[0m` : s)
const step = (n, s) => console.log('\n' + color('1;35', `${n}. ${s}`))
const ok = (s) => console.log(color('32', '   ✓ ') + s)
const info = (s) => console.log('   ' + s)
const warn = (s) => console.log(color('33', '   ! ') + s)
const fail = (s) => { console.error('\n' + color('31', '✗ ' + s)); process.exit(1) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Invoer ───────────────────────────────────────────────────────────────────

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
async function ask(question, fallback = '', env) {
  if (env && process.env[env] !== undefined) return process.env[env]
  if (!rl) return fallback
  const a = (await rl.question(`   ${question}${fallback ? ` [${fallback}]` : ''}: `)).trim()
  return a || fallback
}

const password = (n = 20) => randomBytes(n).toString('base64url').slice(0, n)

async function loadState() {
  try { return JSON.parse(await readFile(STATE_FILE, 'utf8')) } catch { return {} }
}
async function saveState(s) {
  await writeFile(STATE_FILE, JSON.stringify(s, null, 2) + '\n', { mode: 0o600 })
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

async function http(method, url, { token, headers = {}, body, form } = {}) {
  const h = { ...headers }
  if (token) h.Authorization = `Bearer ${token}`
  let payload
  if (form) payload = form
  else if (body !== undefined) { h['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  let res
  try {
    res = await fetch(url, { method, headers: h, body: payload })
  } catch (e) {
    return { ok: false, status: 0, data: { message: String(e.cause?.message || e.message) } }
  }
  const text = await res.text()
  let data = text
  try { data = text ? JSON.parse(text) : null } catch { /* tekst */ }
  return { ok: res.ok, status: res.status, data }
}

const errText = (r) => (typeof r.data === 'string' ? r.data : r.data?.message || r.data?.msg || r.data?.error || JSON.stringify(r.data)).slice(0, 400)

// ─── Hoofdprogramma ───────────────────────────────────────────────────────────

async function main() {
  console.log(color('1', '\nZus & Zo · reserveringssysteem installeren\n'))
  const [maj] = process.versions.node.split('.').map(Number)
  if (maj < 18) fail(`Node 18 of nieuwer nodig (je hebt ${process.versions.node}).`)

  const state = await loadState()

  // ── Gegevens ──
  step(0, 'Gegevens')
  info('Supabase access token: https://supabase.com/dashboard/account/tokens, "Generate new token".')
  const sbToken = await ask('Supabase access token', '', 'SUPABASE_ACCESS_TOKEN')
  if (!sbToken) fail('Zonder Supabase access token kan het script niets doen.')
  info('Resend API key: https://resend.com/api-keys, "Create API key", rechten "Full access".')
  info('(Enter om over te slaan: dan werkt alles behalve de mails; later opnieuw draaien kan.)')
  const resendKey = await ask(state.resendSet ? 'Resend API key (Enter = de huidige houden)' : 'Resend API key', '', 'RESEND_API_KEY')
  const keepResend = !resendKey && !!state.resendSet
  const site = (await ask('Adres van de website', state.site || DEFAULTS.site, 'ZZ_SITE_URL')).replace(/\/+$/, '')
  const cafeEmail = (await ask('Inlog en meldingen voor het café (e-mail)', state.cafeEmail || DEFAULTS.cafeEmail, 'ZZ_CAFE_EMAIL')).toLowerCase()
  Object.assign(state, { site, cafeEmail })

  // ── 1. Project ──
  step(1, 'Supabase-project')
  let ref = process.env.ZZ_PROJECT_REF || state.ref
  if (!ref) {
    const existing = await ask('Project-ref van een bestaand project (Enter = nieuw project aanmaken)', '')
    ref = existing || ''
  }
  if (!ref) {
    const orgs = await http('GET', `${MGMT}/v1/organizations`, { token: sbToken })
    if (!orgs.ok) fail(`Supabase weigert het token (${orgs.status}): ${errText(orgs)}`)
    if (!orgs.data.length) fail('Geen Supabase-organisatie gevonden. Maak er eerst een aan op supabase.com.')
    let org = orgs.data[0]
    if (orgs.data.length > 1) {
      orgs.data.forEach((o, i) => info(`${i + 1}. ${o.name}`))
      const pick = Number(await ask('Welke organisatie (nummer)', '1', 'ZZ_ORG_NR')) || 1
      org = orgs.data[pick - 1] || org
    }
    state.dbPassword = state.dbPassword || password(24)
    const created = await http('POST', `${MGMT}/v1/projects`, {
      token: sbToken,
      body: { name: DEFAULTS.projectName, organization_id: org.id, db_pass: state.dbPassword, region: DEFAULTS.region },
    })
    if (!created.ok) fail(`Project aanmaken lukte niet (${created.status}): ${errText(created)}\n  Tip: op het gratis abonnement mag je maximaal 2 actieve projecten hebben.`)
    ref = created.data.id || created.data.ref
    state.ref = ref
    await saveState(state)
    ok(`Project aangemaakt in ${org.name} (regio Frankfurt): ${ref}`)
  } else {
    state.ref = ref
    await saveState(state)
    ok(`Bestaand project: ${ref}`)
  }

  info('Wachten tot het project klaar is (eerste keer duurt dat een paar minuten)…')
  for (let i = 0; ; i++) {
    const p = await http('GET', `${MGMT}/v1/projects/${ref}`, { token: sbToken })
    if (!p.ok) fail(`Project ${ref} niet gevonden of geen toegang (${p.status}): ${errText(p)}`)
    if (p.data.status === 'ACTIVE_HEALTHY') break
    if (i > 90) fail(`Project is na 15 minuten nog niet klaar (status ${p.data.status}). Draai het script later opnieuw.`)
    await sleep(10000)
  }
  ok('Project draait')
  const projectUrl = (process.env.ZZ_PROJECT_URL || `https://${ref}.supabase.co`).replace(/\/+$/, '')

  // ── 2. Database ──
  step(2, 'Database inrichten')
  const schema = await readFile(path.join(ROOT, 'supabase', 'schema.sql'), 'utf8')
  let q
  for (let i = 0; i < 12; i++) {
    q = await http('POST', `${MGMT}/v1/projects/${ref}/database/query`, { token: sbToken, body: { query: schema } })
    if (q.ok || (q.status !== 0 && q.status < 500 && q.status !== 404)) break
    await sleep(10000) // database start soms nog op
  }
  if (!q.ok) fail(`Database inrichten lukte niet (${q.status}): ${errText(q)}`)
  ok('Tabellen, regels en rechten staan klaar')
  const cron = await sql(sbToken, ref, "select count(*)::int as n from cron.job where jobname = 'zz-opruimen'").catch(() => null)
  if (cron && cron[0] && cron[0].n > 0) ok('Nachtelijke opruimtaak ingepland')
  else warn('Opruimtaak niet ingepland (pg_cron). Zet pg_cron aan bij Database, Extensions en draai het script opnieuw.')

  // ── API-sleutels ──
  const keys = await http('GET', `${MGMT}/v1/projects/${ref}/api-keys?reveal=true`, { token: sbToken })
  if (!keys.ok) fail(`API-sleutels ophalen lukte niet (${keys.status}): ${errText(keys)}`)
  const findKey = (names, types) => (keys.data.find((k) => names.includes(k.name)) || keys.data.find((k) => types.includes(k.type)) || {}).api_key
  const anonKey = findKey(['anon'], ['publishable'])
  const serviceKey = findKey(['service_role'], ['secret'])
  if (!anonKey || !serviceKey) fail('Kon de anon- en service-sleutel van het project niet vinden.')
  const svcHeaders = { apikey: serviceKey, ...(serviceKey.startsWith('eyJ') ? { Authorization: `Bearer ${serviceKey}` } : {}) }

  // ── 3. Inloggen ──
  step(3, 'Inloggen afschermen')
  const auth = {
    disable_signup: true,
    site_url: site,
    uri_allow_list: `${site}/beheer.html,${site}/**`,
    mailer_subjects_recovery: 'Nieuw wachtwoord voor het beheer van Zus & Zo',
    mailer_templates_recovery_content:
      '<p>Hoi,</p><p>Je hebt gevraagd om een nieuw wachtwoord voor het reserveringsbeheer van Lunchcafé Zus &amp; Zo.</p>' +
      '<p><a href="{{ .ConfirmationURL }}">Klik hier om een nieuw wachtwoord in te stellen</a></p>' +
      '<p>Heb je dit niet zelf gevraagd? Dan kun je deze mail negeren.</p>',
  }
  const useResend = resendKey || null
  if (useResend) {
    Object.assign(auth, {
      smtp_admin_email: DEFAULTS.fromEmail,
      smtp_host: 'smtp.resend.com',
      smtp_port: '465',
      smtp_user: 'resend',
      smtp_pass: useResend,
      smtp_sender_name: 'Lunchcafé Zus & Zo',
    })
  }
  const a = await http('PATCH', `${MGMT}/v1/projects/${ref}/config/auth`, { token: sbToken, body: auth })
  if (!a.ok) fail(`Inloginstellingen opslaan lukte niet (${a.status}): ${errText(a)}`)
  ok('Alleen accounts die het café zelf toevoegt kunnen inloggen')
  ok(useResend ? 'Wachtwoordmails gaan in het Nederlands via Resend' : keepResend ? 'Wachtwoordmails: instellingen van Resend ongewijzigd' : 'Wachtwoordmails staan in het Nederlands klaar (Resend nog niet ingesteld)')

  // ── 4. Edge Function ──
  step(4, 'Edge Function "reservering"')
  const secrets = [
    { name: 'FROM_EMAIL', value: DEFAULTS.fromEmail },
    { name: 'SITE_URL', value: site },
  ]
  if (useResend) secrets.push({ name: 'RESEND_API_KEY', value: useResend })
  const sec = await http('POST', `${MGMT}/v1/projects/${ref}/secrets`, { token: sbToken, body: secrets })
  if (!sec.ok) fail(`Secrets opslaan lukte niet (${sec.status}): ${errText(sec)}`)
  if (useResend) state.resendSet = true
  ok(`Secrets: ${secrets.map((s) => s.name).join(', ')}${keepResend ? ' (RESEND_API_KEY ongewijzigd)' : ''}`)

  const code = await readFile(path.join(ROOT, 'supabase', 'functions', 'reservering', 'index.ts'))
  const form = new FormData()
  form.append('metadata', JSON.stringify({ entrypoint_path: 'index.ts', name: 'reservering', verify_jwt: false }))
  form.append('file', new Blob([code], { type: 'application/typescript' }), 'index.ts')
  const dep = await http('POST', `${MGMT}/v1/projects/${ref}/functions/deploy?slug=reservering`, { token: sbToken, form })
  if (dep.ok) ok('Uitgerold (zonder JWT-controle; de functie controleert zelf wie wat mag)')
  else {
    warn(`Uitrollen via de API lukte niet (${dep.status}): ${errText(dep)}`)
    info('Nu via de Supabase CLI (npx)…')
    const r = spawnSync('npx', ['-y', 'supabase@latest', 'functions', 'deploy', 'reservering', '--project-ref', ref, '--no-verify-jwt', '--use-api'], {
      cwd: ROOT, stdio: 'inherit', env: { ...process.env, SUPABASE_ACCESS_TOKEN: sbToken }, shell: process.platform === 'win32',
    })
    if (r.status !== 0) fail('Uitrollen van de Edge Function lukte niet. Zie de melding hierboven.')
    ok('Uitgerold via de CLI')
  }

  // ── 5. Account café ──
  step(5, 'Inlogaccount voor het café')
  let userId = ''
  let newPassword = ''
  const list = await http('GET', `${projectUrl}/auth/v1/admin/users?per_page=1000`, { headers: svcHeaders })
  const found = list.ok ? (list.data.users || []).find((u) => (u.email || '').toLowerCase() === cafeEmail) : null
  if (found) {
    userId = found.id
    ok(`${cafeEmail} bestond al; wachtwoord ongewijzigd`)
  } else {
    newPassword = password(14)
    const u = await http('POST', `${projectUrl}/auth/v1/admin/users`, { headers: svcHeaders, body: { email: cafeEmail, password: newPassword, email_confirm: true } })
    if (!u.ok) fail(`Account aanmaken lukte niet (${u.status}): ${errText(u)}`)
    userId = u.data.id
    state.cafePassword = newPassword
    ok(`${cafeEmail} aangemaakt`)
  }
  if (!/^[0-9a-f-]{36}$/i.test(userId)) fail('Onverwacht antwoord bij het aanmaken van het account.')
  await sql(sbToken, ref, `insert into public.staff (user_id, note) values ('${userId}', 'Eigenaar') on conflict (user_id) do nothing;
    update public.settings set notify_email = '${cafeEmail.replace(/'/g, "''")}' where id = 1 and notify_email = 'info@lunchcafezusenzo.nl';`)
  ok('Heeft toegang tot het beheer; meldingen gaan naar dit adres')
  await saveState(state)

  // ── 6. Mail (Resend) ──
  step(6, `Maildomein ${DOMAIN}`)
  const rKey = useResend
  let dnsDone = false
  if (!rKey) {
    warn(keepResend ? 'Resend was al ingesteld; domein niet opnieuw gecontroleerd.' : 'Overgeslagen (geen Resend API key). Mails worden pas verstuurd na opnieuw draaien met een key.')
  } else {
    const doms = await http('GET', `${RESEND}/domains`, { token: rKey })
    let dom = doms.ok ? (doms.data.data || []).find((d) => d.name === DOMAIN) : null
    if (!doms.ok) warn(`Resend geeft geen toegang tot domeinen (${doms.status}). Gebruik een key met "Full access", of voeg ${DOMAIN} zelf toe op resend.com/domains.`)
    else {
      if (!dom) {
        const c = await http('POST', `${RESEND}/domains`, { token: rKey, body: { name: DOMAIN, region: 'eu-west-1' } })
        if (!c.ok) warn(`Domein aanmelden lukte niet (${c.status}): ${errText(c)}`)
        else dom = c.data
      }
      if (dom) {
        const d = await http('GET', `${RESEND}/domains/${dom.id}`, { token: rKey })
        const det = d.ok ? d.data : dom
        if (det.status === 'verified') { ok('Domein is geverifieerd; mails kunnen de deur uit'); dnsDone = true }
        else {
          if (d.ok) await http('POST', `${RESEND}/domains/${dom.id}/verify`, { token: rKey })
          const recs = det.records || []
          const lines = recs.map((r) => `${(r.type || r.record || '').padEnd(5)}  naam: ${r.name}\n       waarde: ${r.value}${r.priority !== undefined ? `\n       prioriteit: ${r.priority}` : ''}${r.ttl ? `\n       ttl: ${r.ttl}` : ''}`)
          const text = `DNS-records voor ${DOMAIN} (zet ze bij de registrar van ${DOMAIN}):\n\n${lines.join('\n\n')}\n\nDaarna verifieert Resend het domein vanzelf (meestal binnen een uur).\nControleren: resend.com/domains, of dit script opnieuw draaien.\n`
          await writeFile(DNS_FILE, text)
          warn(`Nog niet geverifieerd. Zet deze ${recs.length} DNS-records bij de registrar (ook opgeslagen in installeer/dns-records.txt):`)
          console.log('\n' + text.split('\n').map((l) => '     ' + l).join('\n'))
        }
      }
    }
  }

  // ── 7. Website koppelen en controleren ──
  step(7, 'Website koppelen en controleren')
  const cfgPath = path.join(ROOT, 'src', 'config.js')
  let cfg = await readFile(cfgPath, 'utf8')
  cfg = cfg.replace(/supabaseUrl:\s*"[^"]*"/, `supabaseUrl: "${projectUrl}"`).replace(/supabaseAnonKey:\s*"[^"]*"/, `supabaseAnonKey: "${anonKey}"`)
  await writeFile(cfgPath, cfg)
  ok('src/config.js ingevuld')

  const anonHeaders = { apikey: anonKey, ...(anonKey.startsWith('eyJ') ? { Authorization: `Bearer ${anonKey}` } : {}) }
  let pc
  for (let i = 0; i < 12; i++) {
    pc = await http('POST', `${projectUrl}/rest/v1/rpc/get_public_config`, { headers: anonHeaders, body: {} })
    if (pc.ok && Array.isArray(pc.data?.types)) break
    await sleep(5000) // Supabase ververst de lijst met functies na een paar seconden
  }
  if (!pc.ok || !Array.isArray(pc.data?.types)) fail(`Controle mislukt: openbare instellingen niet bereikbaar (${pc.status}): ${errText(pc)}`)
  ok(`Website kan instellingen lezen (${pc.data.types.length} soorten reservering)`)
  const leak = await http('GET', `${projectUrl}/rest/v1/reservations?select=id&limit=1`, { headers: anonHeaders })
  if (leak.ok) fail('Controle mislukt: reserveringen zijn openbaar leesbaar. Neem contact op met Sitefront.')
  ok('Reserveringen zijn afgeschermd voor bezoekers')
  let fnOk = false
  for (let i = 0; i < 6 && !fnOk; i++) {
    const f = await http('POST', `${projectUrl}/functions/v1/reservering`, { headers: anonHeaders, body: { action: 'cancel-info', id: '00000000-0000-0000-0000-000000000000' } })
    fnOk = f.data && f.data.code === 'niet_gevonden'
    if (!fnOk) await sleep(5000)
  }
  if (!fnOk) fail('Controle mislukt: de Edge Function reageert niet zoals verwacht. Draai het script over een minuut opnieuw.')
  ok('Edge Function werkt en praat met de database')

  // ── Klaar ──
  if (existsSync(path.join(ROOT, '.git')) && rl) {
    const push = (await ask('src/config.js nu committen en pushen naar GitHub? (j/n)', 'j')).toLowerCase()
    if (push.startsWith('j')) {
      const g = (args) => spawnSync('git', args, { cwd: ROOT, stdio: 'inherit' }).status === 0
      if (g(['add', 'src/config.js']) && g(['commit', '-m', 'Reserveringssysteem gekoppeld aan Supabase']) && g(['push'])) ok('Gepusht; de website gebruikt de koppeling zodra GitHub Pages bijgewerkt is')
      else warn('Committen of pushen lukte niet; doe het zelf: git add src/config.js && git commit -m "Koppeling" && git push')
    }
  }

  console.log('\n' + color('1;32', 'Klaar!') + '\n')
  console.log(`   Beheer:     ${site}/beheer.html`)
  console.log(`   Inloggen:   ${cafeEmail}`)
  if (newPassword) console.log(`   Wachtwoord: ${newPassword}   (geef dit aan het café; ook opgeslagen in installeer/.installatie.json)`)
  if (!rKey && !keepResend) console.log(color('33', '\n   Mails staan nog uit: draai het script opnieuw met een Resend API key.'))
  else if (rKey && !dnsDone) console.log(color('33', `\n   Nog te doen: de DNS-records hierboven bij de registrar van ${DOMAIN} zetten.`))
  console.log('')
  rl?.close()
}

async function sql(token, ref, query) {
  const r = await http('POST', `${MGMT}/v1/projects/${ref}/database/query`, { token, body: { query } })
  if (!r.ok) throw new Error(`SQL mislukt (${r.status}): ${errText(r)}`)
  return r.data
}

main().catch((e) => fail(e.stack || String(e)))
