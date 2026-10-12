/* global window, React */
// =============================================================
// BEZORGINGEN page
// Tijdelijk gevuld met de bestaande tekst over bedrijfsbezorging
// (zie ook page-diner.jsx); de definitieve tekst volgt van het café.
// =============================================================

function PageBezorging() {
  const B = window.BRAND;
  return (
    <main>
      <window.PageHero
        placeholder
        tint="daylight"
        eyebrow="Bezorgingen"
        titleNode={
          <React.Fragment>
            Lunch op kantoor,<br/>
            <span className="it">op tijd bezorgd.</span>
          </React.Fragment>
        }
        lede="Voor bedrijven in Etten-Leur bezorgen we doordeweeks lunch en vergaderpakketten."
      >
        <div className="page-hero-cta-row">
          <a className="nav-cta" href={`mailto:${B.emailOrder}?subject=Bedrijfsbezorging`} style={{ padding: "14px 22px", fontSize: 14 }}>
            Vraag een offerte <IconArrow />
          </a>
        </div>
      </window.PageHero>

      <section className="feesten">
        <div className="container">
          <div className="feesten-cards">
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
              <a className="read-link" href={`mailto:${B.emailOrder}?subject=Bedrijfsbezorging`}
                 style={{ marginTop: 8, color: "var(--paper)", borderColor: "rgba(255,255,255,0.4)" }}>
                Vraag een offerte <IconArrow />
              </a>
            </div>

            <div className="f-card">
              <span className="f-card-eyebrow">Bestellen</span>
              <h3>Even <span className="em">overleggen?</span></h3>
              <p>
                Vertel ons wat je wilt en met hoeveel jullie zijn, dan zien we wel wat past.
              </p>
              <p>
                Mail <a href={`mailto:${B.emailOrder}`} style={{ color: "var(--aubergine)", fontWeight: 600 }}>{B.emailOrder}</a>
                {" "}of bel <a href={B.phoneHref} style={{ color: "var(--aubergine)", fontWeight: 600 }}>{B.phone}</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { PageBezorging });
