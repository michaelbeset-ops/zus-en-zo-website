/* global window, React, ReactDOM */
// =============================================================
// Main App, routes between the 5 pages via location hash.
// =============================================================
const { useState: useStateA, useEffect: useEffectA } = React;

function readHash() {
  const h = (window.location.hash || "").replace(/^#/, "").trim();
  const valid = [...window.NAV_PAGES.map((p) => p.id), "cookiebeleid", "privacybeleid"];
  if (valid.includes(h)) return h;
  return "home";
}

function App() {
  const [page, setPage] = useStateA(readHash());
  const [reserveOpen, setReserveOpen] = useStateA(false);
  const [reserveInitial, setReserveInitial] = useStateA(null);

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
  else if (page === "cookiebeleid") Page = <window.PageCookiebeleid />;
  else if (page === "privacybeleid") Page = <window.PagePrivacybeleid />;
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
