/* global window, React, ReactDOM */
// =============================================================
// Beheer: reserveringen bekijken, bevestigen en annuleren,
// sluitingen en capaciteit instellen. Alleen voor personeel
// (tabel staff in Supabase, zie supabase/schema.sql).
// =============================================================
const { useState, useEffect, useCallback } = React;

const api = window.ReserveApi;
const sb = api.configured && window.supabase
  ? window.supabase.createClient(api.url, api.key, { auth: { persistSession: true, detectSessionInUrl: true } })
  : null;

const TYPE_LABEL = { lunch: "Lunch", hightea: "High tea", diner: "Diner" };
const STATUS_LABEL = { aangevraagd: "Aangevraagd", bevestigd: "Bevestigd", geannuleerd: "Geannuleerd" };
const ALL_SLOTS = ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"];

const todayStr = () => api.localDate(new Date());
const addDays = (s, n) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return api.localDate(d); };
const fmtLong = (s) => {
  const t = new Date(s + "T12:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const fmtShort = (s) => new Date(s + "T12:00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
const plural = (n, one, more) => `${n} ${n === 1 ? one : more}`;

// ─── Inloggen ─────────────────────────────────────────────────────────────────

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
            {error && <div className="callout callout-error" role="alert" style={{ marginTop: 0, marginBottom: 16 }}>{error}</div>}
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
        {error && <div className="callout callout-error" role="alert" style={{ marginTop: 0, marginBottom: 16 }}>{error}</div>}
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

function BrandMark() {
  return <p className="bh-brand">Zus <span>&amp;</span> Zo <small>Reserveringen</small></p>;
}

// ─── Reserveringen ────────────────────────────────────────────────────────────

function Reservations({ token }) {
  const [mode, setMode] = useState("dag"); // dag | open | komend
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState({});
  const [openCount, setOpenCount] = useState(0);

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

  const act = async (r, action) => {
    if (action === "staff-cancel") {
      const ok = window.confirm(`Reservering van ${r.name} op ${fmtShort(r.date)} om ${r.time} annuleren?\n\n${r.name} krijgt hiervan een mail.`);
      if (!ok) return;
    }
    setBusy((b) => ({ ...b, [r.id]: action }));
    setNotice(""); setError("");
    const res = await api.call(action, { id: r.id }, token());
    setBusy((b) => ({ ...b, [r.id]: null }));
    if (!res.ok) {
      setError(res.code === "geen_toegang" ? "Je sessie is verlopen. Log opnieuw in." : api.message(res.code));
    } else if (res.mailed === false) {
      setNotice(`Gelukt, maar de mail aan ${r.name} kon niet worden verstuurd. Neem zelf even contact op (${r.phone}).`);
    }
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
      </div>

      <h2 className="bh-h2">
        {mode === "dag" ? fmtLong(date) : mode === "open" ? "Te bevestigen" : "Komende reserveringen"}
        {!loading && <span className="bh-sum">{plural(active.length, "reservering", "reserveringen")} · {plural(guests, "gast", "gasten")}</span>}
      </h2>

      {error && <div className="callout callout-error" role="alert">{error}</div>}
      {notice && <div className="callout" role="status">{notice}</div>}

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
                  <span className={"bh-pill t-" + r.reservation_type}>{TYPE_LABEL[r.reservation_type] || r.reservation_type}</span>
                  <span className={"bh-pill s-" + r.status}>{STATUS_LABEL[r.status]}{r.cancelled_by === "gast" ? " door gast" : ""}</span>
                </div>
                <div className="bh-res-contact">
                  <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`}>{r.phone}</a>
                  <a href={`mailto:${r.email}`}>{r.email}</a>
                </div>
                {r.message && <p className="bh-res-msg">“{r.message}”</p>}
              </div>
              <div className="bh-res-actions">
                {r.status === "aangevraagd" && (
                  <button className="btn btn-primary" disabled={!!busy[r.id]} onClick={() => act(r, "confirm")}>
                    {busy[r.id] === "confirm" ? "Bezig…" : "Bevestigen"}
                  </button>
                )}
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
    setSaving(true); setError("");
    const { error } = await sb.from("blocked_slots").insert({
      date, time_from: from || null, time_to: from && to ? to : null, reason: reason.trim() || null,
    });
    setSaving(false);
    if (error) { setError("Opslaan lukte niet."); return; }
    setDate(""); setFrom(""); setTo(""); setReason("");
    load();
  };

  const remove = async (id) => {
    const { error } = await sb.from("blocked_slots").delete().eq("id", id);
    if (error) setError("Verwijderen lukte niet.");
    load();
  };

  const range = (c) => !c.time_from ? "Hele dag" : !c.time_to ? `Vanaf ${c.time_from}` : c.time_from === c.time_to ? c.time_from : `${c.time_from} tot en met ${c.time_to}`;

  return (
    <section>
      <h2 className="bh-h2">Sluitingen</h2>
      <p className="bh-muted">Vakantie, besloten feest of personeel tekort? Zet de dag of de tijden hier dicht, dan kan niemand die online boeken. Bestaande reserveringen blijven staan.</p>
      <form className="bh-card bh-form" onSubmit={add}>
        <div className="bh-form-grid">
          <div className="field">
            <label className="field-label" htmlFor="c-date">Datum</label>
            <input id="c-date" type="date" className="date-input" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="c-from">Vanaf</label>
            <select id="c-from" className="text-input" value={from} onChange={(e) => { setFrom(e.target.value); setTo(""); }}>
              <option value="">Hele dag dicht</option>
              {ALL_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {from && (
            <div className="field">
              <label className="field-label" htmlFor="c-to">Tot en met</label>
              <select id="c-to" className="text-input" value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="">Einde van de dag</option>
                {ALL_SLOTS.filter((t) => t >= from).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div className="field bh-grow">
            <label className="field-label" htmlFor="c-reason">Reden (alleen voor jezelf)</label>
            <input id="c-reason" className="text-input" value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="Bijv. vakantie, besloten feest" />
          </div>
        </div>
        {error && <div className="callout callout-error" role="alert">{error}</div>}
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

// ─── Instellingen ─────────────────────────────────────────────────────────────

function Settings() {
  const [s, setS] = useState(null);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    sb.from("settings").select("*").eq("id", 1).single().then(({ data, error }) => {
      if (error) setError("Instellingen laden lukte niet.");
      else setS(data);
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaved(""); setError("");
    const { error } = await sb.from("settings").update({
      max_guests_window: Number(s.max_guests_window),
      max_guests_online: Number(s.max_guests_online),
      min_minutes_ahead: Number(s.min_minutes_ahead),
      max_days_ahead: Number(s.max_days_ahead),
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    if (error) setError("Opslaan lukte niet. Kloppen de getallen?");
    else setSaved("Opgeslagen.");
  };

  if (!s) return <section><h2 className="bh-h2">Instellingen</h2>{error ? <div className="callout callout-error">{error}</div> : <p className="bh-muted">Laden…</p>}</section>;

  const num = (k, label, help, min, max) => (
    <div className="field">
      <label className="field-label" htmlFor={"s-" + k}>{label}</label>
      <input id={"s-" + k} className="text-input" type="number" min={min} max={max} value={s[k]} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      <p className="bh-help">{help}</p>
    </div>
  );

  return (
    <section>
      <h2 className="bh-h2">Instellingen</h2>
      <form className="bh-card bh-form" onSubmit={save}>
        {num("max_guests_window", "Maximaal aantal gasten tegelijk", "Hoeveel gasten er binnen een blok van 2 uur online mogen reserveren. Daarboven is een tijdslot vol.", 1, 500)}
        {num("max_guests_online", "Maximaal per reservering", "Grotere groepen vragen we te bellen. Kan niet hoger dan 20.", 1, 20)}
        {num("min_minutes_ahead", "Minimaal minuten van tevoren", "Hoe kort van tevoren iemand nog online kan reserveren.", 0, 1440)}
        {num("max_days_ahead", "Maximaal dagen vooruit", "Hoe ver vooruit de agenda openstaat.", 1, 730)}
        {error && <div className="callout callout-error" role="alert">{error}</div>}
        {saved && <div className="callout" role="status">{saved}</div>}
        <button className="btn btn-primary" type="submit">Opslaan</button>
      </form>
    </section>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function Beheer() {
  const [session, setSession] = useState(undefined); // undefined = laden
  const [staff, setStaff] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const [view, setView] = useState("reserveringen");

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

  if (!sb) {
    return (
      <div className="bh-center"><div className="bh-card bh-login"><BrandMark />
        <h1 className="bh-h1">Nog niet gekoppeld</h1>
        <p className="bh-muted">Vul in <code>src/config.js</code> de Supabase-gegevens in. Zie RESERVERINGEN.md.</p>
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
        <p className="bh-muted">Het account {session.user.email} heeft geen toegang tot het beheer. Vraag de beheerder om je toe te voegen.</p>
        <button className="btn bh-full" onClick={logout}>Uitloggen</button>
      </div></div>
    );
  }

  const tabs = [["reserveringen", "Reserveringen"], ["sluitingen", "Sluitingen"], ["instellingen", "Instellingen"]];
  // Altijd het actuele token; supabase-js ververst het op de achtergrond.
  const token = () => (sb.auth && session ? session.access_token : "");

  return (
    <div className="bh-app">
      <header className="bh-top">
        <BrandMark />
        <nav className="bh-tabs" aria-label="Beheer">
          {tabs.map(([id, label]) => (
            <button key={id} className={view === id ? "on" : ""} aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}>{label}</button>
          ))}
        </nav>
        <button className="bh-logout" onClick={logout}>Uitloggen</button>
      </header>
      <main className="bh-main">
        {view === "reserveringen" && <Reservations token={token} />}
        {view === "sluitingen" && <Closures />}
        {view === "instellingen" && <Settings />}
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Beheer />);
