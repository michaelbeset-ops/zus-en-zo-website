/* global window, React */
// =============================================================
// LUNCH & MENUKAART page
// =============================================================

function Dish({ item }) {
  return (
    <div className="dish">
      <div className="dish-head">
        <span className="name">
          {item.name}
          {item.extra && <span className="extra">{item.extra}</span>}
        </span>
        <span className="dots" />
        <span className="price">€ {item.price}</span>
      </div>
      {item.desc && <p className="desc">{item.desc}</p>}
    </div>
  );
}

function MenuSection({ num, eyebrow, title, titleEm, intro, items, columns = 2, after }) {
  return (
    <section className="menu-section">
      <div className="container">
        <div className="menu-section-head">
          <div>
            <span className="eyebrow"><span className="num">{num}</span>{eyebrow}</span>
            <h2>{title} <span className="em">{titleEm}</span></h2>
          </div>
          {intro && <p>{intro}</p>}
        </div>
        <div className={"menu-cols" + (columns === 3 ? " three" : "")}>
          {items.map((it, i) => <Dish key={it.name + i} item={it} />)}
        </div>
        {after}
      </div>
    </section>
  );
}

function PageLunch({ openReserve }) {
  return (
    <main className="menu-page">
      <window.PageHero
        image="assets/gastvrouw-tray.png"
        alt="Gastvrouw met blad lunchgerechten in de zaak"
        tint="warm"
        eyebrow="Pagina 02 · Lunch & Menukaart"
        number="№ 02"
        titleNode={
          <React.Fragment>
            De <span className="it">lunchkaart,</span><br/>
            en alles eromheen.
          </React.Fragment>
        }
        lede="Belegde broodjes, sandwiches, salades en flatbreads, alles met dagverse rauwkost. Vraag in de zaak naar de glutenvrije of lactosevrije kaart."
        tag={{ n: "№ 02", text: "Karin met een blad, een doordeweekse middag" }}
      >
        <div className="page-hero-cta-row">
          <button className="nav-cta" onClick={openReserve} style={{ padding: "14px 22px", fontSize: 14 }}>
            Reserveer een tafel <IconArrow />
          </button>
        </div>
      </window.PageHero>

      <MenuSection
        num="2.1"
        eyebrow="Belegde broodjes"
        title="Belegde"
        titleEm="broodjes."
        intro={window.BELEGDE_BROODJES.intro}
        items={window.BELEGDE_BROODJES.items}
        columns={2}
      />

      <MenuSection
        num="2.2"
        eyebrow="Sandwiches 3-laags"
        title="Sandwiches,"
        titleEm="drie hoog."
        intro={window.SANDWICHES.intro}
        items={window.SANDWICHES.items}
        columns={2}
      />

      <MenuSection
        num="2.3"
        eyebrow="Salades"
        title="Salades"
        titleEm="met rauwkost & brood."
        intro={window.SALADES.intro}
        items={window.SALADES.items}
        columns={2}
      />

      <MenuSection
        num="2.4"
        eyebrow="Flatbread"
        title="Flatbread,"
        titleEm="warm en fris."
        intro={window.FLATBREAD.intro}
        items={window.FLATBREAD.items}
        columns={2}
        after={
          <div style={{ marginTop: 40, display: "grid", gap: 24, gridTemplateColumns: "1fr" }}>
            <div className="pickup-card">
              <h4>Lunch afhalen</h4>
              <p>
                Bestellen vóór 11:00 uur <strong>(zelfde dag)</strong> per mail:{" "}
                <a href={`mailto:${window.BRAND.emailOrder}`}>{window.BRAND.emailOrder}</a><br/>
                of telefonisch: <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>
              </p>
              <p style={{ marginTop: 8 }}>
                <strong>Bestellingen worden ALLEEN afgehaald.</strong> Afhalen kan tussen
                11:00 – 15:00u. Graag datum en tijd van afhalen vermelden.
              </p>
            </div>
          </div>
        }
      />

      {/* Sap section, small */}
      <section className="menu-section" style={{ paddingTop: 24 }}>
        <div className="container">
          <div className="menu-section-head">
            <div>
              <span className="eyebrow"><span className="num">2.5</span>Verse sap</span>
              <h2>Vers <span className="em">geperst.</span></h2>
            </div>
          </div>
          <div className="menu-cols">
            {window.SAP.items.map((it, i) => <Dish key={i} item={it} />)}
          </div>

          <div className="diet-note">
            <span className="serif" style={{ fontStyle: "italic", fontSize: 18, color: "var(--aubergine)" }}>i</span>
            <span>
              We hebben ook een <strong>glutenvrije</strong> en <strong>lactosevrije</strong> kaart,               vraag er gerust naar bij de bediening.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { PageLunch, Dish, MenuSection });
