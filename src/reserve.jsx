/* global window, React */
// =============================================================
// Reservation modal, 4-step flow
// =============================================================
const { useState: useStateR, useEffect: useEffectR } = React;

const RESERVE_TYPES = [
  { id: "lunch",   title: "Lunch",     desc: "Belegde broodjes, salades, koffie & lekkers", icon: "L" },
  { id: "hightea", title: "High Tea",  desc: "Uitgebreide 3-gangen high tea op reservering", icon: "H" },
  { id: "diner",   title: "Diner",     desc: "We trekken alles uit de kast", icon: "D", tag: "Alleen op vrijdagavond" },
];

const TIME_SLOTS = {
  lunch:   ["11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00"],
  hightea: ["13:00", "13:30", "14:00", "14:30", "15:00"],
  diner:   ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"],
};

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

function isFriday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay() === 5; // 0=Sun, 5=Fri
}

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const day = d.toLocaleDateString("nl-NL", { weekday: "long" });
  const rest = d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  return day.charAt(0).toUpperCase() + day.slice(1) + " " + rest;
}

function ReserveModal({ open, onClose, initialType }) {
  const [step, setStep] = useStateR(1);
  const [type, setType] = useStateR(initialType || null);
  const [party, setParty] = useStateR(2);
  const [date, setDate] = useStateR("");
  const [time, setTime] = useStateR("");
  const [form, setForm] = useStateR({ name: "", email: "", phone: "", notes: "" });
  const [confirmed, setConfirmed] = useStateR(false);

  useEffectR(() => {
    if (open) {
      setStep(1);
      setType(initialType || null);
      setParty(2);
      setDate("");
      setTime("");
      setForm({ name: "", email: "", phone: "", notes: "" });
      setConfirmed(false);
    }
    document.body.classList.toggle("no-scroll", open);
  }, [open, initialType]);

  if (!open) return null;

  const today = new Date().toISOString().slice(0, 10);
  const tooBig = party >= 9;
  const dinerNeedsFriday = type === "diner" && date && !isFriday(date);

  const canNext1 = !!type;
  const canNext2 = !tooBig;
  const canNext3 = !!date && !!time && (type !== "diner" || isFriday(date));
  const canSubmit = form.name && form.email && form.phone;

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = () => setConfirmed(true);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="reserve-title">
        <div className="modal-head">
          <div className="modal-head-row">
            <h2 id="reserve-title" className="modal-title">
              {confirmed ? "Bedankt!" : "Reserveer een tafel"}
            </h2>
            <button className="modal-close" onClick={onClose} aria-label="Sluiten">
              <IconClose />
            </button>
          </div>
          {!confirmed && <StepIndicator step={step} total={4} />}
        </div>

        <div className="modal-body">
          {confirmed ? (
            <Confirmation type={type} party={party} date={date} time={time} form={form} />
          ) : step === 1 ? (
            <Step1 type={type} setType={setType} />
          ) : step === 2 ? (
            <Step2 party={party} setParty={setParty} tooBig={tooBig} />
          ) : step === 3 ? (
            <Step3
              type={type} date={date} setDate={setDate}
              time={time} setTime={setTime}
              today={today}
              dinerNeedsFriday={dinerNeedsFriday}
            />
          ) : (
            <Step4 form={form} setForm={setForm} type={type} party={party} date={date} time={time} />
          )}
        </div>

        {!confirmed && (
          <div className="modal-foot">
            <button
              className="btn-ghost btn"
              style={{ borderColor: "transparent" }}
              onClick={step === 1 ? onClose : prev}
            >
              {step === 1 ? "Annuleren" : "← Terug"}
            </button>
            {step < 4 ? (
              <button
                className="btn btn-primary"
                onClick={next}
                disabled={
                  (step === 1 && !canNext1) ||
                  (step === 2 && !canNext2) ||
                  (step === 3 && !canNext3)
                }
              >
                Volgende →
              </button>
            ) : (
              <button className="btn btn-primary" onClick={onSubmit} disabled={!canSubmit}>
                Bevestig reservering
              </button>
            )}
          </div>
        )}
        {confirmed && (
          <div className="modal-foot" style={{ justifyContent: "flex-end" }}>
            <button className="btn btn-primary" onClick={onClose}>Sluiten</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Step1({ type, setType }) {
  return (
    <React.Fragment>
      <h3>Waarvoor wil je reserveren?</h3>
      <p className="sub">Kies waar je voor komt. We bereiden alvast de juiste tafel voor.</p>
      <div className="choice-grid">
        {RESERVE_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={"choice" + (type === t.id ? " selected" : "")}
            onClick={() => setType(t.id)}
          >
            <span className="icon-mark">{t.icon}</span>
            <span style={{ flex: 1 }}>
              <span className="title" style={{ display: "block" }}>{t.title}</span>
              <p className="desc">{t.desc}</p>
              {t.tag && <span className="tag">{t.tag}</span>}
            </span>
          </button>
        ))}
      </div>
    </React.Fragment>
  );
}

function Step2({ party, setParty, tooBig }) {
  const counts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
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
            {n === 10 ? "10+" : n}
          </button>
        ))}
      </div>
      {tooBig && (
        <div className="callout">
          Voor gezelschappen vanaf 9 personen vragen we je telefonisch te reserveren via{" "}
          <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>. We bekijken dan samen wat er kan.
        </div>
      )}
    </React.Fragment>
  );
}

function Step3({ type, date, setDate, time, setTime, today, dinerNeedsFriday }) {
  const slots = TIME_SLOTS[type] || TIME_SLOTS.lunch;
  return (
    <React.Fragment>
      <h3>Wanneer komen jullie?</h3>
      <p className="sub">
        {type === "diner"
          ? "Diner is alleen op vrijdagavond beschikbaar."
          : "Kies een datum en daarna een tijd."}
      </p>
      <div className="field">
        <label className="field-label" htmlFor="r-date">Datum</label>
        <input
          id="r-date"
          type="date"
          min={today}
          value={date}
          onChange={(e) => { setDate(e.target.value); setTime(""); }}
          className="date-input"
        />
        {dinerNeedsFriday && (
          <div className="callout" style={{ marginTop: 12 }}>
            Het vrijdagavond-diner serveren we alleen op vrijdag, kies graag een vrijdag in de kalender.
          </div>
        )}
      </div>
      {date && !dinerNeedsFriday && (
        <div className="field">
          <label className="field-label">Tijdslot</label>
          <div className="time-grid">
            {slots.map((t) => (
              <button
                key={t}
                type="button"
                className={"time-btn" + (time === t ? " selected" : "")}
                onClick={() => setTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function Step4({ form, setForm, type, party, date, time }) {
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const typeLabel = (RESERVE_TYPES.find((t) => t.id === type) || {}).title || "";
  return (
    <React.Fragment>
      <h3>Tot zo!</h3>
      <p className="sub">
        We reserveren <strong>{typeLabel.toLowerCase()}</strong> voor <strong>{party} {party === 1 ? "persoon" : "personen"}</strong> op <strong>{fmtDate(date)}</strong> om <strong>{time}</strong>.
      </p>

      <div className="field-row">
        <div className="field">
          <label className="field-label" htmlFor="r-name">Naam</label>
          <input id="r-name" className="text-input" value={form.name} onChange={upd("name")} placeholder="Voor- en achternaam" />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="r-phone">Telefoon</label>
          <input id="r-phone" className="text-input" type="tel" value={form.phone} onChange={upd("phone")} placeholder="06 ..." />
        </div>
      </div>
      <div className="field">
        <label className="field-label" htmlFor="r-email">E-mail</label>
        <input id="r-email" className="text-input" type="email" value={form.email} onChange={upd("email")} placeholder="naam@voorbeeld.nl" />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="r-notes">Opmerkingen of dieetwensen</label>
        <textarea
          id="r-notes"
          className="textarea-input"
          rows="3"
          value={form.notes}
          onChange={upd("notes")}
          placeholder="Glutenvrij, kinderstoel, verjaardag, … laat het weten."
        />
      </div>
    </React.Fragment>
  );
}

function Confirmation({ type, party, date, time, form }) {
  const typeLabel = (RESERVE_TYPES.find((t) => t.id === type) || {}).title || "";
  return (
    <div className="confirmation">
      <div className="mark">✓</div>
      <h3>Tot ziens op {fmtDate(date).split(" ").slice(0, 3).join(" ")}.</h3>
      <p>
        We sturen je een bevestiging op <strong>{form.email}</strong>.
      </p>
      <p style={{ fontSize: 13 }}>
        Plannen veranderd? Bel even: <a href={window.BRAND.phoneHref} style={{ color: "var(--aubergine)" }}>{window.BRAND.phone}</a>
      </p>

      <dl className="recap">
        <dt>Reservering</dt>
        <dd>{typeLabel}</dd>
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

Object.assign(window, { ReserveModal });
