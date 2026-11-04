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
  const words = Array.from({ length: 6 }, () => STRIP_WORDS).flat();
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
        {/* Twee gelijke rijen naast elkaar die samen naar links schuiven: naadloos rondlopend. */}
        <div className="strip-move" aria-hidden="true">
          {[0, 1].map((k) => (
            <div className="strip-track" key={k}>
              {words.map((w, i) => (
                <React.Fragment key={i}>
                  <span>{w}</span>
                  <Heart />
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
}

// Paarse tekeningetjes naast het welkom: kopje met hartjes links, etagère rechts.
function IntroDecoLeft() {
  return (
    <svg className="intro-deco intro-deco-left" viewBox="0 0 200 320" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M58 150c-6-10 6-16 0-26M78 146c-6-10 6-16 0-26M98 150c-6-10 6-16 0-26" opacity=".55" />
        <path d="M40 168h80l-8 52a20 20 0 0 1-20 17H68a20 20 0 0 1-20-17z" />
        <path d="M118 182h10a14 14 0 0 1 0 28h-14" />
        <path d="M30 248h110" />
        <path d="M150 40c10 18 10 36 0 54" opacity=".35" />
        <path d="M24 70c14-6 28-6 42 0" opacity=".35" />
      </g>
      <path className="h1" d="M80 205s-12-7-15-14c-2-5 1-11 7-11 4 0 6 2 8 5 2-3 4-5 8-5 6 0 9 6 7 11-3 7-15 14-15 14z" />
      <path className="h2" d="M150 120s-10-6-12-11c-2-4 1-9 6-9 3 0 5 2 6 4 1-2 3-4 6-4 5 0 8 5 6 9-2 5-12 11-12 11z" />
      <path className="h3" d="M46 60s-8-5-10-9c-1-3 1-7 5-7 2 0 4 1 5 3 1-2 3-3 5-3 4 0 6 4 5 7-2 4-10 9-10 9z" />
      <path className="h2" d="M120 290s-7-4-8-8c-1-3 1-6 4-6 2 0 3 1 4 3 1-2 2-3 4-3 3 0 5 3 4 6-1 4-8 8-8 8z" />
    </svg>
  );
}

function IntroDecoRight() {
  return (
    <svg className="intro-deco intro-deco-right" viewBox="0 0 200 320" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M100 112v136" />
        <path d="M62 172h76" />
        <path d="M44 236h112" />
        <path d="M76 172a12 12 0 0 1 24 0M108 172a10 10 0 0 1 20 0" />
        <path d="M56 236a12 12 0 0 1 24 0M86 236a14 14 0 0 1 28 0M120 236a12 12 0 0 1 24 0" />
        <path d="M80 252h40" />
        <path d="M44 70c8 14 8 30 0 44" opacity=".35" />
        <path d="M140 52c14 6 28 6 42 0" opacity=".35" />
      </g>
      <circle className="h1" cx="100" cy="106" r="6" />
      <path className="h2" d="M60 128s-10-6-12-11c-2-4 1-9 6-9 3 0 5 2 6 4 1-2 3-4 6-4 5 0 8 5 6 9-2 5-12 11-12 11z" />
      <path className="h3" d="M160 92s-8-5-10-9c-1-3 1-7 5-7 2 0 4 1 5 3 1-2 3-3 5-3 4 0 6 4 5 7-2 4-10 9-10 9z" />
      <path className="h1" d="M150 296s-9-5-11-10c-2-4 1-8 5-8 3 0 5 2 6 4 1-2 3-4 6-4 4 0 7 4 5 8-2 5-11 10-11 10z" />
    </svg>
  );
}

function Intro() {
  return (
    <section className="section intro-section">
      <IntroDecoLeft />
      <IntroDecoRight />
      <div className="container intro-welcome">
        <p className="intro-hearts" aria-hidden="true"><span>♥</span><span>♥</span><span>♥</span></p>
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
            <h2>Wat we <span className="em">graag doen.</span></h2>
          </div>
        </div>

        {window.OFFERINGS.map((o) => (
          <div key={o.id} className={"offer-row" + (o.layout === "right" ? " reverse" : "")}>
            <div className="o-media">
              <img src={o.image} alt={o.alt} />
            </div>
            <div className="o-text">
              <span className="o-kicker" aria-hidden="true"><Heart /></span>
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
          <h2>Kom je <span className="em">bij ons werken?</span></h2>
          <p>
            We zoeken horeca-toppers met ervaring die het leuk vinden om gasten in de watten
            te leggen. Keuken, bediening, of een echte alleskunner, laat van je horen.
          </p>
          <div className="vac-cta">
            <a className="nav-cta" href={`mailto:${window.BRAND.email}?subject=Sollicitatie`}>
              Solliciteer nu <IconArrow />
            </a>
            <span className="vac-mail">Of stuur je cv naar <a href={`mailto:${window.BRAND.email}?subject=Sollicitatie`}>{window.BRAND.email}</a></span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Een greep uit de echte lunchkaart (src/menus.jsx), zodat de prijzen altijd kloppen.
const TEASER_DISHES = [
  ["Belegde broodjes", "Carpaccio"],
  ["Warme lunch specialiteiten", "Hete kip"],
  ["Sandwiches (3-laags)", "Healthy sandwich"],
  ["Salades", "Salade Zus & Zo"],
  ["Soepen en specials", "Tomatensoep"],
];

function MenuTeaser({ go }) {
  const dishes = TEASER_DISHES
    .map(([cat, name]) => {
      const sec = (window.LUNCHKAART || []).find((x) => x.title === cat);
      return sec && sec.items.find((it) => it.name === name);
    })
    .filter(Boolean);
  if (!dishes.length) return null;
  return (
    <section className="menu-teaser section">
      <div className="container menu-teaser-grid">
        <div className="menu-teaser-text">
          <h2>Een greep uit <span className="em">de lunchkaart.</span></h2>
          <p>Belegde broodjes, sandwiches, salades en warme lunch. Ook met een lactosevrije en glutenvrije kaart.</p>
          <a className="read-link" href="#lunch" onClick={(e) => { e.preventDefault(); go("lunch"); }}>
            Bekijk de hele kaart <IconArrow />
          </a>
        </div>
        <div className="menu-teaser-list">
          {dishes.map((d) => <window.Dish key={d.name} item={d} />)}
        </div>
      </div>
    </section>
  );
}

function AlsoBand({ go, openReserve }) {
  return (
    <section className="also-band">
      <div className="container also-grid">
        <div className="also-item">
          <span className="also-kicker">Vrijdagavond</span>
          <h2>Diner bij Zus &amp; Zo.</h2>
          <p>Iedere vrijdagavond ben je welkom voor een gezellige avond uit. Kies voor ons 3-gangenmenu of een hoofdgerecht van de dinerkaart.</p>
          <div className="also-actions">
            <button className="nav-cta" onClick={() => openReserve("diner")}>Reserveer vrijdag <IconArrow /></button>
            <a className="read-link" href="#diner" onClick={(e) => { e.preventDefault(); go("diner"); }}>Bekijk de dinerkaart <IconArrow /></a>
          </div>
        </div>
        <div className="also-item">
          <span className="also-kicker">Op kantoor</span>
          <h2>Lunch op de werkvloer.</h2>
          <p>Voor bedrijven in Etten-Leur bezorgen we lunch, vergaderpakketten en hapjes. Van maandag t/m zaterdag.</p>
          <div className="also-actions">
            <a className="read-link" href="#bezorging" onClick={(e) => { e.preventDefault(); go("bezorging"); }}>Bekijk de bezorgkaart <IconArrow /></a>
          </div>
        </div>
      </div>
    </section>
  );
}

// Google-reviews: score en reviews komen live van Google via de Edge Function.
// Is er (nog) niets, dan staat dit blok er gewoon niet.
function Stars({ value, size = 16 }) {
  return (
    <span className="g-stars" role="img" aria-label={`${String(value).replace(".", ",")} van 5 sterren`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
            <defs><clipPath id={`st-${size}-${i}-${Math.round(fill * 100)}`}><rect x="0" y="0" width={24 * fill} height="24" /></clipPath></defs>
            <path className="g-star-bg" d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z" />
            <path className="g-star-fg" clipPath={`url(#st-${size}-${i}-${Math.round(fill * 100)})`} d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z" />
          </svg>
        );
      })}
    </span>
  );
}

function GoogleReviews() {
  const [g, setG] = React.useState(() => {
    try { const c = JSON.parse(sessionStorage.getItem("zz-reviews") || "null"); return c && c.ok ? c : null; } catch (e) { return null; }
  });
  React.useEffect(() => {
    if (g || !window.ReserveApi || !window.ReserveApi.configured) return;
    window.ReserveApi.call("reviews", {}).then((r) => {
      if (r && r.ok && typeof r.rating === "number") {
        setG(r);
        try { sessionStorage.setItem("zz-reviews", JSON.stringify(r)); } catch (e) { /* privévenster */ }
      }
    });
  }, []);
  if (!g) return null;
  const shown = [...(g.reviews || [])]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  const score = g.rating.toFixed(1).replace(".", ",");
  return (
    <section className="g-reviews section" aria-labelledby="g-reviews-title">
      <div className="container g-grid">
        <div className="g-summary">
          <h2 id="g-reviews-title">Dit zeggen <span className="em">onze gasten.</span></h2>
          <div className="g-score">
            <span className="g-score-num">{score}</span>
            <span className="g-score-meta">
              <Stars value={g.rating} size={22} />
              <span>op Google, {g.count.toLocaleString("nl-NL")} reviews</span>
            </span>
          </div>
          <div className="g-actions">
            {g.url && <a className="read-link" href={g.url} target="_blank" rel="noopener">Alle reviews op Google <IconArrow /></a>}
            {g.writeUrl && <a className="read-link" href={g.writeUrl} target="_blank" rel="noopener">Schrijf een review <IconArrow /></a>}
          </div>
        </div>
        {shown.length > 0 && (
          <div className="g-cards">
            {shown.map((r, i) => (
              <figure className="g-card" key={i}>
                <Stars value={r.rating} size={15} />
                <blockquote>{r.text}</blockquote>
                <figcaption>
                  <strong>{r.author}</strong>
                  <span>{r.when ? r.when + " · " : ""}Google</span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HoursAndImpression() {
  return (
    <section className="hours-section">
      <div className="container hours-grid hours-grid-photo">
        <figure className="hours-photo">
          <img src="assets/Schermafbeelding 2026-05-22 162823.png" alt="Het team van Zus & Zo voor de zaak aan het Raadhuisplein" loading="lazy" />
        </figure>
        <div className="hours-info">
        <div className="hours-text">
          <h2>Openingstijden</h2>
          <p>Loop gerust binnen. Een tafel reserveren is fijn, maar niet verplicht.</p>
          <div className="visit">
            <p className="visit-address">
              <strong>{window.BRAND.address}</strong><br/>
              {window.BRAND.postcode}<br/>
              Tegenover het stadskantoor
            </p>
            <p className="visit-links">
              <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>
              <a href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Lunchcafé Zus & Zo, " + window.BRAND.address + ", " + window.BRAND.postcode)} target="_blank" rel="noopener">
                Route plannen <IconArrow />
              </a>
            </p>
          </div>
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
      </div>
    </section>
  );
}

function PageHome({ go, openReserve }) {
  return (
    <main>
      <Hero go={go} openReserve={openReserve} />
      <Intro />
      <MenuTeaser go={go} />
      <Offerings go={go} />
      <AlsoBand go={go} openReserve={openReserve} />
      <GoogleReviews />
      <HoursAndImpression />
      <InstaFeed />
      <Vacature go={go} />
    </main>
  );
}

Object.assign(window, { PageHome, PagePlaceholder });
