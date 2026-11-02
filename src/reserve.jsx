/* global window, React */
// =============================================================
// Reserveren in 5 stappen: personen, datum, soort (en keuze), tijd, gegevens
// Soorten, dagen, tijden en termijnen komen uit het beheer via
// window.ReserveApi (src/reserve-api.js); de database beslist.
// =============================================================
const { useState: useStateR, useEffect: useEffectR } = React;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isPhone = (v) => {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15 && /^[\d\s+()\-./]+$/.test(v.trim());
};

// Live instellingen; ververst als ze binnenkomen.
function useReserveConfig() {
  const [cfg, setCfg] = useStateR(window.ReserveApi.getConfig());
  useEffectR(() => {
    const on = () => setCfg(window.ReserveApi.getConfig());
    window.addEventListener("zz-config", on);
    window.ReserveApi.loadConfig().then(on);
    return () => window.removeEventListener("zz-config", on);
  }, []);
  return cfg;
}

function StepIndicator({ step, total }) {
  return (
    <div className="steps" role="progressbar" aria-valuemin="1" aria-valuemax={total} aria-valuenow={step} aria-label={`Stap ${step} van ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const cls = n < step ? "step-pill done" : n === step ? "step-pill active" : "step-pill";
        return (
          <div key={i} className={cls}>
            <span className="bar" />
          </div>
        );
      })}
    </div>
  );
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  const day = d.toLocaleDateString("nl-NL", { weekday: "long" });
  const rest = d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  return day.charAt(0).toUpperCase() + day.slice(1) + " " + rest;
}

const EMPTY_FORM = { name: "", email: "", phone: "", notes: "", website: "", marketing: false };

// Stappen: 1 personen, 2 datum, 3 wat (soort en eventueel keuze), 4 tijd, 5 gegevens.
const STEPS = 5;

// initialType: soort, eventueel met keuze erachter, bijv. "hightea:High tea".
function ReserveModal({ open, onClose, initialType }) {
  const [initType, initChoice] = String(initialType || "").split(":");
  const cfg = useReserveConfig();
  const S = cfg.settings;
  const MAX_ONLINE = S.max_guests_online;

  const [step, setStep] = useStateR(1);
  const [typeId, setTypeId] = useStateR(initType || null);
  const [choice, setChoice] = useStateR(initChoice || "");
  const [party, setParty] = useStateR(2);
  const [date, setDate] = useStateR("");
  const [time, setTime] = useStateR("");
  const [form, setForm] = useStateR(EMPTY_FORM);
  const [touched, setTouched] = useStateR(false);
  const [slots, setSlots] = useStateR(null);      // null = laden of geen datum
  const [slotsError, setSlotsError] = useStateR("");
  const [slotsVersion, setSlotsVersion] = useStateR(0);
  const [sending, setSending] = useStateR(false);
  const [submitError, setSubmitError] = useStateR("");
  const [result, setResult] = useStateR(null);     // { mailed, status } na succes

  useEffectR(() => {
    if (open) {
      setStep(1);
      setTypeId(initType || null);
      setChoice(initChoice || "");
      setParty(2);
      setDate("");
      setTime("");
      setForm(EMPTY_FORM);
      setTouched(false);
      setSlots(null);
      setSlotsError("");
      setSending(false);
      setSubmitError("");
      setResult(null);
    }
    document.body.classList.toggle("no-scroll", open);
  }, [open, initialType]);

  // Escape sluit het venster.
  useEffectR(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Alleen de soorten die op de gekozen dag kunnen (diner dus alleen op vrijdag).
  const typesOnDate = date ? cfg.types.filter((t) => window.ReserveApi.dayAllowed(t, date)) : [];
  const type = typesOnDate.find((t) => t.id === typeId) || null;
  const options = (type && type.options) || [];

  // Kan de vooraf gekozen soort niet op deze dag, of is er maar één soort: kiezen voor de gast.
  useEffectR(() => {
    if (!open || !date) return;
    if (typeId && !typesOnDate.some((t) => t.id === typeId)) { setTypeId(null); setChoice(""); }
    if (!typeId && typesOnDate.length === 1) setTypeId(typesOnDate[0].id);
  }, [open, date, cfg.types]);

  // Beschikbaarheid ophalen zodra soort, aantal en datum bekend zijn.
  useEffectR(() => {
    if (!open || !type || !date) { setSlots(null); return; }
    let cancelled = false;
    setSlots(null);
    setSlotsError("");
    if (!window.ReserveApi.configured) {
      // Nog niet gekoppeld: toon de vaste tijden; bij versturen volgt de melding.
      setSlots(window.ReserveApi.slotsFor(type).map((s) => ({ slot: s, available: true })));
      return;
    }
    window.ReserveApi.availability(date, type.id, party).then((r) => {
      if (cancelled) return;
      if (r.ok) setSlots(r.slots);
      else { setSlots([]); setSlotsError(window.ReserveApi.message(r.code)); }
    });
    return () => { cancelled = true; };
  }, [open, typeId, type && type.first_slot, party, date, slotsVersion]);

  // Gekozen tijd valt weg als die niet meer beschikbaar is.
  useEffectR(() => {
    if (time && slots && !slots.some((s) => s.slot === time && s.available)) setTime("");
  }, [slots]);

  if (!open) return null;

  const now = new Date();
  const today = window.ReserveApi.localDate(now);
  const maxDate = window.ReserveApi.localDate(new Date(now.getTime() + S.max_days_ahead * 864e5));
  const tooBig = party > MAX_ONLINE;

  const formErrors = {
    name: !form.name.trim() ? "Vul je naam in." : "",
    email: !EMAIL_RE.test(form.email.trim()) ? "Vul een geldig e-mailadres in." : "",
    phone: !isPhone(form.phone) ? "Vul een geldig telefoonnummer in." : "",
  };
  const formValid = !formErrors.name && !formErrors.email && !formErrors.phone;

  const canNext = {
    1: !tooBig,
    2: !!date && typesOnDate.length > 0,
    3: !!type && (options.length === 0 || options.includes(choice)),
    4: !!time,
  };

  const next = () => setStep((s) => Math.min(STEPS, s + 1));
  const prev = () => { setSubmitError(""); setStep((s) => Math.max(1, s - 1)); };
  const pickType = (id) => { if (id !== typeId) { setTypeId(id); setChoice(""); setTime(""); } };

  const onSubmit = async () => {
    setTouched(true);
    if (!formValid || sending) return;
    setSending(true);
    setSubmitError("");
    const r = await window.ReserveApi.call("create", {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      date, time,
      guests: party,
      type: type.id,
      choice: options.length ? choice : "",
      message: form.notes.trim(),
      marketing: S.ask_marketing && form.marketing === true,
      website: form.website,
    });
    setSending(false);
    if (r && r.ok) {
      setResult({ mailed: r.mailed !== false, status: r.status });
      return;
    }
    const code = (r && r.code) || "fout";
    if (code === "vol" || code === "gesloten" || code === "ongeldig") {
      // Terug naar de tijdkeuze met verse beschikbaarheid.
      setTime("");
      setSlotsVersion((v) => v + 1);
      window.ReserveApi.loadConfig(true);
      if (code !== "ongeldig") setStep(4);
    }
    setSubmitError(window.ReserveApi.message(code));
  };

  const label = type ? (options.length && choice ? choice : type.name) : "";

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
        <div className="modal-head">
          <div className="modal-head-row">
            <h2 id="reserve-title" className="modal-title">
              {result ? "Bedankt!" : "Reserveer een tafel"}
            </h2>
            <button className="modal-close" onClick={onClose} aria-label="Sluiten">
              <IconClose />
            </button>
          </div>
          {!result && <StepIndicator step={step} total={STEPS} />}
        </div>

        <div className="modal-body">
          {result ? (
            <Confirmation label={label} party={party} date={date} time={time} form={form} result={result} />
          ) : step === 1 ? (
            <StepParty party={party} setParty={setParty} tooBig={tooBig} max={MAX_ONLINE} />
          ) : step === 2 ? (
            <StepDate
              types={cfg.types} date={date} setDate={(d) => { setDate(d); setTime(""); }}
              today={today} maxDate={maxDate} typesOnDate={typesOnDate}
            />
          ) : step === 3 ? (
            <StepType types={typesOnDate} typeId={typeId} setType={pickType} choice={choice} setChoice={setChoice} date={date} />
          ) : step === 4 ? (
            <StepTime label={label} time={time} setTime={setTime} slots={slots} slotsError={slotsError} submitError={submitError} date={date} />
          ) : (
            <StepDetails
              form={form} setForm={setForm} label={label} party={party} date={date} time={time}
              errors={touched ? formErrors : {}} submitError={submitError}
              askMarketing={S.ask_marketing} marketingText={S.marketing_text}
            />
          )}
        </div>

        {!result && (
          <div className="modal-foot">
            <button
              className="btn-ghost btn"
              style={{ borderColor: "transparent" }}
              onClick={step === 1 ? onClose : prev}
              disabled={sending}
            >
              {step === 1 ? "Annuleren" : "← Terug"}
            </button>
            {step < STEPS ? (
              <button
                className="btn btn-primary"
                onClick={() => { setSubmitError(""); next(); }}
                disabled={!canNext[step]}
              >
                Volgende →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onSubmit} disabled={sending || (touched && !formValid)}>
                {sending ? "Versturen…" : "Reserveer"}
              </button>
            )}
          </div>
        )}
        {result && (
          <div className="modal-foot" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={onClose}>Sluiten</button>
          </div>
        )}
      </div>
    </div>
  );
}

function HeartMark() {
  return (
    <svg className="icon-heart" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d="M12 21s-7.5-4.6-10-9.2C.4 8.6 2.1 4.5 6 4.5c2.3 0 3.6 1.3 4.4 2.5h3.2c.8-1.2 2.1-2.5 4.4-2.5 3.9 0 5.6 4.1 4 7.3C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

function StepParty({ party, setParty, tooBig, max }) {
  const counts = Array.from({ length: max + 1 }, (_, i) => i + 1);
  return (
    <React.Fragment>
      <h3>Met hoeveel komen jullie?</h3>
      <p className="sub">Inclusief jezelf. Kinderen ook meetellen.</p>
      <div className="party-grid">
        {counts.map((n) => (
          <button
            key={n}
            type="button"
            className={"party-btn" + (party === n ? " selected" : "")}
            onClick={() => setParty(n)}
          >
            {n > max ? `${n}+` : n}
          </button>
        ))}
      </div>
      {tooBig && (
        <div className="callout">
          Voor gezelschappen vanaf {max + 1} personen vragen we je telefonisch te reserveren via{" "}
          <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>. We bekijken dan samen wat er kan.
        </div>
      )}
    </React.Fragment>
  );
}

function StepDate({ types, date, setDate, today, maxDate, typesOnDate }) {
  const api = window.ReserveApi;
  const when = types
    .map((t) => ({ name: t.name, days: api.daysText(api.bookableDays(t)) }))
    .filter((t) => t.days);
  return (
    <React.Fragment>
      <h3>Wanneer komen jullie?</h3>
      <p className="sub">
        {when.length ? when.map((t) => `${t.name} kan op ${t.days}`).join(". ") + "." : "Kies een datum."}
      </p>
      <div className="field">
        <label className="field-label" htmlFor="r-date">Datum</label>
        <input
          id="r-date"
          type="date"
          min={today}
          max={maxDate}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="date-input"
        />
        {date && <p className="sub" style={{ margin: "8px 0 0" }}>{fmtDate(date)}</p>}
        {date && typesOnDate.length === 0 && (
          <div className="callout" style={{ marginTop: 12 }}>
            Op {api.DAY_NAMES[api.isoDow(date)]} kun je online niet reserveren. Kies een andere dag, of bel ons op{" "}
            <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>.
          </div>
        )}
      </div>
    </React.Fragment>
  );
}

function StepType({ types, typeId, setType, choice, setChoice, date }) {
  const type = types.find((t) => t.id === typeId);
  const options = (type && type.options) || [];
  const day = fmtDate(date);
  return (
    <React.Fragment>
      <h3>Waarvoor wil je reserveren?</h3>
      <p className="sub">Dit kan op {day.charAt(0).toLowerCase() + day.slice(1)}.</p>
      <div className="choice-grid">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            className={"choice" + (typeId === t.id ? " selected" : "")}
            onClick={() => setType(t.id)}
            aria-pressed={typeId === t.id}
          >
            <span className="icon-mark"><HeartMark /></span>
            <span style={{ flex: 1 }}>
              <span className="title" style={{ display: "block" }}>{t.name}</span>
              {t.description && <p className="desc">{t.description}</p>}
              {t.tag && <span className="tag">{t.tag}</span>}
            </span>
          </button>
        ))}
      </div>
      {options.length > 0 && (
        <div className="field" style={{ marginTop: 20 }}>
          <label className="field-label" id="r-choice-label">Wat wil je bij {type.name}?</label>
          <div className="option-grid" role="radiogroup" aria-labelledby="r-choice-label">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={choice === o}
                className={"party-btn option-btn" + (choice === o ? " selected" : "")}
                onClick={() => setChoice(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

const SLOT_REASON = { vol: "vol", gesloten: "dicht", voorbij: "voorbij", te_ver: "te ver" };

function StepTime({ label, time, setTime, slots, slotsError, submitError, date }) {
  const noneFree = slots && slots.length > 0 && !slots.some((s) => s.available);
  const day = fmtDate(date);
  return (
    <React.Fragment>
      <h3>Hoe laat?</h3>
      <p className="sub">{label} op {day.charAt(0).toLowerCase() + day.slice(1)}. Kies een tijd.</p>
      {submitError && <div className="callout callout-error" role="alert" style={{ marginTop: 0, marginBottom: 16 }}>{submitError}</div>}
      <div className="field">
        <label className="field-label">Tijdslot</label>
        {slots === null ? (
          <p className="sub" aria-live="polite" style={{ margin: "8px 0 0" }}>Beschikbaarheid ophalen…</p>
        ) : slotsError ? (
          <div className="callout callout-error" role="alert">{slotsError}</div>
        ) : (
          <React.Fragment>
            <div className="time-grid">
              {slots.map((s) => (
                <button
                  key={s.slot}
                  type="button"
                  className={"time-btn" + (time === s.slot ? " selected" : "")}
                  onClick={() => setTime(s.slot)}
                  disabled={!s.available}
                  aria-label={s.available ? s.slot : `${s.slot}, ${SLOT_REASON[s.reason] || "niet beschikbaar"}`}
                >
                  {s.slot}
                  {!s.available && <span className="time-note">{SLOT_REASON[s.reason] || "bezet"}</span>}
                </button>
              ))}
            </div>
            {(noneFree || slots.length === 0) && (
              <div className="callout">
                Op deze dag is online niets meer vrij. Kies een andere dag, of bel{" "}
                <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>: soms kunnen we nog schuiven.
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}

function StepDetails({ form, setForm, label, party, date, time, errors, submitError, askMarketing, marketingText }) {
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const err = (k) => errors[k] ? <p className="field-error" id={`r-${k}-err`}>{errors[k]}</p> : null;
  return (
    <React.Fragment>
      <h3>Tot zo!</h3>
      <p className="sub">
        Je reserveert <strong>{label.toLowerCase()}</strong> voor <strong>{party} {party === 1 ? "persoon" : "personen"}</strong> op <strong>{fmtDate(date).charAt(0).toLowerCase() + fmtDate(date).slice(1)}</strong> om <strong>{time}</strong>.
      </p>

      {submitError && <div className="callout callout-error" role="alert" style={{ marginTop: 0, marginBottom: 16 }}>{submitError}</div>}

      <div className="field-row">
        <div className="field">
          <label className="field-label" htmlFor="r-name">Naam</label>
          <input id="r-name" className="text-input" value={form.name} onChange={upd("name")} placeholder="Voor- en achternaam" autoComplete="name" maxLength={100} aria-invalid={!!errors.name} aria-describedby={errors.name ? "r-name-err" : undefined} />
          {err("name")}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="r-phone">Telefoon</label>
          <input id="r-phone" className="text-input" type="tel" value={form.phone} onChange={upd("phone")} placeholder="06 ..." autoComplete="tel" maxLength={40} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "r-phone-err" : undefined} />
          {err("phone")}
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="r-email">E-mail</label>
        <input id="r-email" className="text-input" type="email" value={form.email} onChange={upd("email")} placeholder="naam@voorbeeld.nl" autoComplete="email" maxLength={254} aria-invalid={!!errors.email} aria-describedby={errors.email ? "r-email-err" : undefined} />
        {err("email")}
      </div>
      <div className="field">
        <label className="field-label" htmlFor="r-notes">Opmerkingen of dieetwensen</label>
        <textarea
          id="r-notes"
          className="textarea-input"
          rows="3"
          maxLength={1000}
          value={form.notes}
          onChange={upd("notes")}
          placeholder="Glutenvrij, kinderstoel, verjaardag, … laat het weten."
        />
      </div>
      {askMarketing && (
        <label className="consent" htmlFor="r-marketing">
          <input
            id="r-marketing"
            type="checkbox"
            checked={form.marketing}
            onChange={(e) => setForm({ ...form, marketing: e.target.checked })}
          />
          <span>{marketingText}</span>
        </label>
      )}
      {/* Honeypot tegen spambots: onzichtbaar voor mensen. */}
      <div className="hp-field" aria-hidden="true">
        <label htmlFor="r-website">Website</label>
        <input id="r-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={upd("website")} />
      </div>
      <p className="form-note">
        We gebruiken je gegevens voor deze reservering{askMarketing ? " en, als je het vinkje aanzet, voor af en toe een nieuwsbrief" : ""}. Lees meer in ons{" "}
        <a href="#privacybeleid" target="_blank" rel="noopener">privacybeleid</a>.
      </p>
    </React.Fragment>
  );
}

function Confirmation({ label, party, date, time, form, result }) {
  const confirmed = result.status === "bevestigd";
  return (
    <div className="confirmation">
      <div className="mark">✓</div>
      <h3>{confirmed ? "Je reservering staat vast." : "Je aanvraag is binnen."}</h3>
      <p>
        {!result.mailed
          ? <React.Fragment>Je {confirmed ? "reservering" : "aanvraag"} staat bij ons, maar de mail naar <strong>{form.email}</strong> lukte niet. Geen zorgen: we nemen contact met je op als dat nodig is.</React.Fragment>
          : confirmed
            ? <React.Fragment>De bevestiging staat in je mail op <strong>{form.email}</strong>. Tot dan!</React.Fragment>
            : <React.Fragment>Je krijgt zo een mail op <strong>{form.email}</strong>. Zodra we je reservering hebben bevestigd, sturen we nog een mail.</React.Fragment>}
      </p>
      <p style={{ fontSize: 13 }}>
        Plannen veranderd? Bel even: <a href={window.BRAND.phoneHref} style={{ color: "var(--aubergine)" }}>{window.BRAND.phone}</a>
      </p>

      <dl className="recap">
        <dt>Reservering</dt>
        <dd>{label}</dd>
        <dt>Gasten</dt>
        <dd>{party} {party === 1 ? "persoon" : "personen"}</dd>
        <dt>Datum & tijd</dt>
        <dd>{fmtDate(date)} · {time}</dd>
        <dt>Op naam van</dt>
        <dd>{form.name}</dd>
        {form.notes && (
          <React.Fragment>
            <dt>Opmerking</dt>
            <dd style={{ fontStyle: "italic", fontWeight: 400 }}>"{form.notes}"</dd>
          </React.Fragment>
        )}
      </dl>
    </div>
  );
}

Object.assign(window, { ReserveModal, fmtReserveDate: fmtDate });
