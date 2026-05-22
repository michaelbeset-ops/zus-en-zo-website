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

function Hero({ go, openReserve }) {
  return (
    <React.Fragment>
      <window.PageHero
        image="assets/interieur.jpg"
        alt="Interieur Zus & Zo met paarse luchter, houten bar en bloemen"
        number="№ 01"
        titleNode={
          <React.Fragment>
            Genieten <span className="it">van eten,</span><br/>
            drinken, <span className="amp">&amp;</span><br/>
            gezelligheid.
          </React.Fragment>
        }
        lede="Een gezellige lunchgelegenheid tegenover het stadskantoor. Loop binnen voor een broodje, blijf voor de high tea, en kom op vrijdagavond terug, dan trekken we alles uit de kast."
        tag={{ n: "№ 01", text: "'s Ochtends, voor de eerste koffie" }}
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

      <div className="detail-strip">
        <span>Lunch</span><span className="sep">·</span>
        <span>High Tea</span><span className="sep">·</span>
        <span>Vrijdagavond Diner</span><span className="sep">·</span>
        <span>Feesten</span><span className="sep">·</span>
        <span>Bedrijfsbezorging</span>
      </div>
    </React.Fragment>
  );
}

function Intro() {
  return (
    <section className="section">
      <div className="container intro-grid">
        <div className="intro-eyebrow-stack">
          <span className="eyebrow"><span className="num">№ 02</span>Even voorstellen</span>
          <h2>
            Een huiselijke lunchzaak<br/>
            <span className="em">aan het plein,</span> al jaren.
          </h2>
        </div>
        <div>
          <p>
            Aan het Raadhuisplein, tegenover het stadskantoor. Kom binnen voor een broodje,
            blijf voor de koffie. Op vrijdagavond trekken we alles uit de kast.
          </p>
          <p className="signature">Met liefs, het team van Zus &amp; Zo</p>
        </div>
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
            <h2>Wat we <span className="em">graag doen.</span></h2>
          </div>
          <p>
            Vier dingen waar we trots op zijn, elke met een eigen ritme en
            een eigen menukaart. Klik door voor de details.
          </p>
        </div>

        {window.OFFERINGS.map((o, i) => {
          const isDark = o.dark;
          const Body = (
            <React.Fragment>
              <div className={"offer-row" + (o.layout === "right" ? " reverse" : "") + (i === window.OFFERINGS.length - 1 ? "" : "")}>
                <div className="o-media">
                  {o.id === "lunch" ? (
                    <img src="assets/gastvrouw-tray.png" alt="Gastvrouw met blad lunchgerechten" />
                  ) : o.id === "hightea" ? (
                    <img src="assets/terras-proost.png" alt="Bediening proost op het terras met wijn en een sharing board" />
                  ) : o.id === "feesten" ? (
                    <img src="assets/feest-dansvloer.png" alt="Feestzaal met statafels, DJ-opstelling en sfeerverlichting" />
                  ) : (
                    <PagePlaceholder
                      label={
                        o.id === "diner" ? "Vrijdagavond, gedekte tafel" :
                        "Buffet & feestelijke tafel"
                      }
                      dark={isDark}
                    />
                  )}
                  <span className="o-tag">{o.eyebrow}</span>
                </div>
                <div className="o-text">
                  <span className="num">{o.num}</span>
                  <h3>
                    {o.title}<br/>
                    <span className="em">{o.titleEm}.</span>
                  </h3>
                  <div className="meta">
                    {o.meta.map((m, j) => (
                      <React.Fragment key={m}>
                        {j > 0 && <span className="sep">/</span>}
                        <span>{m}</span>
                      </React.Fragment>
                    ))}
                  </div>
                  <p>{o.body}</p>
                  <a
                    className="read-link"
                    href={`#${o.id === "feesten" ? "diner" : o.id}`}
                    onClick={(e) => { e.preventDefault(); go(o.id === "feesten" ? "diner" : o.id); }}
                  >
                    Lees verder <IconArrow />
                  </a>
                </div>
              </div>
            </React.Fragment>
          );

          if (isDark) {
            return (
              <div key={o.id} className="diner-feature">
                <div className="container">{Body}</div>
              </div>
            );
          }
          return <React.Fragment key={o.id}>{Body}</React.Fragment>;
        })}
      </div>
    </section>
  );
}

function PullQuote() {
  return (
    <section className="pull-quote">
      <div className="container">
        <q>
          Er zijn cafés met sterren, en er zijn cafés waar mensen op donderdagmiddag uit
          gewoonte binnenkomen. Wij doen graag het tweede.
        </q>
        <div className="attr"><span className="name">Het team</span> &nbsp;·&nbsp; Raadhuisplein 37
        </div>
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
          <ul className="vac-list">
            <li><span className="n">a.</span> Keukenmedewerk(st)er</li>
            <li><span className="n">b.</span> Zelfstandig werkend gastvrouw/heer</li>
            <li><span className="n">c.</span> Alleskunner, combi keuken/bediening</li>
            <li><span className="n">d.</span> Parttime / fulltime vanaf 21 uur</li>
          </ul>
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
          <h2>Loop <span className="em">gewoon binnen.</span></h2>
          <p>
            Doordeweeks van negen tot vijf voor lunch en koffie. Op vrijdag blijven we 's avonds
            open voor diner, alleen die avond. Tafel reserveren is fijn maar niet verplicht.
          </p>
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
      <PullQuote />
      <InstaFeed />
      <Vacature go={go} />
      <HoursAndImpression />
    </main>
  );
}

Object.assign(window, { PageHome, PagePlaceholder });
