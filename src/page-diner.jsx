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
        eyebrow="Pagina 04 · Vrijdagavond & Feesten"
        number="№ 04"
        titleNode={
          <React.Fragment>
            Op vrijdagavond<br/>
            <span className="amp">trekken we alles uit de kast.</span>
          </React.Fragment>
        }
        lede="Eén avond per week schakelen we 's avonds door. Een echte dinerkaart, een 3-gangen keuze­menu, en onze High Bites om te delen."
      >
        <div className="page-hero-cta-row">
          <button className="nav-cta" onClick={openReserve} style={{ padding: "14px 22px", fontSize: 14 }}>
            Reserveer vrijdag <IconArrow />
          </button>
        </div>
      </window.PageHero>

      <MenuSection
        num="4.1"
        eyebrow="Voorgerechten"
        title="Beginnen"
        titleEm="met iets kleins."
        items={window.VOORGERECHTEN}
        columns={2}
      />

      <MenuSection
        num="4.2"
        eyebrow="Hoofdgerechten"
        title="En dan,"
        titleEm="de hoofdrol."
        items={window.HOOFDGERECHTEN}
        columns={2}
      />

      {/* High Bites + 3-gangen keuze menu, two callouts side-by-side */}
      <section className="menu-section">
        <div className="container">
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }} className="duo-callout">
            <div className="callout-card" style={{ background: "var(--cream-2)", borderColor: "var(--gold)" }}>
              <span className="eyebrow">High Bites · om te delen</span>
              <h3 style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
                <span>High Bites</span>
                <span className="price-big">€ 24,95 p.p.</span>
              </h3>
              <p>
                <em>Een beetje van Zus &amp; een beetje van Zo.</em> We serveren 3 rondes met
                heerlijke hartige hapjes. Mix van vlees, vis en vegetarisch. Lekker samen
                genieten onder het genot van een hapje en een drankje.
              </p>
            </div>
            <div className="callout-card">
              <span className="eyebrow" style={{ color: "var(--aubergine)" }}>3 gangen keuzemenu</span>
              <h3 style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap" }}>
                <span>Terug van weg geweest</span>
                <span className="price-big">€ 32,95</span>
              </h3>
              <p>
                Ons 3-gangenmenu! Ga je voor onze klassiekers zoals carpaccio en saté? Of kies
                je voor de heerlijke burger?! Je kunt kiezen uit onze gerechten én hooggerechten.
                Je sluit het menu af met een <strong>dessert van de chef.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      <MenuSection
        num="4.3"
        eyebrow="Hooggerechten"
        title="Of een"
        titleEm="hooggerecht."
        items={window.HOOG_GERECHTEN}
        columns={2}
      />

      {/* FEESTEN & BEDRIJFSBEZORGING */}
      <section className="feesten">
        <div className="container">
          <span className="eyebrow"><span className="num">№ 4.4</span>Feesten · bedrijven · op afspraak</span>
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
                <li><span className="b">a</span> Warm of koud buffet, op maat samengesteld</li>
                <li><span className="b">b</span> Brabantse koffietafel met broodjes & soep</li>
                <li><span className="b">c</span> Geluidsinstallatie & DJ op aanvraag</li>
                <li><span className="b">d</span> Vanaf 15 personen, kleinere groep? ook ok.</li>
              </ul>
              <a className="read-link" href={`mailto:${window.BRAND.email}?subject=Aanvraag besloten feest`} style={{ marginTop: 8 }}>
                Doe een aanvraag <IconArrow />
              </a>
            </div>

            <div className="f-card dark">
              <span className="f-card-eyebrow">Bedrijfsbezorging</span>
              <h3>Voor bedrijven in <span className="em" style={{ color: "var(--gold-soft)" }}>Etten-Leur.</span></h3>
              <p>Ma t/m vr bezorgen we lunch en vergaderpakketten, bij jullie op kantoor, op tijd.</p>
              <ul>
                <li><span className="b">a</span> Belegde broodjes per persoon</li>
                <li><span className="b">b</span> Vergaderpakketten met soep, fruit, koffie</li>
                <li><span className="b">c</span> Bestellen vóór 11:00 uur, dezelfde dag mogelijk</li>
                <li><span className="b">d</span> Ook voor borrels &amp; high-tea aan kantoor</li>
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
