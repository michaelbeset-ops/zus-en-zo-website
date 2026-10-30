/* global window, React */
// =============================================================
// HIGH MOMENTS page: high tea, high bites en high cocktail
// =============================================================

const HIGH_MOMENTS = [
  {
    id: "hightea",
    name: "High tea",
    title: "Een tafel vol thee en lekkers",
    text: "Geniet van een heerlijke high tea in drie gangen, met soep, hartige hapjes en zoete lekkernijen. Inclusief onbeperkt thee van mooie kwaliteit.",
    price: "24,95",
    image: "assets/terras-proost.png",
    alt: "Gasten proosten op het terras van Zus & Zo",
    extra: {
      title: "Een greep uit onze verse thee",
      items: [
        { name: "Fleurige huid", desc: "Thee op basis van kruiden die de huid ondersteunen. Zacht, fris en verrassend." },
        { name: "Lady Grey", desc: "Een melange van earl grey met sinaasappel, citroen en korenbloem." },
        { name: "Liefdevol", desc: "Zacht zoete thee, boordevol bloemen en exotisch fruit." },
      ],
    },
  },
  {
    id: "highbites",
    name: "High bites",
    title: "Borrelen op z'n best!",
    text: "Zin in een gezellige middag vol lekkers? Tijdens onze high bites geniet je van 3 rondes verschillende borrelhapjes. Perfect om samen te delen, te proeven en gezellig bij te kletsen!",
    price: "25,95",
    image: "assets/Schermafbeelding 2026-05-22 162856.png",
    alt: "Etagère met borrelhapjes en cocktails",
  },
  {
    id: "highcocktail",
    name: "High cocktail",
    title: "Cocktails en gezelligheid",
    text: "Zin in een gezellige middag of vrijdagavond? Tijdens onze high cocktail geniet je van verschillende cocktails, gecombineerd met bijpassende hapjes. Laat je verrassen door verschillende smaken en maak er samen een genietmoment van!",
    price: "47,95",
    image: "assets/Schermafbeelding 2026-05-22 162801.png",
    alt: "Cocktails op het terras van Zus & Zo",
  },
];

function PageHighTea({ openReserve }) {
  return (
    <main className="menu-page">
      <window.PageHero
        image="assets/Schermafbeelding 2026-05-22 162856.png"
        alt="High bites en cocktails op het terras van Zus & Zo"
        tint="tea"
        titleNode={
          <React.Fragment>
            Een feestje<br/>
            <span className="it">op tafel.</span>
          </React.Fragment>
        }
        lede="Gezellig samen genieten. Ontdek onze high tea, high bites en high cocktail. Maak van ieder moment een feestje."
      >
        <div className="page-hero-cta-row">
          <button className="nav-cta" onClick={() => openReserve("hightea")} style={{ padding: "14px 22px", fontSize: 14 }}>
            Reserveer High Moments <IconArrow />
          </button>
        </div>
      </window.PageHero>

      <section className="hm-section">
        <div className="container">
          <nav className="hm-jump" aria-label="Naar">
            {HIGH_MOMENTS.map((m) => <a key={m.id} href={"#hm-" + m.id} onClick={(e) => { e.preventDefault(); const el = document.getElementById("hm-" + m.id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" }); }}>{m.name}</a>)}
          </nav>

          {HIGH_MOMENTS.map((m, i) => (
            <article className={"hm-row" + (i % 2 ? " reverse" : "")} key={m.id} id={"hm-" + m.id}>
              <div className="hm-media">
                <img src={m.image} alt={m.alt} loading="lazy" />
              </div>
              <div className="hm-text">
                <span className="hm-kicker">{m.name}</span>
                <h2>{m.title}</h2>
                <p>{m.text}</p>
                <div className="hm-price">
                  <span className="amount">€ {m.price}</span><span className="pp">p.p.</span>
                </div>
                {m.extra && (
                  <div className="hm-extra">
                    <h3>{m.extra.title}</h3>
                    <ul>
                      {m.extra.items.map((t) => (
                        <li key={t.name}><strong>{t.name}</strong> {t.desc}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <button className="nav-cta" onClick={() => openReserve("hightea")}>
                  Reserveer {m.name.toLowerCase()} <IconArrow />
                </button>
              </div>
            </article>
          ))}

          <div className="diet-note">
            <span>
              <strong>Reserveren minimaal 24 uur van tevoren.</strong> Glutenvrij of lactosevrij?
              Laat het bij de reservering weten, dan passen we het aan.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { PageHighTea });
