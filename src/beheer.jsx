/* global window, React, ReactDOM */
// =============================================================
// Beheer van Zus & Zo. Alles wat het café zelf moet kunnen regelen:
// reserveringen (ook telefonische), openingstijden, tijden per soort,
// sluitingen, mailinglijst, instellingen en wie er toegang heeft.
// Alleen voor personeel (tabel staff, zie supabase/schema.sql).
// =============================================================
const { useState, useEffect, useCallback } = React;

const api = window.ReserveApi;
const sb = api.configured && window.supabase
  ? window.supabase.createClient(api.url, api.key, { auth: { persistSession: true, detectSessionInUrl: true } })
  : null;

const STATUS_LABEL = { aangevraagd: "Aangevraagd", bevestigd: "Bevestigd", geannuleerd: "Geannuleerd" };
const DAY_SHORT = ["", "Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const DAY_LONG = ["", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const todayStr = () => api.localDate(new Date());
const addDays = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return api.localDate(d); };
const fmtLong = (s) => {
  const t = new Date(s + "T12:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const fmtShort = (s) => new Date(s + "T12:00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
const fmtStamp = (s) => s ? new Date(s).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "";
const plural = (n, one, more) => `${n} ${n === 1 ? one : more}`;
const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30);

// Supabase-fout naar een zin.
const dbMessage = (error, fallback) => {
  if (!error) return "";
  if (error.code === "23503") return "Dit is nog in gebruik bij bestaande reserveringen. Zet het op niet actief in plaats van het te verwijderen.";
  if (error.code === "23514" || error.code === "22P02") return "Een van de waarden klopt niet. Kijk de velden nog even na.";
  if (error.code === "23505") return "Dit bestaat al.";
  return fallback;
};

// Tijdveld dat altijd 24-uurs werkt, ook op een Engelstalig apparaat.
// Accepteert 9, 930, 0930, 9:30, 9.30 en maakt er 09:30 van.
function normTime(v) {
  const t = String(v || "").trim().replace(/[.,h ]/g, ":");
  let m = t.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!m) { const d = t.replace(/\D/g, ""); if (d.length <= 2 && d) m = [0, d, "0"]; else if (d.length === 3 || d.length === 4) m = [0, d.slice(0, d.length - 2), d.slice(-2)]; }
  if (!m) return t;
  const h = Number(m[1]), min = Number(m[2]);
  if (h > 23 || min > 59) return t;
  return String(h).padStart(2, "0") + ":" + String(min).padStart(2, "0");
}

function TimeField({ id, value, onChange, disabled, label }) {
  return (
    <input
      id={id} className="text-input bh-time" type="text" inputMode="numeric" autoComplete="off"
      placeholder="uu:mm" maxLength={5} value={value || ""} disabled={disabled} aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onChange(normTime(e.target.value))}
    />
  );
}

function Alert({ kind, children, onClose }) {
  if (!children) return null;
  return (
    <div className={"callout" + (kind === "error" ? " callout-error" : "")} role={kind === "error" ? "alert" : "status"}>
      {children}
      {onClose && <button className="bh-x" onClick={onClose} aria-label="Melding sluiten">×</button>}
    </div>
  );
}

// ─── Inloggen ─────────────────────────────────────────────────────────────────

function BrandMark() {
  return <p className="bh-brand">Zus <span>&amp;</span> Zo <small>Beheer</small></p>;
}

function Login() {
  const [mode, setMode] = useState("login"); // login | vergeten | verstuurd
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError("Onjuist e-mailadres of wachtwoord.");
  };

  const forgot = async (e) => {
    e.preventDefault();
    setBusy(true);
    const redirectTo = window.location.origin + window.location.pathname;
    await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setBusy(false);
    setMode("verstuurd");
  };

  return (
    <div className="bh-center">
      <div className="bh-card bh-login">
        <BrandMark />
        <h1 className="bh-h1">{mode === "login" ? "Inloggen" : "Wachtwoord vergeten"}</h1>
        {mode === "verstuurd" ? (
          <React.Fragment>
            <p className="bh-muted">Als dit adres bij ons bekend is, staat er nu een mail met een link om een nieuw wachtwoord in te stellen.</p>
            <button className="bh-link" onClick={() => setMode("login")}>Terug naar inloggen</button>
          </React.Fragment>
        ) : (
          <form onSubmit={mode === "login" ? login : forgot} noValidate>
            <Alert kind="error">{error}</Alert>
            <div className="field">
              <label className="field-label" htmlFor="l-email">E-mailadres</label>
              <input id="l-email" className="text-input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            {mode === "login" && (
              <div className="field">
                <label className="field-label" htmlFor="l-pw">Wachtwoord</label>
                <input id="l-pw" className="text-input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            )}
            <button className="btn btn-primary bh-full" type="submit" disabled={busy || !email}>
              {busy ? "Even geduld…" : mode === "login" ? "Inloggen" : "Stuur link"}
            </button>
            <button type="button" className="bh-link" onClick={() => { setError(""); setMode(mode === "login" ? "vergeten" : "login"); }}>
              {mode === "login" ? "Wachtwoord vergeten?" : "Terug naar inloggen"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function NewPassword({ onDone }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setError("Kies minstens 8 tekens.");
    if (pw !== pw2) return setError("De twee wachtwoorden zijn niet gelijk.");
    setBusy(true); setError("");
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setError("Opslaan lukte niet. Vraag een nieuwe link aan.");
    else onDone();
  };
  return (
    <div className="bh-center">
      <form className="bh-card bh-login" onSubmit={save}>
        <BrandMark />
        <h1 className="bh-h1">Nieuw wachtwoord</h1>
        <Alert kind="error">{error}</Alert>
        <div className="field">
          <label className="field-label" htmlFor="n-pw">Nieuw wachtwoord</label>
          <input id="n-pw" className="text-input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="n-pw2">Nog een keer</label>
          <input id="n-pw2" className="text-input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <button className="btn btn-primary bh-full" type="submit" disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</button>
      </form>
    </div>
  );
}

// ─── Reservering invoeren of wijzigen ─────────────────────────────────────────

function ReservationForm({ initial, types, token, onClose, onSaved }) {
  const isNew = !initial.id;
  const [f, setF] = useState({
    name: initial.name || "",
    phone: initial.phone || "",
    email: initial.email || "",
    type: initial.reservation_type || (types[0] && types[0].id) || "",
    date: initial.date || todayStr(),
    time: initial.time || "12:00",
    guests: initial.guests || 2,
    message: initial.message || "",
    status: initial.status || "bevestigd",
  });
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return setError("Vul een naam in.");
    const time = normTime(f.time);
    if (!TIME_RE.test(time)) return setError("Vul een tijd in, bijvoorbeeld 12:30.");
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError("Dit e-mailadres klopt niet.");
    setBusy(true); setError("");
    const r = await api.call("staff-save", {
      id: initial.id || "", name: f.name, phone: f.phone, email: f.email, type: f.type, date: f.date,
      time, guests: Number(f.guests), message: f.message, status: f.status,
      notify: notify && !!f.email.trim(),
    }, token());
    setBusy(false);
    if (!r.ok) return setError(api.message(r.code));
    onSaved(notify && f.email.trim() && !r.mailed ? `Opgeslagen, maar de mail aan ${f.name} kon niet worden verstuurd.` : "Opgeslagen.");
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="modal bh-modal" role="dialog" aria-modal="true" aria-labelledby="rf-title" onSubmit={save}>
        <div className="modal-head">
          <div className="modal-head-row" style={{ marginBottom: 0 }}>
            <h2 id="rf-title" className="modal-title">{isNew ? "Reservering invoeren" : "Reservering wijzigen"}</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Sluiten">×</button>
          </div>
        </div>
        <div className="modal-body">
          {isNew && <p className="bh-muted" style={{ marginTop: 0 }}>Voor een telefonische of losse reservering. Je kunt hier ook boven de capaciteit of buiten de vaste tijden boeken.</p>}
          <Alert kind="error">{error}</Alert>
          <div className="field-row">
            <div className="field">
              <label className="field-label" htmlFor="rf-name">Naam</label>
              <input id="rf-name" className="text-input" value={f.name} onChange={set("name")} maxLength={100} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="rf-phone">Telefoon</label>
              <input id="rf-phone" className="text-input" type="tel" value={f.phone} onChange={set("phone")} maxLength={40} />
            </div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rf-email">E-mail (niet verplicht)</label>
            <input id="rf-email" className="text-input" type="email" value={f.email} onChange={set("email")} maxLength={254} />
          </div>
          <div className="bh-form-grid">
            <div className="field">
              <label className="field-label" htmlFor="rf-type">Soort</label>
              <select id="rf-type" className="text-input" value={f.type} onChange={set("type")}>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}{t.active ? "" : " (niet actief)"}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="rf-date">Datum</label>
              <input id="rf-date" className="date-input" type="date" value={f.date} onChange={set("date")} required />
              {f.date && <p className="bh-help">{fmtLong(f.date)}</p>}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="rf-time">Tijd</label>
              <TimeField id="rf-time" value={f.time} onChange={(v) => setF({ ...f, time: v })} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="rf-guests">Personen</label>
              <input id="rf-guests" className="text-input" type="number" min="1" max="500" value={f.guests} onChange={set("guests")} required />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="rf-status">Status</label>
              <select id="rf-status" className="text-input" value={f.status} onChange={set("status")}>
                <option value="aangevraagd">Aangevraagd</option>
                <option value="bevestigd">Bevestigd</option>
                {!isNew && <option value="geannuleerd">Geannuleerd</option>}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="rf-msg">Opmerking</label>
            <textarea id="rf-msg" className="textarea-input" rows="2" maxLength={1000} value={f.message} onChange={set("message")} />
          </div>
          <label className="consent">
            <input type="checkbox" checked={notify && !!f.email.trim()} disabled={!f.email.trim()} onChange={(e) => setNotify(e.target.checked)} />
            <span>{f.email.trim() ? (isNew ? "Stuur de gast een bevestiging per mail" : "Stuur de gast een mail met de wijziging") : "Geen e-mailadres, dus geen mail aan de gast"}</span>
          </label>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn" style={{ borderColor: "transparent" }} onClick={onClose}>Annuleren</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</button>
        </div>
      </form>
    </div>
  );
}

// ─── Reserveringen ────────────────────────────────────────────────────────────

function Reservations({ token }) {
  const [mode, setMode] = useState("dag"); // dag | open | komend
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState({});
  const [openCount, setOpenCount] = useState(0);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    sb.from("reservation_types").select("*").order("sort_order").then(({ data }) => setTypes(data || []));
  }, []);

  const load = useCallback(async () => {
    setError("");
    let q = sb.from("reservations").select("*");
    if (mode === "dag") q = q.eq("date", date);
    else if (mode === "open") q = q.eq("status", "aangevraagd").gte("date", todayStr());
    else q = q.gte("date", todayStr()).neq("status", "geannuleerd");
    const { data, error } = await q.order("date").order("time").order("created_at");
    setLoading(false);
    if (error) { setError("Reserveringen laden lukte niet. Controleer je verbinding."); return; }
    setRows(data || []);
    const c = await sb.from("reservations").select("id", { count: "exact", head: true })
      .eq("status", "aangevraagd").gte("date", todayStr());
    if (!c.error) setOpenCount(c.count || 0);
  }, [mode, date]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Live bijwerken bij nieuwe of gewijzigde reserveringen.
  useEffect(() => {
    const ch = sb.channel("reservations-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => load())
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [load]);

  const typeName = (id) => (types.find((t) => t.id === id) || {}).name || id;

  const act = async (r, action) => {
    if (action === "staff-cancel") {
      const ok = window.confirm(`Reservering van ${r.name} op ${fmtShort(r.date)} om ${r.time} annuleren?${r.email ? `\n\n${r.name} krijgt hiervan een mail.` : ""}`);
      if (!ok) return;
    }
    setBusy((b) => ({ ...b, [r.id]: action }));
    setNotice(""); setError("");
    const res = await api.call(action, { id: r.id }, token());
    setBusy((b) => ({ ...b, [r.id]: null }));
    if (!res.ok) setError(api.message(res.code));
    else if (res.hasEmail && res.mailed === false) setNotice(`Gelukt, maar de mail aan ${r.name} kon niet worden verstuurd. Neem zelf even contact op (${r.phone}).`);
    else if (!res.hasEmail) setNotice(`Gelukt. ${r.name} heeft geen e-mailadres, dus laat het zelf even weten als dat nodig is.`);
    load();
  };

  const active = rows.filter((r) => r.status !== "geannuleerd");
  const guests = active.reduce((s, r) => s + r.guests, 0);

  return (
    <section>
      <div className="bh-toolbar">
        <div className="bh-seg" role="tablist" aria-label="Weergave">
          <button role="tab" aria-selected={mode === "dag"} className={mode === "dag" ? "on" : ""} onClick={() => setMode("dag")}>Per dag</button>
          <button role="tab" aria-selected={mode === "open"} className={mode === "open" ? "on" : ""} onClick={() => setMode("open")}>
            Te bevestigen {openCount > 0 && <span className="bh-badge">{openCount}</span>}
          </button>
          <button role="tab" aria-selected={mode === "komend"} className={mode === "komend" ? "on" : ""} onClick={() => setMode("komend")}>Komend</button>
        </div>
        {mode === "dag" && (
          <div className="bh-datenav">
            <button className="bh-icon" onClick={() => setDate(addDays(date, -1))} aria-label="Vorige dag">‹</button>
            <input type="date" className="date-input" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Datum" />
            <button className="bh-icon" onClick={() => setDate(addDays(date, 1))} aria-label="Volgende dag">›</button>
            {date !== todayStr() && <button className="bh-link" onClick={() => setDate(todayStr())}>Vandaag</button>}
          </div>
        )}
        <button className="btn btn-primary bh-new" onClick={() => setEditing({ date: mode === "dag" ? date : todayStr() })}>+ Reservering invoeren</button>
      </div>

      <h2 className="bh-h2">
        {mode === "dag" ? fmtLong(date) : mode === "open" ? "Te bevestigen" : "Komende reserveringen"}
        {!loading && <span className="bh-sum">{plural(active.length, "reservering", "reserveringen")} · {plural(guests, "gast", "gasten")}</span>}
      </h2>

      <Alert kind="error" onClose={() => setError("")}>{error}</Alert>
      <Alert onClose={() => setNotice("")}>{notice}</Alert>

      {loading ? <p className="bh-muted">Laden…</p> : rows.length === 0 ? (
        <p className="bh-empty">{mode === "open" ? "Alles is bevestigd. Lekker bezig." : "Geen reserveringen."}</p>
      ) : (
        <ul className="bh-list">
          {rows.map((r) => (
            <li key={r.id} className={"bh-res st-" + r.status}>
              <div className="bh-res-time">
                {mode !== "dag" && <span className="bh-res-date">{fmtShort(r.date)}</span>}
                <strong>{r.time}</strong>
              </div>
              <div className="bh-res-main">
                <div className="bh-res-head">
                  <span className="bh-res-name">{r.name}</span>
                  <span className="bh-res-guests">{plural(r.guests, "persoon", "personen")}</span>
                  <span className="bh-pill">{typeName(r.reservation_type)}</span>
                  <span className={"bh-pill s-" + r.status}>{STATUS_LABEL[r.status]}{r.cancelled_by === "gast" ? " door gast" : ""}</span>
                  {r.source === "cafe" && <span className="bh-pill">Zelf ingevoerd</span>}
                </div>
                <div className="bh-res-contact">
                  {r.phone && <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>{r.phone}</a>}
                  {r.email && <a href={`mailto:${r.email}`}>{r.email}</a>}
                </div>
                {r.message && <p className="bh-res-msg">“{r.message}”</p>}
              </div>
              <div className="bh-res-actions">
                {r.status === "aangevraagd" && (
                  <button className="btn btn-primary" disabled={!!busy[r.id]} onClick={() => act(r, "confirm")}>
                    {busy[r.id] === "confirm" ? "Bezig…" : "Bevestigen"}
                  </button>
                )}
                <button className="btn" disabled={!!busy[r.id]} onClick={() => setEditing(r)}>Wijzigen</button>
                {r.status !== "geannuleerd" && (
                  <button className="btn" disabled={!!busy[r.id]} onClick={() => act(r, "staff-cancel")}>
                    {busy[r.id] === "staff-cancel" ? "Bezig…" : "Annuleren"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ReservationForm
          initial={editing} types={types} token={token}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); setNotice(msg); load(); }}
        />
      )}
    </section>
  );
}

// ─── Openingstijden ───────────────────────────────────────────────────────────

function OpeningHours() {
  const [rows, setRows] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from("opening_hours").select("*").order("isodow").then(({ data, error }) => {
      if (error) setError("Openingstijden laden lukte niet.");
      else setRows(data);
    });
  }, []);

  const upd = (i, k, v) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const save = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    const clean = rows.map((r) => ({ ...r, open_time: normTime(r.open_time), close_time: normTime(r.close_time) }));
    for (const r of clean) {
      if (!r.closed && (!TIME_RE.test(r.open_time || "") || !TIME_RE.test(r.close_time || ""))) {
        return setError(`Vul bij ${DAY_LONG[r.isodow].toLowerCase()} een openings- en sluitingstijd in (bijvoorbeeld 09:00), of zet de dag op dicht.`);
      }
      if (!r.closed && r.close_time <= r.open_time) {
        return setError(`Bij ${DAY_LONG[r.isodow].toLowerCase()} moet de sluitingstijd na de openingstijd liggen.`);
      }
    }
    setRows(clean);
    setBusy(true);
    const { error } = await sb.from("opening_hours").upsert(clean.map((r) => ({
      isodow: r.isodow, closed: r.closed,
      open_time: r.closed ? null : r.open_time, close_time: r.closed ? null : r.close_time,
      note: (r.note || "").trim(), highlight: !!r.highlight,
    })));
    setBusy(false);
    if (error) setError(dbMessage(error, "Opslaan lukte niet."));
    else setMsg("Opgeslagen. De website toont de nieuwe tijden meteen.");
  };

  return (
    <section>
      <h2 className="bh-h2">Openingstijden</h2>
      <p className="bh-muted">Deze tijden staan op de website en onder elke mail. Op een dag die dicht staat kan niemand online reserveren. Uitlichten zet een dag extra in de verf op de website, zoals de diner-avond.</p>
      <Alert kind="error">{error}</Alert>
      {!rows ? <p className="bh-muted">Laden…</p> : (
        <form className="bh-card bh-form bh-wide" onSubmit={save}>
          <div className="bh-hours">
            <div className="bh-hours-head" aria-hidden="true"><span>Dag</span><span>Dicht</span><span>Open</span><span>Sluit</span><span>Notitie (op de site)</span><span>Uitlichten</span></div>
            {rows.map((r, i) => (
              <div className={"bh-hours-row" + (r.closed ? " is-closed" : "")} key={r.isodow}>
                <strong>{DAY_LONG[r.isodow]}</strong>
                <label className="bh-check"><input type="checkbox" checked={r.closed} onChange={(e) => upd(i, "closed", e.target.checked)} /><span>Dicht</span></label>
                <TimeField label={`${DAY_LONG[r.isodow]} open`} value={r.open_time} disabled={r.closed} onChange={(v) => upd(i, "open_time", v)} />
                <TimeField label={`${DAY_LONG[r.isodow]} sluit`} value={r.close_time} disabled={r.closed} onChange={(v) => upd(i, "close_time", v)} />
                <input className="text-input" aria-label={`${DAY_LONG[r.isodow]} notitie`} value={r.note || ""} maxLength={60} placeholder="Notitie, niet verplicht" onChange={(e) => upd(i, "note", e.target.value)} />
                <label className="bh-check"><input type="checkbox" checked={!!r.highlight} onChange={(e) => upd(i, "highlight", e.target.checked)} /><span>Uitlichten</span></label>
              </div>
            ))}
          </div>
          <Alert>{msg}</Alert>
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</button>
        </form>
      )}
    </section>
  );
}

// ─── Soorten reservering en tijden ────────────────────────────────────────────

function TypeEditor({ t, existingIds, onSaved, onDeleted }) {
  const [f, setF] = useState(t);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const set = (k, v) => setF({ ...f, [k]: v });
  const toggleDay = (d) => set("days", f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort());

  const first = normTime(f.first_slot), last = normTime(f.last_slot);
  const slots = TIME_RE.test(first) && TIME_RE.test(last) && last >= first ? api.slotsFor({ ...f, first_slot: first, last_slot: last }) : [];

  const save = async (e) => {
    e.preventDefault();
    setMsg(""); setError("");
    if (!f.name.trim()) return setError("Geef de soort een naam.");
    if (!TIME_RE.test(first) || !TIME_RE.test(last)) return setError("Vul de tijden in als uu:mm, bijvoorbeeld 11:30.");
    if (last < first) return setError("De laatste tijd moet na de eerste tijd liggen.");
    if (f.days.length === 0 && f.active) return setError("Kies minstens een dag, of zet de soort op niet actief.");
    setBusy(true);
    let id = f.id;
    if (t.isNew) {
      id = slugify(f.name) || "soort";
      if (id.length < 2) id = id + "-1";
      for (let i = 2; (existingIds || []).includes(id); i++) id = (slugify(f.name) || "soort").slice(0, 26) + "-" + i;
    }
    const row = {
      id, name: f.name.trim(), description: (f.description || "").trim(), tag: (f.tag || "").trim(),
      active: f.active, sort_order: Number(f.sort_order) || 0, days: f.days,
      first_slot: first, last_slot: last, interval_min: Number(f.interval_min),
    };
    const { error } = t.isNew
      ? await sb.from("reservation_types").insert(row)
      : await sb.from("reservation_types").update(row).eq("id", f.id);
    setBusy(false);
    if (error) return setError(dbMessage(error, "Opslaan lukte niet."));
    setMsg("Opgeslagen.");
    onSaved();
  };

  const remove = async () => {
    if (!window.confirm(`"${f.name}" verwijderen?`)) return;
    const { error } = await sb.from("reservation_types").delete().eq("id", f.id);
    if (error) return setError(dbMessage(error, "Verwijderen lukte niet."));
    onDeleted();
  };

  return (
    <form className={"bh-card bh-form bh-type" + (f.active ? "" : " is-off")} onSubmit={save}>
      <div className="bh-type-head">
        <h3 className="bh-h3">{f.name || "Nieuwe soort"}</h3>
        <label className="bh-check"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} /><span>Online te reserveren</span></label>
      </div>
      <div className="bh-form-grid">
        <div className="field">
          <label className="field-label" htmlFor={`t-name-${f.id}`}>Naam</label>
          <input id={`t-name-${f.id}`} className="text-input" value={f.name} maxLength={40} autoFocus={!!t.isNew} placeholder="Bijv. Brunch" onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field bh-span2">
          <label className="field-label" htmlFor={`t-desc-${f.id}`}>Korte omschrijving</label>
          <input id={`t-desc-${f.id}`} className="text-input" value={f.description || ""} maxLength={200} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`t-tag-${f.id}`}>Label (niet verplicht)</label>
          <input id={`t-tag-${f.id}`} className="text-input" value={f.tag || ""} maxLength={60} placeholder="Bijv. Alleen op vrijdagavond" onChange={(e) => set("tag", e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`t-first-${f.id}`}>Eerste tijd</label>
          <TimeField id={`t-first-${f.id}`} value={f.first_slot} onChange={(v) => set("first_slot", v)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`t-last-${f.id}`}>Laatste tijd</label>
          <TimeField id={`t-last-${f.id}`} value={f.last_slot} onChange={(v) => set("last_slot", v)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`t-int-${f.id}`}>Elke</label>
          <select id={`t-int-${f.id}`} className="text-input" value={f.interval_min} onChange={(e) => set("interval_min", Number(e.target.value))}>
            <option value={15}>kwartier</option>
            <option value={30}>half uur</option>
            <option value={60}>uur</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor={`t-sort-${f.id}`}>Volgorde</label>
          <input id={`t-sort-${f.id}`} className="text-input" type="number" value={f.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
        </div>
      </div>
      <fieldset className="bh-days">
        <legend className="field-label">Op welke dagen</legend>
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <label key={d} className={"bh-day" + (f.days.includes(d) ? " on" : "")}>
            <input type="checkbox" checked={f.days.includes(d)} onChange={() => toggleDay(d)} />
            {DAY_SHORT[d]}
          </label>
        ))}
      </fieldset>
      <p className="bh-help">Gasten kunnen kiezen uit: {slots.length ? slots.join(", ") : "geen tijden"}. Dagen die bij Openingstijden dicht staan, vallen automatisch af.</p>
      <Alert kind="error">{error}</Alert>
      <Alert>{msg}</Alert>
      <div className="bh-actions">
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</button>
        {t.isNew
          ? <button className="btn" type="button" onClick={onDeleted}>Annuleren</button>
          : <button className="btn" type="button" onClick={remove}>Verwijderen</button>}
      </div>
    </form>
  );
}

function Types() {
  const [types, setTypes] = useState(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(null);

  const load = useCallback(() => {
    sb.from("reservation_types").select("*").order("sort_order").order("name").then(({ data, error }) => {
      if (error) setError("Soorten laden lukte niet.");
      else setTypes(data);
    });
  }, []);
  useEffect(load, [load]);

  const startNew = () => {
    setAdding({ id: "nieuw", name: "", description: "", tag: "", active: true, sort_order: (types || []).length + 1, days: [2, 3, 4, 5, 6, 7], first_slot: "12:00", last_slot: "14:00", interval_min: 30, isNew: true });
  };

  return (
    <section>
      <div className="bh-row">
        <h2 className="bh-h2">Soorten en tijden</h2>
        <button className="btn btn-primary" onClick={startNew} disabled={!!adding}>+ Nieuwe soort</button>
      </div>
      <p className="bh-muted">Wat gasten online kunnen reserveren, op welke dagen en vanaf hoe laat tot hoe laat. Niet actief betekent: niet zichtbaar op de website.</p>
      <Alert kind="error">{error}</Alert>
      {!types ? <p className="bh-muted">Laden…</p> : (
        <div className="bh-stack">
          {adding && <TypeEditor key="nieuw" t={adding} existingIds={(types || []).map((x) => x.id)} onSaved={() => { setAdding(null); load(); }} onDeleted={() => setAdding(null)} />}
          {types.map((t) => <TypeEditor key={t.id + t.name + t.first_slot + t.last_slot + t.active} t={t} onSaved={load} onDeleted={load} />)}
        </div>
      )}
    </section>
  );
}

// ─── Sluitingen ───────────────────────────────────────────────────────────────

function Closures() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await sb.from("blocked_slots").select("*")
      .gte("date", todayStr()).order("date").order("time_from", { nullsFirst: true });
    setLoading(false);
    if (error) setError("Sluitingen laden lukte niet.");
    else setItems(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    if (!date) return;
    const f0 = normTime(from), t0 = normTime(to);
    if (from && !TIME_RE.test(f0)) return setError("Vul de begintijd in als uu:mm, bijvoorbeeld 13:00.");
    if (to && !TIME_RE.test(t0)) return setError("Vul de eindtijd in als uu:mm, bijvoorbeeld 15:00.");
    if (from && to && t0 < f0) return setError("De eindtijd moet na de begintijd liggen.");
    setSaving(true); setError("");
    const { error } = await sb.from("blocked_slots").insert({
      date, time_from: from ? f0 : null, time_to: from && to ? t0 : null, reason: reason.trim() || null,
    });
    setSaving(false);
    if (error) { setError(dbMessage(error, "Opslaan lukte niet.")); return; }
    setDate(""); setFrom(""); setTo(""); setReason("");
    load();
  };

  const remove = async (id) => {
    const { error } = await sb.from("blocked_slots").delete().eq("id", id);
    if (error) setError("Verwijderen lukte niet.");
    load();
  };

  const range = (c) => !c.time_from ? "Hele dag dicht" : !c.time_to ? `Dicht vanaf ${c.time_from}` : `Dicht van ${c.time_from} tot en met ${c.time_to}`;

  return (
    <section>
      <h2 className="bh-h2">Sluitingen</h2>
      <p className="bh-muted">Vakantie, besloten feest of personeel tekort? Zet de dag of een deel ervan hier dicht, dan kan niemand die tijden online boeken. Bestaande reserveringen blijven staan.</p>
      <form className="bh-card bh-form" onSubmit={add}>
        <div className="bh-form-grid">
          <div className="field">
            <label className="field-label" htmlFor="c-date">Datum</label>
            <input id="c-date" type="date" className="date-input" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} required />
            {date && <p className="bh-help">{fmtLong(date)}</p>}
          </div>
          <div className="field">
            <label className="field-label" htmlFor="c-from">Vanaf (leeg = hele dag)</label>
            <TimeField id="c-from" value={from} onChange={(v) => { setFrom(v); if (!v) setTo(""); }} />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="c-to">Tot en met (leeg = einde dag)</label>
            <TimeField id="c-to" value={to} disabled={!from} onChange={setTo} />
          </div>
          <div className="field bh-grow">
            <label className="field-label" htmlFor="c-reason">Reden (alleen voor jezelf)</label>
            <input id="c-reason" className="text-input" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="Bijv. vakantie, besloten feest" />
          </div>
        </div>
        <Alert kind="error">{error}</Alert>
        <button className="btn btn-primary" type="submit" disabled={saving || !date}>{saving ? "Opslaan…" : "Sluiting toevoegen"}</button>
      </form>

      {loading ? <p className="bh-muted">Laden…</p> : items.length === 0 ? <p className="bh-empty">Geen sluitingen gepland.</p> : (
        <ul className="bh-list">
          {items.map((c) => (
            <li key={c.id} className="bh-res">
              <div className="bh-res-time"><strong>{fmtShort(c.date)}</strong></div>
              <div className="bh-res-main">
                <div className="bh-res-head"><span className="bh-res-name">{range(c)}</span></div>
                {c.reason && <p className="bh-res-msg">{c.reason}</p>}
              </div>
              <div className="bh-res-actions">
                <button className="btn" onClick={() => remove(c.id)}>Weghalen</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Mailinglijst ─────────────────────────────────────────────────────────────

function Subscribers() {
  const [rows, setRows] = useState(null);
  const [showOff, setShowOff] = useState(false);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    sb.from("subscribers").select("*").order("consent_at", { ascending: false }).then(({ data, error }) => {
      if (error) setError("Mailinglijst laden lukte niet.");
      else setRows(data || []);
    });
  }, []);
  useEffect(load, [load]);

  const activeRows = (rows || []).filter((r) => !r.unsubscribed_at);
  const shown = (rows || [])
    .filter((r) => showOff || !r.unsubscribed_at)
    .filter((r) => !q || (r.email + " " + (r.name || "")).toLowerCase().includes(q.toLowerCase()));

  const exportCsv = () => {
    const esc = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`;
    const lines = [["email", "naam", "toestemming_op", "bron"].join(";")]
      .concat(activeRows.map((r) => [r.email, r.name || "", new Date(r.consent_at).toISOString(), r.source].map(esc).join(";")));
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mailinglijst-zus-en-zo-${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const remove = async (r) => {
    if (!window.confirm(`${r.email} helemaal van de lijst verwijderen?`)) return;
    const { error } = await sb.from("subscribers").delete().eq("email", r.email);
    if (error) setError("Verwijderen lukte niet.");
    load();
  };

  return (
    <section>
      <div className="bh-row">
        <h2 className="bh-h2">Mailinglijst <span className="bh-sum">{plural(activeRows.length, "adres", "adressen")}</span></h2>
        <button className="btn btn-primary" onClick={exportCsv} disabled={!activeRows.length}>Exporteer (CSV)</button>
      </div>
      <p className="bh-muted">Gasten die bij het reserveren zelf hebben aangevinkt dat ze nieuws willen ontvangen. Stuur alleen naar deze lijst en zet onder elke nieuwsbrief een afmeldmogelijkheid. Wie zich afmeldt via de link in de mail, verdwijnt hier vanzelf.</p>
      <Alert kind="error">{error}</Alert>
      <div className="bh-toolbar">
        <input className="text-input bh-search" type="search" placeholder="Zoeken op naam of e-mail" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Zoeken" />
        <label className="bh-check"><input type="checkbox" checked={showOff} onChange={(e) => setShowOff(e.target.checked)} /><span>Toon afgemelde adressen</span></label>
      </div>
      {!rows ? <p className="bh-muted">Laden…</p> : shown.length === 0 ? <p className="bh-empty">Nog niemand op de lijst.</p> : (
        <ul className="bh-list" style={{ marginTop: 16 }}>
          {shown.map((r) => (
            <li key={r.email} className={"bh-res" + (r.unsubscribed_at ? " st-geannuleerd" : " st-bevestigd")}>
              <div className="bh-res-time"><span className="bh-res-date">sinds</span><strong style={{ fontSize: 12 }}>{fmtStamp(r.consent_at)}</strong></div>
              <div className="bh-res-main">
                <div className="bh-res-head">
                  <span className="bh-res-name">{r.email}</span>
                  {r.name && <span className="bh-res-guests">{r.name}</span>}
                  {r.unsubscribed_at && <span className="bh-pill">Afgemeld {fmtStamp(r.unsubscribed_at)}</span>}
                </div>
              </div>
              <div className="bh-res-actions"><button className="btn" onClick={() => remove(r)}>Verwijderen</button></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Instellingen en team ─────────────────────────────────────────────────────

function Team({ token }) {
  const [team, setTeam] = useState(null);
  const [me, setMe] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await api.call("team-list", {}, token());
    if (!r.ok) return setError(api.message(r.code));
    setTeam(r.team); setMe(r.me);
  }, []);
  useEffect(() => { load(); }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(""); setError("");
    const r = await api.call("team-add", { email, password, note }, token());
    setBusy(false);
    if (!r.ok) return setError(api.message(r.code));
    setMsg(r.existing ? `${email} had al een account en heeft nu toegang.` : `${email} kan nu inloggen met het wachtwoord dat je net koos. Laat diegene het zelf veranderen via "Wachtwoord vergeten?".`);
    setEmail(""); setPassword(""); setNote("");
    load();
  };

  const remove = async (m) => {
    if (!window.confirm(`Toegang van ${m.email} intrekken? Het account wordt verwijderd.`)) return;
    const r = await api.call("team-remove", { user_id: m.user_id }, token());
    if (!r.ok) return setError(api.message(r.code));
    load();
  };

  return (
    <div className="bh-card bh-form">
      <h3 className="bh-h3">Wie mag in het beheer</h3>
      <Alert kind="error">{error}</Alert>
      {!team ? <p className="bh-muted">Laden…</p> : (
        <ul className="bh-team">
          {team.map((m) => (
            <li key={m.user_id}>
              <span><strong>{m.email}</strong>{m.note ? ` · ${m.note}` : ""}{m.user_id === me ? " (jij)" : ""}</span>
              {m.user_id !== me && <button className="bh-link" style={{ margin: 0 }} onClick={() => remove(m)}>Toegang intrekken</button>}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add}>
        <div className="bh-form-grid">
          <div className="field">
            <label className="field-label" htmlFor="tm-email">E-mail collega</label>
            <input id="tm-email" className="text-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="tm-pw">Tijdelijk wachtwoord</label>
            <input id="tm-pw" className="text-input" type="text" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="off" />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="tm-note">Notitie</label>
            <input id="tm-note" className="text-input" value={note} maxLength={60} placeholder="Bijv. bediening" onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <Alert>{msg}</Alert>
        <button className="btn btn-primary" type="submit" disabled={busy || !email || password.length < 8}>{busy ? "Bezig…" : "Toegang geven"}</button>
      </form>
    </div>
  );
}

function Settings({ token }) {
  const [s, setS] = useState(null);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    sb.from("settings").select("*").eq("id", 1).single().then(({ data, error }) => {
      if (error) setError("Instellingen laden lukte niet.");
      else setS(data);
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaved(""); setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.notify_email.trim())) return setError("Vul een geldig e-mailadres in voor de meldingen.");
    setBusy(true);
    const { error } = await sb.from("settings").update({
      max_guests_window: Number(s.max_guests_window),
      table_minutes: Number(s.table_minutes),
      max_guests_online: Number(s.max_guests_online),
      min_minutes_ahead: Number(s.min_minutes_ahead),
      max_days_ahead: Number(s.max_days_ahead),
      auto_confirm: !!s.auto_confirm,
      notify_email: s.notify_email.trim(),
      ask_marketing: !!s.ask_marketing,
      marketing_text: s.marketing_text.trim(),
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setBusy(false);
    if (error) setError(dbMessage(error, "Opslaan lukte niet."));
    else setSaved("Opgeslagen. Het geldt meteen voor nieuwe reserveringen.");
  };

  if (!s) return <section><h2 className="bh-h2">Instellingen</h2>{error ? <Alert kind="error">{error}</Alert> : <p className="bh-muted">Laden…</p>}</section>;

  const num = (k, label, help, min, max) => (
    <div className="field">
      <label className="field-label" htmlFor={"s-" + k}>{label}</label>
      <input id={"s-" + k} className="text-input" type="number" min={min} max={max} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      <p className="bh-help">{help}</p>
    </div>
  );
  const check = (k, label, help) => (
    <div className="field">
      <label className="bh-check"><input type="checkbox" checked={!!s[k]} onChange={(e) => setS({ ...s, [k]: e.target.checked })} /><span><strong>{label}</strong></span></label>
      <p className="bh-help">{help}</p>
    </div>
  );

  return (
    <section>
      <h2 className="bh-h2">Instellingen</h2>
      <form className="bh-card bh-form" onSubmit={save}>
        <h3 className="bh-h3">Capaciteit</h3>
        <div className="bh-form-grid bh-two">
          {num("max_guests_window", "Maximaal aantal gasten tegelijk", "Zitten er al zoveel gasten, dan is een tijdslot online vol.", 1, 1000)}
          {num("table_minutes", "Hoe lang blijft een tafel bezet (minuten)", "Gebruikt om te tellen hoeveel gasten er tegelijk binnen zijn.", 30, 480)}
          {num("max_guests_online", "Maximaal personen per online reservering", "Grotere groepen vragen we te bellen.", 1, 50)}
          {num("min_minutes_ahead", "Minimaal minuten van tevoren", "Hoe kort van tevoren iemand nog online kan reserveren.", 0, 10080)}
          {num("max_days_ahead", "Maximaal dagen vooruit", "Hoe ver vooruit de agenda openstaat.", 1, 730)}
        </div>
        <h3 className="bh-h3">Bevestigen en meldingen</h3>
        {check("auto_confirm", "Reserveringen automatisch bevestigen", "Aan: de gast krijgt meteen een bevestiging. Uit: je bevestigt elke aanvraag zelf.")}
        <div className="field">
          <label className="field-label" htmlFor="s-notify">Meldingen van nieuwe reserveringen naar</label>
          <input id="s-notify" className="text-input" type="email" value={s.notify_email} onChange={(e) => setS({ ...s, notify_email: e.target.value })} />
        </div>
        <h3 className="bh-h3">Nieuwsbrief</h3>
        {check("ask_marketing", "Bij reserveren vragen of gasten nieuws willen ontvangen", "Er staat dan een vinkje bij het reserveren. Het staat standaard uit; alleen wie het zelf aanzet komt op de mailinglijst.")}
        <div className="field">
          <label className="field-label" htmlFor="s-mtext">Tekst bij het vinkje</label>
          <textarea id="s-mtext" className="textarea-input" rows="2" maxLength={300} value={s.marketing_text} onChange={(e) => setS({ ...s, marketing_text: e.target.value })} />
          <p className="bh-help">Wordt bij elke aanmelding opgeslagen als bewijs van toestemming.</p>
        </div>
        <Alert kind="error">{error}</Alert>
        <Alert>{saved}</Alert>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</button>
      </form>
      <Team token={token} />
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

const TABS = [
  ["reserveringen", "Reserveringen"],
  ["openingstijden", "Openingstijden"],
  ["soorten", "Soorten en tijden"],
  ["sluitingen", "Sluitingen"],
  ["mailinglijst", "Mailinglijst"],
  ["instellingen", "Instellingen"],
];

function Beheer() {
  const [session, setSession] = useState(undefined); // undefined = laden
  const [staff, setStaff] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const [view, setView] = useState(() => {
    const h = window.location.hash.replace("#", "");
    return TABS.some(([id]) => id === h) ? h : "reserveringen";
  });

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setStaff(null); return; }
    sb.rpc("is_staff").then(({ data, error }) => setStaff(!error && data === true));
  }, [session && session.user.id]);

  const go = (id) => { setView(id); try { window.history.replaceState(null, "", "#" + id); } catch (e) { /* ignore */ } };

  if (!sb) {
    return (
      <div className="bh-center"><div className="bh-card bh-login"><BrandMark />
        <h1 className="bh-h1">Nog niet gekoppeld</h1>
        <p className="bh-muted">Draai het installatiescript (zie RESERVERINGEN.md). Daarna werkt deze pagina.</p>
      </div></div>
    );
  }
  if (session === undefined) return <div className="bh-center"><p className="bh-muted">Laden…</p></div>;
  if (recovery && session) return <NewPassword onDone={() => setRecovery(false)} />;
  if (!session) return <Login />;
  if (staff === null) return <div className="bh-center"><p className="bh-muted">Laden…</p></div>;

  const logout = () => sb.auth.signOut();

  if (!staff) {
    return (
      <div className="bh-center"><div className="bh-card bh-login"><BrandMark />
        <h1 className="bh-h1">Geen toegang</h1>
        <p className="bh-muted">Het account {session.user.email} heeft geen toegang tot het beheer. Vraag een collega met toegang om je toe te voegen bij Instellingen.</p>
        <button className="btn bh-full" onClick={logout}>Uitloggen</button>
      </div></div>
    );
  }

  // Altijd het actuele token; supabase-js ververst het op de achtergrond.
  const token = () => (session ? session.access_token : "");

  return (
    <div className="bh-app">
      <header className="bh-top">
        <BrandMark />
        <nav className="bh-tabs" aria-label="Beheer">
          {TABS.map(([id, label]) => (
            <button key={id} className={view === id ? "on" : ""} aria-current={view === id ? "page" : undefined} onClick={() => go(id)}>{label}</button>
          ))}
        </nav>
        <button className="bh-logout" onClick={logout}>Uitloggen</button>
      </header>
      <main className="bh-main">
        {view === "reserveringen" && <Reservations token={token} />}
        {view === "openingstijden" && <OpeningHours />}
        {view === "soorten" && <Types />}
        {view === "sluitingen" && <Closures />}
        {view === "mailinglijst" && <Subscribers />}
        {view === "instellingen" && <Settings token={token} />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Beheer />);
