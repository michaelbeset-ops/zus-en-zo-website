/* global window, React */
// =============================================================
// BEZORGINGEN page: bedrijfsbezorging + afhaal-/bezorgkaart
// =============================================================

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: "smooth" });
}

function PageBezorging() {
  const B = window.BRAND;
  const orderMail = `mailto:${B.emailOrder}?subject=Bestelling`;
  return (
    <main className="menu-page">
      <window.PageHero
        image="assets/Schermafbeelding 2026-05-22 162916.png"
        alt="Het team van Zus & Zo met de bezorgfiets"
        titleNode={
          <React.Fragment>
            Zus &amp; Zo<br/>
            <span className="it">op de werkvloer.</span>
          </React.Fragment>
        }
        lede="Voor bedrijven in Etten-Leur bezorgen we lunch, vergaderpakketten en hapjes."
      >
        <div className="page-hero-cta-row">
          <a className="nav-cta" href={orderMail} style={{ padding: "14px 22px", fontSize: 14 }}>
            Bestellen <IconArrow />
          </a>
        </div>
        <div className="pickup-badge">
          <strong>Particulier bestellen?</strong>
          <span>Bel ons, dan maken we het voor je klaar en kun je het zelf komen ophalen.</span>
          <a href={B.phoneHref} className="pickup-badge-phone">{B.phone}</a>
          <a href="#afhaalkaart" className="pickup-badge-link" onClick={(e) => { e.preventDefault(); scrollToId("afhaalkaart"); }}>
            Bekijk de afhaalkaart <IconArrow />
          </a>
        </div>
      </window.PageHero>

      <section className="feesten">
        <div className="container">
          <div className="feesten-cards">
            <div className="f-card dark">
              <span className="f-card-eyebrow">Bedrijfsbezorging</span>
              <h3>Voor bedrijven in Etten-Leur.</h3>
              <p>Van maandag t/m zaterdag bezorgen we lunch, vergaderpakketten en hapjes bij jullie op kantoor.</p>
              <ul>
                <li>Belegde broodjes per persoon</li>
                <li>Vergaderpakketten met soep, fruit en broodjes</li>
                <li>Bestellen vóór 10:30 uur, rond 12:00 uur bezorgd</li>
                <li>Vanaf € 35,- bezorgen we gratis</li>
              </ul>
              <a className="read-link" href={orderMail}
                 style={{ marginTop: 8, color: "var(--paper)", borderColor: "rgba(255,255,255,0.4)" }}>
                Bestellen <IconArrow />
              </a>
            </div>

            <div className="f-card">
              <span className="f-card-eyebrow">Op maat</span>
              <h3>Even overleggen?</h3>
              <p>
                Iedere gelegenheid is anders! We denken graag met jullie mee over de mogelijkheden
                en stellen samen een aanbod samen dat helemaal aansluit bij jullie wensen. Of het nu
                gaat om een lunch, een vergadering of een borrel: we maken er graag iets lekkers van.
              </p>
              <p>
                Mail <a href={orderMail} style={{ color: "var(--aubergine)", fontWeight: 600 }}>{B.emailOrder}</a>
                {" "}of bel <a href={B.phoneHref} style={{ color: "var(--aubergine)", fontWeight: 600 }}>{B.phone}</a>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="menu-section" id="afhaalkaart">
        <div className="container">
          <div className="menu-section-head">
            <div>
              <h2>Afhaal- en bezorgkaart</h2>
            </div>
            <p>Geen zin in een compleet pakket? Bekijk onze afhaalkaart en kies jouw favoriete gerecht!</p>
          </div>

          <div className="order-info">
            <div><strong>Bestellen vóór 10:30 uur</strong> via <a href={orderMail}>{B.emailOrder}</a> of <a href={B.phoneHref}>{B.phone}</a>.</div>
            <div>Bezorging rond 12:00 uur, alleen in Etten-Leur. Vanaf € 35,- gratis.</div>
            <div>Afhalen is ook mogelijk. Voor plastic verpakkingsmateriaal rekenen we een verplichte toeslag.</div>
          </div>

          <window.MenuCards
            cards={[
              { id: "afhaal", title: "Lunchgerechten", sub: "Broodjes, salades, sandwiches en warme lunch", sections: window.BEZORGKAART },
              { id: "vergader", title: "Vergaderpakketten en schalen", sub: "Pakketten, broodjes op schaal, drinken en high tea to go", sections: window.VERGADERPAKKETTEN },
            ]}
          />
          <p className="allergy-note">
            Ook een compleet verzorgde lunch of borrel op maat is mogelijk, neem gerust contact met ons op.
            Prijzen onder voorbehoud van typfouten; de prijs in de kassa is leidend.
          </p>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { PageBezorging });
