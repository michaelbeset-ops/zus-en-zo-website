/* global window, React */
// =============================================================
// Chrome: Nav (desktop + mobile drawer) and Footer
// =============================================================
const { useState, useEffect } = React;

function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4">
      <line x1="2" y1="5" x2="16" y2="5" />
      <line x1="2" y1="9" x2="16" y2="9" />
      <line x1="2" y1="13" x2="16" y2="13" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4">
      <line x1="3" y1="3" x2="15" y2="15" />
      <line x1="15" y1="3" x2="3" y2="15" />
    </svg>
  );
}
function IconArrow() {
  return (
    <svg className="arr" width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.4">
      <line x1="0" y1="5" x2="12" y2="5" />
      <polyline points="8,1 12,5 8,9" />
    </svg>
  );
}

function Logo({ onClick }) {
  return (
    <a className="logo" href="#home" onClick={(e) => { e.preventDefault(); onClick && onClick("home"); }} aria-label="Lunchcafé Zus & Zo, naar home">
      <img className="logo-light" src="assets/logo-light.png" alt="Lunchcafé Zus & Zo" />
      <img className="logo-dark" src="assets/logo-transparent.png" alt="Lunchcafé Zus & Zo" />
    </a>
  );
}

function Nav({ page, go, openReserve }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("no-scroll", open);
  }, [open]);
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 64);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <React.Fragment>
      <header className={"nav" + (scrolled ? " scrolled" : "")}>
        <div className="nav-inner">
          <Logo onClick={(p) => { setOpen(false); go(p); }} />
          <nav className="nav-links" aria-label="Hoofdmenu">
            {window.NAV_PAGES.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className={"nav-link" + (page === p.id ? " active" : "")}
                onClick={(e) => { e.preventDefault(); go(p.id); }}
              >
                {p.label}
              </a>
            ))}
            <button className="nav-cta" onClick={openReserve} style={{ marginLeft: 12 }}>
              Reserveer
            </button>
          </nav>
          <button
            className="menu-toggle"
            aria-label="Menu"
            onClick={() => setOpen(true)}
          >
            <IconMenu />
          </button>
        </div>
      </header>

      <aside className={"drawer" + (open ? " open" : "")} aria-hidden={!open}>
        <div className="drawer-top">
          <Logo onClick={(p) => { setOpen(false); go(p); }} />
          <button className="menu-toggle" onClick={() => setOpen(false)} aria-label="Sluit menu">
            <IconClose />
          </button>
        </div>
        <div>
          {window.NAV_PAGES.map((p) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              className={"drawer-link" + (page === p.id ? " active" : "")}
              onClick={(e) => { e.preventDefault(); setOpen(false); go(p.id); }}
            >
              <span className="idx">{p.num}</span> {p.label}
            </a>
          ))}
          <button
            className="nav-cta"
            style={{ marginTop: 32, width: "100%", justifyContent: "center", padding: "18px" }}
            onClick={() => { setOpen(false); openReserve(); }}
          >
            Reserveer een tafel
          </button>
        </div>
        <div className="drawer-foot">
          {window.BRAND.address} · {window.BRAND.phone}
        </div>
      </aside>
    </React.Fragment>
  );
}

function Footer({ go, openReserve }) {
  const B = window.BRAND;
  return (
    <footer className="footer">
      <div className="container">
        <div>
          <img src="assets/logo-light.png" alt="Lunchcafé Zus & Zo" style={{ height: 56, width: "auto", marginBottom: 16 }} />
          <p style={{ maxWidth: 280 }}>
            Een huiselijke lunchgelegenheid aan het Raadhuisplein, tegenover het stadskantoor in Etten-Leur. Welkom.
          </p>
          <button
            className="nav-cta"
            style={{ marginTop: 20, background: "transparent", border: "1px solid rgba(255,255,255,0.35)" }}
            onClick={openReserve}
          >
            Reserveer een tafel <IconArrow />
          </button>
        </div>
        <div>
          <h4>Adres</h4>
          <p>{B.address}<br/>{B.postcode}<br/>Etten-Leur</p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>
            <a href={B.phoneHref}>{B.phone}</a><br/>
            <a href={`mailto:${B.email}`}>{B.email}</a>
          </p>
          <h4 style={{ marginTop: 20 }}>Volg ons</h4>
          <p>
            <a href={B.instagramUrl}>Instagram</a> &nbsp;·&nbsp;
            <a href={B.facebookUrl}>Facebook</a>
          </p>
        </div>
        <div>
          <h4>Snel naar</h4>
          <ul>
            {window.NAV_PAGES.map((p) => (
              <li key={p.id}>
                <a href={`#${p.id}`} onClick={(e) => { e.preventDefault(); go(p.id); }}>{p.label}</a>
              </li>
            ))}
            <li style={{ marginTop: 12 }}>
              <a href="#cookiebeleid" onClick={(e) => { e.preventDefault(); go("cookiebeleid"); }}>Cookiebeleid</a>
            </li>
            <li>
              <a href="#privacybeleid" onClick={(e) => { e.preventDefault(); go("privacybeleid"); }}>Privacybeleid</a>
            </li>
            <li>
              <button
                type="button"
                className="footer-linklike"
                onClick={() => {
                  try { window.localStorage.removeItem("zusenzo.cookieconsent.v1"); } catch (e) {}
                  window.location.reload();
                }}
              >
                Cookie-instellingen
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} · Lunchcafé Zus &amp; Zo · KvK 12345678</span>
        <span>Gemaakt met liefde in Etten-Leur</span>
      </div>
    </footer>
  );
}

function FloatingReserve({ onClick }) {
  return (
    <button className="fab" onClick={onClick} aria-label="Reserveer hier">
      <span className="dot" aria-hidden></span>
      Reserveer hier
    </button>
  );
}

// ---------------------------------------------------------------
// Shared PageHero, full-bleed, full-viewport
//
// Props:
//   image      , src for hero photo (optional)
//   alt        , alt text
//   tint       , overlay tint: "" | "evening" | "tea" | "warm"
//   placeholder, boolean; if true (no image), shows a tinted gradient placeholder
//   eyebrow    , top-left mono label, like "Pagina 02 · Lunch"
//   number     , small "№ 02"
//   titleNode  , React node for the h1 content (can include spans)
//   lede       , short paragraph in the right column
//   tag        , bottom-right caption (e.g. "PLACEHOLDER, etagère shot")
//   children   , extra content in the aside column (CTAs)
// ---------------------------------------------------------------
function PageHero({ image, alt, tint, placeholder, eyebrow, number, titleNode, lede, tag, children }) {
  const tintClass = tint ? ` tint-${tint}` : "";
  return (
    <section className={"page-hero" + tintClass}>
      {image && !placeholder && (
        <img className="page-hero-img" src={image} alt={alt || ""} />
      )}
      {placeholder && (
        <div className={"page-hero-placeholder" + tintClass} aria-hidden="true"></div>
      )}
      <div className="page-hero-overlay" aria-hidden="true"></div>

      <div className="page-hero-content">
        <div>
          {(number || eyebrow) && (
            <div className="page-hero-eyebrow">
              {number && <span className="num">{number}</span>}
              <span className="dash" />
              {eyebrow && <span>{eyebrow}</span>}
            </div>
          )}
          <h1>{titleNode}</h1>
        </div>
        {(lede || children) && (
          <div className="page-hero-aside">
            {lede && <p className="page-hero-lede">{lede}</p>}
            {children}
          </div>
        )}
      </div>

      {/* hero tag removed per user request */}

      <div className="page-hero-scroll" aria-hidden="true">
        <span className="line"></span> Scroll
      </div>
    </section>
  );
}

Object.assign(window, { Nav, Footer, FloatingReserve, IconArrow, IconClose, IconMenu, PageHero });
