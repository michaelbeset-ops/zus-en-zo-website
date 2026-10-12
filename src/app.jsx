/* global window, React, ReactDOM */
// =============================================================
// Main App, routes between the 5 pages via location hash.
// =============================================================
const { useState: useStateA, useEffect: useEffectA } = React;

function readHash() {
  const h = (window.location.hash || "").replace(/^#/, "").split("?")[0].trim();
  const valid = [...window.NAV_PAGES.map((p) => p.id), "cookiebeleid", "privacybeleid", "annuleren", "afmelden"];
  if (valid.includes(h)) return h;
  return "home";
}

function App() {
  const [page, setPage] = useStateA(readHash());
  const [reserveOpen, setReserveOpen] = useStateA(false);
  const [reserveInitial, setReserveInitial] = useStateA(null);
  const [, setConfigVersion] = useStateA(0);

  // Openingstijden en reserveringsinstellingen uit het beheer laden. Tot die
  // binnen zijn toont de site de vaste waarden uit data.jsx.
  useEffectA(() => {
    const apply = () => {
      if (window.ReserveApi.configured) window.HOURS = window.ReserveApi.siteHours();
      setConfigVersion((v) => v + 1);
    };
    window.addEventListener("zz-config", apply);
    window.ReserveApi.loadConfig();
    return () => window.removeEventListener("zz-config", apply);
  }, []);

  useEffectA(() => {
    const onHash = () => setPage(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // scroll to top on page switch
  useEffectA(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [page]);

  const go = (id) => {
    if (id === "feesten") {
      window.location.hash = "diner";
      window.setTimeout(() => {
        const el = document.querySelector(".feesten");
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 120);
      return;
    }
    // Zelfde pagina (bijv. op het logo klikken op home): terug naar boven.
    if (readHash() === id) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.hash = id;
  };

  const openReserve = (initial) => {
    setReserveInitial(initial || null);
    setReserveOpen(true);
  };
  const closeReserve = () => setReserveOpen(false);

  let Page;
  if (page === "lunch") Page = <window.PageLunch openReserve={openReserve} />;
  else if (page === "hightea") Page = <window.PageHighTea openReserve={openReserve} />;
  else if (page === "diner") Page = <window.PageDiner openReserve={openReserve} />;
  else if (page === "contact") Page = <window.PageContact openReserve={openReserve} />;
  else if (page === "bezorging") Page = <window.PageBezorging />;
  else if (page === "cookiebeleid") Page = <window.PageCookiebeleid />;
  else if (page === "privacybeleid") Page = <window.PagePrivacybeleid />;
  else if (page === "annuleren") Page = <window.PageAnnuleren openReserve={openReserve} />;
  else if (page === "afmelden") Page = <window.PageAfmelden />;
  else Page = <window.PageHome go={go} openReserve={openReserve} />;

  return (
    <React.Fragment>
      <window.Nav page={page} go={go} openReserve={() => openReserve()} />
      {Page}
      <window.Footer go={go} openReserve={() => openReserve()} />
      <window.FloatingReserve onClick={() => openReserve()} />
      <window.ReserveModal open={reserveOpen} onClose={closeReserve} initialType={reserveInitial} />
      <window.CookieBanner go={go} />
    </React.Fragment>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
