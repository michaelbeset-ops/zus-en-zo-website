/* global window, React */
// =============================================================
// DINER & FEESTEN page
// =============================================================

function PageDiner({ openReserve }) {
  return (
    <main className="menu-page">
      <window.PageHero
        image="assets/Gemini_Generated_Image_eij9mzeij9mzeij9.png"
        alt="Sfeervol dinerinterieur met paarse bankjes, wijnrekken en kaarsen"
        tint="evening"
        titleNode={
          <React.Fragment>
            Vrijdagavond genieten<br/>
            <span className="it">bij Zus &amp; Zo.</span>
          </React.Fragment>
        }
        lede="Iedere vrijdagavond ben je welkom voor een gezellige avond uit. Kies voor ons 3-gangenmenu of kies lekker een hoofdgerecht van onze dinerkaart."
      >
        <div className="page-hero-cta-row">
          <button className="nav-cta" onClick={() => openReserve("diner")} style={{ padding: "14px 22px", fontSize: 14 }}>
            Reserveer vrijdag <IconArrow />
          </button>
        </div>
      </window.PageHero>

      {/* De twee specials bovenaan, voor de kaart */}
      <section className="diner-specials">
        <div className="container">
          <div className="special-grid">
            <div className="special-card main">
              <span className="special-kicker">3-gangen keuzemenu</span>
              <h2>Terug van weg geweest</h2>
              <div className="special-price">€ 32,95</div>
              <p>
                Ons 3-gangenmenu! Ga je voor onze klassiekers zoals carpaccio en saté? Of kies je
                voor de gyoza's en een heerlijke burger? Je kiest uit onze voorgerechten en
                hoofdgerechten, en sluit het menu af met een dessert van de chef.
              </p>
              <button className="nav-cta" onClick={() => openReserve("diner")}>Reserveer vrijdag <IconArrow /></button>
            </div>
            <div className="special-card">
              <span className="special-kicker">Om te delen</span>
              <h2>High Bites</h2>
              <div className="special-price">€ 25,95 <span>p.p.</span></div>
              <p>
                Een beetje van Zus en een beetje van Zo! We serveren 3 rondes met heerlijke hartige
                hapjes: een mix van vlees, vis en vegetarisch. Lekker samen genieten onder het genot
                van een hapje en een drankje.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="menu-section">
        <div className="container">
          <div className="menu-section-head">
            <div>
              <h2>Dinerkaart</h2>
            </div>
            <p>Alleen op vrijdagavond. Heb je een allergie? Meld het ons, er is ook een gluten- en lactosevrije kaart.</p>
          </div>
          <window.MenuBlocks sections={window.DINERKAART} />
          <p className="allergy-note"><abbr className="veg" title="Vegetarisch">V</abbr> = vegetarisch. Prijzen onder voorbehoud van typfouten; de prijs in de kassa is leidend.</p>
        </div>
      </section>

      {/* FEESTEN & BEDRIJFSBEZORGING */}
      <section className="feesten">
        <div className="container">
          <span className="eyebrow">Feesten · bedrijven · op afspraak</span>
          <h2>
            Iets te <span className="em">vieren?</span><br/>
            Of iets te <span className="em">organiseren?</span>
          </h2>
          <p className="lede">
            Of het nu een verjaardag is, een bruiloft, een personeelsuitje of een Brabantse
            koffietafel, bel ons, dan maken we er iets van. Voor bedrijven in Etten-Leur
            bezorgen we doordeweeks lunch en vergaderpakketten.
          </p>

          <div className="feesten-cards">
            <div className="f-card">
              <span className="f-card-eyebrow">Besloten feesten</span>
              <h3>Verjaardag, bruiloft, <span className="em">personeelsuitje.</span></h3>
              <p>De hele zaak voor jullie, of een afgescheiden hoek. We denken graag mee.</p>
              <ul>
                <li>Warm of koud buffet, op maat samengesteld</li>
                <li>Brabantse koffietafel met broodjes & soep</li>
                <li>Geluidsinstallatie & DJ op aanvraag</li>
                <li>Vanaf 15 personen, kleinere groep? ook ok.</li>
              </ul>
              <a className="read-link" href={`mailto:${window.BRAND.email}?subject=Aanvraag besloten feest`} style={{ marginTop: 8 }}>
                Doe een aanvraag <IconArrow />
              </a>
            </div>

            <div className="f-card dark">
              <span className="f-card-eyebrow">Bedrijfsbezorging</span>
              <h3>Voor bedrijven in <span className="em" style={{ color: "var(--gold-soft)" }}>Etten-Leur.</span></h3>
              <p>Van maandag t/m zaterdag bezorgen we lunch, vergaderpakketten en hapjes bij jullie op kantoor.</p>
              <ul>
                <li>Belegde broodjes per persoon</li>
                <li>Vergaderpakketten met soep, fruit en broodjes</li>
                <li>Ook high tea to go</li>
              </ul>
              <a className="read-link" href={`mailto:${window.BRAND.emailOrder}?subject=Bedrijfsbezorging`}
                 style={{ marginTop: 8, color: "var(--paper)", borderColor: "rgba(255,255,255,0.4)" }}>
                Vraag een offerte <IconArrow />
              </a>
            </div>

            <div className="f-card full" style={{ background: "var(--paper)", borderColor: "var(--line)" }}>
              <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr", alignItems: "center" }}>
                <div>
                  <span className="f-card-eyebrow">Bel ons gewoon</span>
                  <h3 style={{ marginBottom: 8 }}>Even <span className="em">overleggen?</span></h3>
                  <p style={{ margin: 0 }}>
                    Vertel ons wat je wilt en met hoeveel jullie zijn, dan zien we wel wat past.
                    <br/>
                    <a href={window.BRAND.phoneHref} style={{ color: "var(--aubergine)", fontWeight: 600, borderBottom: "1px solid var(--aubergine-soft)" }}>
                      {window.BRAND.phone}
                    </a>
                    {" "}of{" "}
                    <a href={`mailto:${window.BRAND.email}`} style={{ color: "var(--aubergine)", fontWeight: 600, borderBottom: "1px solid var(--aubergine-soft)" }}>
                      {window.BRAND.email}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { PageDiner });
