/* global window, React */
// =============================================================
// HOME PAGE
// =============================================================

function PagePlaceholder({ label, icon, dark }) {
  return (
    <div className="placeholder" style={dark ? { background: "var(--ink)" } : null}>
      <span className="ph-icon" style={dark ? { color: "var(--gold-soft)" } : null}>{icon || "✦"}</span>
      <span className="ph-label" style={dark ? { color: "var(--gold-soft)" } : null}>{label}</span>
    </div>
  );
}

// Beige balk: Lunch, Zus & Zo en High Tea afwisselend, met paarse hartjes,
// tot de rand van het scherm.
const STRIP_WORDS = ["Lunch", "Zus & Zo", "High Tea"];

function Heart() {
  return (
    <svg className="strip-heart" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
      <path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 2.9 5 6.4 5c2 0 3.3 1.1 4.1 2.3.4.6 1.6.6 2 0C13.3 6.1 14.6 5 16.6 5 20.1 5 22 8.6 21.6 11.8 19.5 16.4 12 21 12 21z" fill="currentColor" />
    </svg>
  );
}

function Hero({ go, openReserve }) {
  const words = Array.from({ length: 12 }, () => STRIP_WORDS).flat();
  return (
    <React.Fragment>
      <window.PageHero
        image="assets/interieur.jpg"
        alt="Interieur Zus & Zo met paarse luchter, houten bar en bloemen"
        titleNode={
          <React.Fragment>
            Een tafel<br/>
            <span className="it">vol gezelligheid.</span>
          </React.Fragment>
        }
      >
        <div className="page-hero-cta-row">
          <button className="nav-cta" onClick={openReserve} style={{ padding: "14px 22px", fontSize: 14 }}>
            Reserveer een tafel <IconArrow />
          </button>
          <a
            className="page-hero-arrow-link"
            href="#lunch"
            onClick={(e) => { e.preventDefault(); go("lunch"); }}
          >
            Bekijk de kaart <IconArrow />
          </a>
        </div>
      </window.PageHero>

      <div className="detail-strip" role="presentation">
        <span className="visually-hidden">Lunch, Zus &amp; Zo, High Tea</span>
        <div className="strip-track" aria-hidden="true">
          {words.map((w, i) => (
            <React.Fragment key={i}>
              <span>{w}</span>
              <Heart />
            </React.Fragment>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}

function Intro() {
  return (
    <section className="section">
      <div className="container intro-welcome">
        <span className="eyebrow"><span className="num">№ 02</span>Even voorstellen</span>
        <h2>Welkom bij Zus &amp; Zo!</h2>
        <p>
          Ons gezellige lunchcafé, waar genieten en lekker eten centraal staan. Van een lekkere
          lunch en goede koffie tot een high tea. Bij Zus &amp; Zo draait alles om samen genieten,
          lekker bijkletsen en tijd voor elkaar.
        </p>
        <p className="signature">Met liefs, het team van Zus &amp; Zo</p>
      </div>
    </section>
  );
}

function Offerings({ go }) {
  return (
    <section className="offerings section">
      <div className="container">
        <div className="offer-head">
          <div>
            <span className="eyebrow"><span className="num">№ 03</span>Bij ons</span>
            <h2>Dit doen we <span className="em">het liefst.</span></h2>
          </div>
        </div>

        {window.OFFERINGS.map((o) => (
          <div key={o.id} className={"offer-row" + (o.layout === "right" ? " reverse" : "")}>
            <div className="o-media">
              <img src={o.image} alt={o.alt} />
            </div>
            <div className="o-text">
              <span className="num">{o.num}</span>
              <h3>
                {o.title}<br/>
                <span className="em">{o.titleEm}.</span>
              </h3>
              <p>{o.body}</p>
              {o.link && (
                <a
                  className="read-link"
                  href={`#${o.link.page}`}
                  onClick={(e) => { e.preventDefault(); go(o.link.page); }}
                >
                  {o.link.label} <IconArrow />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function InstaFeed() {
  const posts = window.INSTA_POSTS;
  return (
    <section className="insta">
      <div className="container">
        <div className="insta-head">
          <div>
            <span className="eyebrow"><span className="num">№ 04</span>De laatste hapjes</span>
            <h2 className="mt-sm">Op <span className="em">Instagram.</span></h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <a className="handle" href={window.BRAND.instagramUrl}>{window.BRAND.instagram}</a>
            <div className="eyebrow" style={{ marginTop: 4 }}>Volg ons mee →</div>
          </div>
        </div>
        <div className="insta-scroll-wrap">
          <div className="insta-grid">
            {posts.map((p, i) => (
              <a key={i} className="insta-cell" href={p.url || window.BRAND.instagramUrl} target="_blank" rel="noopener noreferrer">
                {p.image ? (
                  <img src={p.image} alt={p.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div className="placeholder">
                    <span className="ph-icon">✦</span>
                    <span className="ph-label">{p.label}</span>
                  </div>
                )}
                <div className="overlay">{p.label}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Vacature({ go }) {
  return (
    <section className="vacature">
      <div className="container vac-grid">
        <div className="vac-poster">
          <img src="assets/vacature.png" alt="Vacature poster: Wij zoeken jou, Horeca toppers met ervaring" />
        </div>
        <div className="vac-text">
          <span className="eyebrow"><span className="num" style={{ color: "var(--aubergine)" }}>№ 05</span>We zoeken mensen</span>
          <h2>Kom je <span className="em">bij ons werken?</span></h2>
          <p>
            We zoeken horeca-toppers met ervaring die het leuk vinden om gasten in de watten
            te leggen. Keuken, bediening, of een echte alleskunner, laat van je horen.
          </p>
          <div className="vac-cta">
            <a className="nav-cta" href={`mailto:${window.BRAND.email}?subject=Sollicitatie`}>
              Solliciteer nu <IconArrow />
            </a>
            <span className="eyebrow">Stuur CV naar info@lunchcafezusenzo.nl</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function HoursAndImpression() {
  return (
    <section className="hours-section">
      <div className="container hours-grid">
        <div className="hours-text">
          <span className="eyebrow"><span className="num">№ 06</span>Wanneer we open zijn</span>
          <h2>Openingstijden</h2>
          <p>Loop gerust binnen. Een tafel reserveren is fijn, maar niet verplicht.</p>
        </div>
        <div className="hours-table">
          {window.HOURS.map((h, i) => (
            <div
              key={i}
              className={
                "hours-row" +
                (h.closed ? " closed" : "") +
                (h.special ? " special" : "")
              }
            >
              <div className="day">
                {h.day}
                {h.note && <span className="note">{h.note}</span>}
              </div>
              <div className="time">{h.time}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PageHome({ go, openReserve }) {
  return (
    <main>
      <Hero go={go} openReserve={openReserve} />
      <Intro />
      <Offerings go={go} />
      <InstaFeed />
      <Vacature go={go} />
      <HoursAndImpression />
    </main>
  );
}

Object.assign(window, { PageHome, PagePlaceholder });
