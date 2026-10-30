/* global window, React */
// =============================================================
// LUNCH page + gedeelde menu-onderdelen (ook gebruikt door
// High Moments, Bezorgingen en Diner)
// =============================================================
const { useState: useStateM } = React;

function fmtPrice(p) {
  const s = String(p).trim();
  if (s.startsWith("+")) return "+ € " + s.slice(1).trim();
  if (s.startsWith("vanaf")) return "vanaf € " + s.slice(5).trim();
  return "€ " + s;
}

function Dish({ item }) {
  return (
    <div className="dish">
      <div className="dish-head">
        <span className="name">
          {item.name}
          {item.veg && <abbr className="veg" title="Vegetarisch">V</abbr>}
          {item.extra && <span className="extra">{item.extra}</span>}
        </span>
        <span className="dots" />
        <span className="price">{fmtPrice(item.price)}</span>
      </div>
      {item.desc && <p className="desc">{item.desc}</p>}
    </div>
  );
}

// Kaart als reeks blokjes (Belegde broodjes, Salades, ...)
function MenuBlocks({ sections }) {
  return (
    <div className="menu-blocks">
      {sections.map((sec) => (
        <div className="menu-block" key={sec.title}>
          <h3 className="menu-block-title">{sec.title}</h3>
          {sec.intro && <p className="menu-block-intro">{sec.intro}</p>}
          {sec.items.map((it, i) => <Dish key={it.name + i} item={it} />)}
        </div>
      ))}
    </div>
  );
}

// Uitklapbare kaarten: alleen de kaart waarop je klikt gaat open.
function MenuCards({ cards, defaultOpen = null }) {
  const [open, setOpen] = useStateM(defaultOpen);
  return (
    <div className="menu-cards">
      {cards.map((c) => {
        const isOpen = open === c.id;
        return (
          <div className={"menu-card" + (isOpen ? " open" : "")} key={c.id} id={"kaart-" + c.id}>
            <button
              type="button"
              className="menu-card-head"
              aria-expanded={isOpen}
              aria-controls={"kaart-" + c.id + "-inhoud"}
              onClick={() => setOpen(isOpen ? null : c.id)}
            >
              <span>
                <span className="menu-card-title">{c.title}</span>
                {c.sub && <span className="menu-card-sub">{c.sub}</span>}
              </span>
              <span className="menu-card-toggle" aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && (
              <div className="menu-card-body" id={"kaart-" + c.id + "-inhoud"}>
                {c.sections ? <MenuBlocks sections={c.sections} /> : c.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CardComingSoon({ what }) {
  return (
    <p className="menu-card-empty">
      De {what} zetten we hier binnenkort online. Tot die tijd kun je er gewoon naar vragen
      bij de bediening, of bel ons op <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>.
    </p>
  );
}

function PageLunch({ openReserve }) {
  const cards = [
    { id: "lunch", title: "Lunchkaart", sub: "Broodjes, sandwiches, salades, warme lunch en desserts", sections: window.LUNCHKAART },
    { id: "lactosevrij", title: "Lactosevrije kaart", body: <CardComingSoon what="lactosevrije kaart" /> },
    { id: "glutenvrij", title: "Glutenvrije kaart", body: <CardComingSoon what="glutenvrije kaart" /> },
    { id: "borrel", title: "Borrelkaart", body: <CardComingSoon what="borrelkaart" /> },
  ];
  return (
    <main className="menu-page">
      <window.PageHero
        image="assets/gastvrouw-tray.png"
        alt="Gastvrouw met blad lunchgerechten in de zaak"
        tint="warm"
        eyebrow="Lunch"
        titleNode={
          <React.Fragment>
            Ontdek onze<br/>
            <span className="it">lunchkaart.</span>
          </React.Fragment>
        }
        lede="Geniet van heerlijke lunchgerechten, verse ingrediënten en gezelligheid. Bij Zus & Zo smaakt ieder moment."
      >
        <div className="page-hero-cta-row">
          <button className="nav-cta" onClick={() => openReserve("lunch")} style={{ padding: "14px 22px", fontSize: 14 }}>
            Reserveer een tafel <IconArrow />
          </button>
        </div>
      </window.PageHero>

      <section className="menu-section">
        <div className="container">
          <div className="menu-section-head">
            <div>
              <h2>Onze kaarten</h2>
            </div>
            <p>Klik op een kaart om hem te openen.</p>
          </div>
          <MenuCards cards={cards} />
          <p className="allergy-note">
            Heb je een allergie? Meld het ons! <abbr className="veg" title="Vegetarisch">V</abbr> = vegetarisch.
            Prijzen onder voorbehoud van typfouten; de prijs in de kassa is leidend.
          </p>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { PageLunch, Dish, MenuBlocks, MenuCards, fmtPrice });
