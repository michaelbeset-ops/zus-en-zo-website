/* global window, React */
// =============================================================
// CONTACT page
// =============================================================
const { useState: useStateC } = React;

function MapPlaceholder() {
  // Hand-drawn stylized map: a few crossing lines suggesting a plein, with a pin
  return (
    <div className="map-ph">
      <svg viewBox="0 0 500 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="500" height="400" fill="#EEE7DC" />
        {/* parcels */}
        <rect x="40" y="40" width="120" height="80" fill="#E4D9C6" />
        <rect x="40" y="140" width="80" height="100" fill="#E4D9C6" />
        <rect x="140" y="140" width="100" height="60" fill="#E4D9C6" />
        <rect x="260" y="40" width="200" height="100" fill="#E4D9C6" />
        <rect x="40" y="280" width="200" height="80" fill="#E4D9C6" />
        <rect x="320" y="180" width="140" height="100" fill="#E4D9C6" />
        <rect x="280" y="300" width="180" height="60" fill="#E4D9C6" />
        {/* streets */}
        <line x1="0" y1="130" x2="500" y2="130" stroke="#FBF8F3" strokeWidth="14" />
        <line x1="0" y1="270" x2="500" y2="270" stroke="#FBF8F3" strokeWidth="14" />
        <line x1="170" y1="0" x2="170" y2="400" stroke="#FBF8F3" strokeWidth="14" />
        <line x1="260" y1="0" x2="260" y2="400" stroke="#FBF8F3" strokeWidth="14" />
        {/* plein */}
        <rect x="170" y="210" width="90" height="60" fill="#D8CFC0" />
        <text x="180" y="247" fontSize="11" fontFamily="DM Mono, monospace" fill="#8B7355" letterSpacing="2">RAADHUISPL.</text>
        {/* small details */}
        <line x1="0" y1="200" x2="170" y2="200" stroke="#E4D9C6" strokeWidth="2" />
        <line x1="260" y1="200" x2="500" y2="200" stroke="#E4D9C6" strokeWidth="2" />
      </svg>
      <div className="map-pin">
        <div className="label"><span className="a">37</span> Zus &amp; Zo</div>
        <div className="ball" />
      </div>
    </div>
  );
}

function ContactForm() {
  const [form, setForm] = useStateC({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useStateC(false);
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (form.name && form.email && form.message) setSent(true);
  };

  if (sent) {
    return (
      <div className="contact-form" style={{ background: "var(--aubergine-wash)", padding: 32 }}>
        <h3>Bedankt, <span className="em">{form.name.split(" ")[0] || "we"}</span>.</h3>
        <p style={{ color: "var(--ink-soft)", margin: 0 }}>
          Je bericht is verzonden. We mailen je binnen één werkdag terug op{" "}
          <strong>{form.email}</strong>. Tot snel!
        </p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <h3>Stuur ons een <span className="em">berichtje.</span></h3>
      <div className="field-row">
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="field-label" htmlFor="c-name">Naam</label>
          <input id="c-name" className="text-input" value={form.name} onChange={upd("name")} required />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="field-label" htmlFor="c-email">E-mail</label>
          <input id="c-email" type="email" className="text-input" value={form.email} onChange={upd("email")} required />
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label className="field-label" htmlFor="c-subject">Onderwerp</label>
        <input id="c-subject" className="text-input" value={form.subject} onChange={upd("subject")} placeholder="Reservering, vraag, sollicitatie, ..." />
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label className="field-label" htmlFor="c-message">Bericht</label>
        <textarea id="c-message" rows="5" className="textarea-input" value={form.message} onChange={upd("message")} required />
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 8, flexWrap: "wrap" }}>
        <button type="submit" className="btn btn-primary">Verstuur bericht</button>
        <span className="eyebrow">Of bel ons direct op {window.BRAND.phone}</span>
      </div>
    </form>
  );
}

function PageContact({ openReserve }) {
  const B = window.BRAND;
  return (
    <main>
      <window.PageHero
        placeholder
        tint="daylight"
        eyebrow="Pagina 05 · Contact"
        number="№ 05"
        titleNode={
          <React.Fragment>
            Wil je iets <span className="it">weten,</span><br/>
            of langskomen?
          </React.Fragment>
        }
        lede="Reserveren, sollicitatie, een vraag over een verjaardag, schroom niet. We zitten aan het Raadhuisplein en zijn er bijna elke dag."
        tag={{ n: "PLACEHOLDER", text: "Gevel & terras aan het Raadhuisplein" }}
      >
        <div className="page-hero-cta-row">
          <button className="nav-cta" onClick={openReserve} style={{ padding: "14px 22px", fontSize: 14 }}>
            Reserveer direct <IconArrow />
          </button>
          <a className="page-hero-arrow-link" href={B.phoneHref}>
            {B.phone} <IconArrow />
          </a>
        </div>
      </window.PageHero>

      <div className="container contact-grid">
        <div className="contact-info">
          <div className="info-block">
            <h4>Bezoek</h4>
            <p className="big">{B.address}</p>
            <p>{B.postcode}<br/>Etten-Leur · tegenover het stadskantoor</p>
          </div>
          <div className="info-block">
            <h4>Bel</h4>
            <p className="big"><a href={B.phoneHref}>{B.phone}</a></p>
            <p>Even overleggen mag altijd.</p>
          </div>
          <div className="info-block">
            <h4>Mail</h4>
            <p className="big"><a href={`mailto:${B.email}`}>{B.email}</a></p>
            <p>Bestellingen vóór 11:00 uur: <a href={`mailto:${B.emailOrder}`}>{B.emailOrder}</a></p>
          </div>
          <div className="info-block">
            <h4>Openingstijden</h4>
            <div style={{ display: "grid", gap: 4, marginTop: 6, fontFamily: "var(--mono)", fontSize: 13 }}>
              {window.HOURS.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dotted var(--line)", padding: "6px 0" }}>
                  <span style={{ color: h.closed ? "var(--ink-mute)" : "var(--ink)" }}>{h.day}</span>
                  <span style={{ color: h.special ? "var(--aubergine)" : "var(--ink-soft)", fontWeight: h.special ? 600 : 400 }}>{h.time}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="nav-cta" onClick={openReserve} style={{ alignSelf: "flex-start" }}>
            Reserveer een tafel <IconArrow />
          </button>
        </div>

        <div>
          <MapPlaceholder />
          <ContactForm />
        </div>
      </div>
    </main>
  );
}

Object.assign(window, { PageContact, MapPlaceholder });
