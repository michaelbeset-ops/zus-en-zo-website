/* global window, React */
// =============================================================
// Reservation modal, 4-step flow
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
    <div className="steps" role="progressbar" aria-valuemin="1" aria-valuemax={total} aria-valuenow={step}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const cls = n < step ? "step-pill done" : n === step ? "step-pill active" : "step-pill";
        return (
          <div key={i} className={cls}>
            <span>0{n}</span>
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

function ReserveModal({ open, onClose, initialType }) {
  const cfg = useReserveConfig();
  const S = cfg.settings;
  const MAX_ONLINE = S.max_guests_online;

  const [step, setStep] = useStateR(1);
  const [typeId, setTypeId] = useStateR(initialType || null);
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
      setTypeId(initialType || null);
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

  const type = cfg.types.find((t) => t.id === typeId) || null;

  // Een vooraf gekozen soort die niet (meer) bestaat: gewoon laten kiezen.
  useEffectR(() => {
    if (open && typeId && !type) setTypeId(null);
  }, [open, typeId, type]);

  // Beschikbaarheid ophalen zodra soort, aantal en datum bekend zijn.
  const dateClosed = !!date && !!type && !window.ReserveApi.dayAllowed(type, date);
  useEffectR(() => {
    if (!open || !type || !date || dateClosed) { setSlots(null); return; }
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
  }, [open, typeId, type && type.first_slot, party, date, dateClosed, slotsVersion]);

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

  const canNext1 = !!type;
  const canNext2 = !tooBig;
  const canNext3 = !!date && !!time && !dateClosed;

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => { setSubmitError(""); setStep((s) => Math.max(1, s - 1)); };

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
      if (code !== "ongeldig") setStep(3);
    }
    setSubmitError(window.ReserveApi.message(code));
  };

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
          {!result && <StepIndicator step={step} total={4} />}
        </div>

        <div className="modal-body">
          {result ? (
            <Confirmation type={type} party={party} date={date} time={time} form={form} result={result} />
          ) : step === 1 ? (
            <Step1 types={cfg.types} typeId={typeId} setType={(t) => { setTypeId(t); setTime(""); }} />
          ) : step === 2 ? (
            <Step2 party={party} setParty={setParty} tooBig={tooBig} max={MAX_ONLINE} />
          ) : step === 3 ? (
            <Step3
              type={type} date={date} setDate={setDate}
              time={time} setTime={setTime}
              today={today} maxDate={maxDate}
              dateClosed={dateClosed}
              slots={slots} slotsError={slotsError}
              submitError={submitError}
            />
          ) : (
            <Step4
              form={form} setForm={setForm} type={type} party={party} date={date} time={time}
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
            {step < 4 ? (
              <button
                className="btn btn-primary"
                onClick={() => { setSubmitError(""); next(); }}
                disabled={
                  (step === 1 && !canNext1) ||
                  (step === 2 && !canNext2) ||
                  (step === 3 && !canNext3)
                }
              >
                Volgende →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onSubmit} disabled={sending || (touched && !formValid)}>
                {sending ? "Versturen…" : S.auto_confirm ? "Reserveer" : "Verstuur aanvraag"}
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

function Step1({ types, typeId, setType }) {
  return (
    <React.Fragment>
      <h3>Waarvoor wil je reserveren?</h3>
      <p className="sub">Kies waar je voor komt. We bereiden alvast de juiste tafel voor.</p>
      {types.length === 0 ? (
        <div className="callout">
          Online reserveren kan op dit moment niet. Bel ons gerust op{" "}
          <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>.
        </div>
      ) : (
        <div className="choice-grid">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              className={"choice" + (typeId === t.id ? " selected" : "")}
              onClick={() => setType(t.id)}
            >
              <span className="icon-mark">{t.name.charAt(0).toUpperCase()}</span>
              <span style={{ flex: 1 }}>
                <span className="title" style={{ display: "block" }}>{t.name}</span>
                {t.description && <p className="desc">{t.description}</p>}
                {t.tag && <span className="tag">{t.tag}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </React.Fragment>
  );
}

function Step2({ party, setParty, tooBig, max }) {
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

const SLOT_REASON = { vol: "vol", gesloten: "dicht", voorbij: "voorbij", te_ver: "te ver" };

function Step3({ type, date, setDate, time, setTime, today, maxDate, dateClosed, slots, slotsError, submitError }) {
  const noneFree = slots && slots.length > 0 && !slots.some((s) => s.available);
  const days = window.ReserveApi.daysText(window.ReserveApi.bookableDays(type));
  const name = type.name.toLowerCase();
  return (
    <React.Fragment>
      <h3>Wanneer komen jullie?</h3>
      <p className="sub">
        {days ? `${type.name} kan op ${days}. ` : ""}Kies een datum en daarna een tijd.
      </p>
      {submitError && <div className="callout callout-error" role="alert" style={{ marginTop: 0, marginBottom: 16 }}>{submitError}</div>}
      <div className="field">
        <label className="field-label" htmlFor="r-date">Datum</label>
        <input
          id="r-date"
          type="date"
          min={today}
          max={maxDate}
          value={date}
          onChange={(e) => { setDate(e.target.value); setTime(""); }}
          className="date-input"
        />
        {dateClosed && (
          <div className="callout" style={{ marginTop: 12 }}>
            Op {window.ReserveApi.DAY_NAMES[window.ReserveApi.isoDow(date)]} kun je geen {name} reserveren.
            {days ? ` Dat kan op ${days}.` : ""}
          </div>
        )}
      </div>
      {date && !dateClosed && (
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
      )}
    </React.Fragment>
  );
}

function Step4({ form, setForm, type, party, date, time, errors, submitError, askMarketing, marketingText }) {
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const err = (k) => errors[k] ? <p className="field-error" id={`r-${k}-err`}>{errors[k]}</p> : null;
  return (
    <React.Fragment>
      <h3>Tot zo!</h3>
      <p className="sub">
        Je reserveert <strong>{type.name.toLowerCase()}</strong> voor <strong>{party} {party === 1 ? "persoon" : "personen"}</strong> op <strong>{fmtDate(date).charAt(0).toLowerCase() + fmtDate(date).slice(1)}</strong> om <strong>{time}</strong>.
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

function Confirmation({ type, party, date, time, form, result }) {
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
        <dd>{type.name}</dd>
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
