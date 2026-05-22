/* global window, React */
// =============================================================
// HIGH TEA page
// =============================================================

function PageHighTea({ openReserve }) {
  return (
    <main className="menu-page">
      <window.PageHero
        placeholder
        tint="tea"
        eyebrow="Pagina 03 · High Tea"
        number="№ 03"
        titleNode={
          <React.Fragment>
            Een middag<br/>
            <span className="it">plat genieten.</span>
          </React.Fragment>
        }
        lede="Een uitgebreide 3-gangen high tea met zoete én hartige lekkernijen, op een echte etagère, met zoveel thee als je aankunt."
        tag={{ n: "PLACEHOLDER", text: "Etagère met scones, sandwiches en thee" }}
      >
        <div className="page-hero-cta-row">
          <button className="nav-cta" onClick={openReserve} style={{ padding: "14px 22px", fontSize: 14 }}>
            Reserveer high tea <IconArrow />
          </button>
        </div>
      </window.PageHero>

      <section style={{ padding: "32px 0" }}>
        <div className="container">
          <div className="ht-hero">
            <div className="image-stack">
              <div className="img-a">
                <window.PagePlaceholder label="Etagère met zoet, hartig, thee" icon="✦" />
              </div>
              <div className="img-b" style={{ boxShadow: "0 30px 60px -20px rgba(75,50,80,0.4)" }}>
                <window.PagePlaceholder label="Detail · scone met jam" icon="·" />
              </div>
            </div>
            <div>
              <span className="eyebrow"><span className="num">3.1</span>Wat we serveren</span>
              <h2 className="serif" style={{ fontSize: "clamp(34px, 5vw, 56px)", margin: "16px 0 16px", lineHeight: 1.02, letterSpacing: "-0.015em" }}>
                Hartig, <span style={{ fontStyle: "italic", color: "var(--aubergine)" }}>zoet,</span><br/>
                en nóg een rondje thee.
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink-soft)", margin: 0, maxWidth: "52ch" }}>
                We werken in 3 gangen. Per gang een nieuwe etagère met seizoenslekkers,                 verse scones met clotted cream, mini-quiches, gerookte zalm op brood, eigen
                gebakken zoetigheid en altijd een rondje vlaai. Daarnaast onbeperkt thee uit
                onze theekaart.
              </p>

              <div className="price-block">
                <div>
                  <div className="label">Onze high tea</div>
                  <div style={{ display: "flex", alignItems: "baseline", marginTop: 6 }}>
                    <div className="amount">€ 27,50</div>
                    <div className="pp">p.p.</div>
                  </div>
                </div>
                <button className="nav-cta" onClick={openReserve}>Reserveer →</button>
              </div>

              <div className="timeline">
                <div className="timeline-item">
                  <div className="num">i</div>
                  <div>
                    <h4>Gang één, hartig</h4>
                    <p>Mini-quiches, sandwiches, soepje, gerookte zalm op een toastje.</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="num">ii</div>
                  <div>
                    <h4>Gang twee, vers gebakken</h4>
                    <p>Scones uit de oven met clotted cream, jam en stroopwafelkaramel.</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="num">iii</div>
                  <div>
                    <h4>Gang drie, zoet</h4>
                    <p>Vlaai van de week, brownie, macarons en kleine zoetigheden.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="diet-note" style={{ marginTop: 32 }}>
            <span className="serif" style={{ fontStyle: "italic", fontSize: 18, color: "var(--aubergine)" }}>i</span>
            <span>
              <strong>Reserveren minimaal 24 uur van tevoren.</strong> Glutenvrij of lactosevrij?
              Laat het bij de reservering weten, we passen 'm aan.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { PageHighTea });
