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
function MenuCards({ cards }) {
  const [open, setOpen] = useStateM(cards[0] && cards[0].id);
  const cur = cards.find((c) => c.id === open) || cards[0];
  const onKey = (e, i) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = cards[(i + d + cards.length) % cards.length];
    setOpen(next.id);
    const el = document.getElementById("kaart-tab-" + next.id);
    if (el) el.focus();
  };
  return (
    <div className="menu-tabs">
      <div className="menu-tabs-bar" role="tablist" aria-label="Kaarten">
        {cards.map((c, i) => {
          const on = c.id === cur.id;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              id={"kaart-tab-" + c.id}
              className={"menu-tab" + (on ? " on" : "")}
              aria-selected={on}
              aria-controls={"kaart-" + c.id + "-inhoud"}
              tabIndex={on ? 0 : -1}
              onClick={() => setOpen(c.id)}
              onKeyDown={(e) => onKey(e, i)}
            >
              {c.title}
            </button>
          );
        })}
      </div>
      <div className="menu-tabs-panel" role="tabpanel" id={"kaart-" + cur.id + "-inhoud"} aria-labelledby={"kaart-tab-" + cur.id}>
        {cur.sub && <p className="menu-card-sub">{cur.sub}</p>}
        {cur.sections ? <MenuBlocks sections={cur.sections} /> : cur.body}
      </div>
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
            <p>Kies bovenaan welke kaart je wilt zien.</p>
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
