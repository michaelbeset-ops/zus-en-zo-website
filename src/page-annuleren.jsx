/* global window, React */
// =============================================================
// Annuleren via de link uit de bevestigingsmail: #annuleren?id=<uuid>
// =============================================================
const { useState: useStateX, useEffect: useEffectX } = React;

function hashParam(name) {
  const q = (window.location.hash.split("?")[1] || "");
  return new URLSearchParams(q).get(name) || "";
}

function PageAnnuleren({ openReserve }) {
  const [id] = useStateX(hashParam("id"));
  const [state, setState] = useStateX("laden"); // laden | open | bezig | klaar | fout
  const [res, setRes] = useStateX(null);
  const [error, setError] = useStateX("");

  useEffectX(() => {
    let cancelled = false;
    if (!id) {
      setState("fout");
      setError("Deze link is niet compleet. Open de link uit je mail opnieuw, of bel ons.");
      return;
    }
    window.ReserveApi.call("cancel-info", { id }).then((r) => {
      if (cancelled) return;
      if (!r.ok) { setState("fout"); setError(window.ReserveApi.message(r.code)); return; }
      setRes(r.reservation);
      if (r.reservation.status === "geannuleerd") { setState("fout"); setError(window.ReserveApi.message("geannuleerd")); }
      else if (r.reservation.is_past) { setState("fout"); setError(window.ReserveApi.message("voorbij")); }
      else setState("open");
    });
    return () => { cancelled = true; };
  }, [id]);

  const doCancel = async () => {
    setState("bezig");
    const r = await window.ReserveApi.call("cancel", { id });
    if (r.ok) setState("klaar");
    else { setState("open"); setError(window.ReserveApi.message(r.code)); }
  };

  const typeLabel = res ? (res.type_name || "") : "";

  return (
    <main>
      <window.PageHero
        placeholder
        tint="daylight"
        eyebrow="Reservering"
        titleNode={state === "klaar" ? <React.Fragment>Geannuleerd.<br/><span className="it">Tot een volgende keer.</span></React.Fragment>
          : <React.Fragment>Reservering<br/><span className="it">annuleren</span></React.Fragment>}
      />

      <section className="legal-section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="cancel-card">
            {state === "laden" && <p aria-live="polite">Reservering ophalen…</p>}

            {res && state !== "laden" && (
              <dl className="recap" style={{ marginTop: 0 }}>
                <dt>Reservering</dt>
                <dd>{typeLabel}</dd>
                <dt>Op naam van</dt>
                <dd>{res.name}</dd>
                <dt>Datum & tijd</dt>
                <dd>{window.fmtReserveDate(res.date)} · {res.time}</dd>
                <dt>Gasten</dt>
                <dd>{res.guests} {res.guests === 1 ? "persoon" : "personen"}</dd>
              </dl>
            )}

            {error && <div className="callout callout-error" role="alert">{error}</div>}

            {(state === "open" || state === "bezig") && (
              <React.Fragment>
                <p className="cancel-text">Weet je het zeker? Na het annuleren geven we de tafel aan iemand anders.</p>
                <div className="cancel-actions">
                  <button className="btn btn-primary" onClick={doCancel} disabled={state === "bezig"}>
                    {state === "bezig" ? "Bezig…" : "Ja, annuleer mijn reservering"}
                  </button>
                  <a className="btn" href="#home">Nee, ik kom gewoon</a>
                </div>
              </React.Fragment>
            )}

            {state === "klaar" && (
              <React.Fragment>
                <p className="cancel-text">Je reservering is geannuleerd. Je krijgt hiervan nog een mail. Toch een ander moment? Reserveer gerust opnieuw.</p>
                <div className="cancel-actions">
                  <button className="btn btn-primary" onClick={() => openReserve()}>Opnieuw reserveren</button>
                </div>
              </React.Fragment>
            )}

            {state === "fout" && (
              <p className="cancel-text">
                Vragen? Bel <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a> of mail{" "}
                <a href={`mailto:${window.BRAND.email}`}>{window.BRAND.email}</a>.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

// Afmelden voor nieuws via de link uit de mail: #afmelden?token=<uuid>
function PageAfmelden() {
  const [token] = useStateX(hashParam("token"));
  const [state, setState] = useStateX("open"); // open | bezig | klaar | fout
  const [error, setError] = useStateX("");

  const doUnsubscribe = async () => {
    setState("bezig");
    const r = await window.ReserveApi.call("unsubscribe", { token });
    if (r.ok) setState("klaar");
    else { setState("fout"); setError(window.ReserveApi.message(r.code)); }
  };

  return (
    <main>
      <window.PageHero
        placeholder
        tint="daylight"
        eyebrow="Nieuwsbrief"
        titleNode={state === "klaar" ? <React.Fragment>Afgemeld.<br/><span className="it">Je hoort niets meer.</span></React.Fragment>
          : <React.Fragment>Afmelden voor<br/><span className="it">ons nieuws</span></React.Fragment>}
      />
      <section className="legal-section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="cancel-card">
            {!token ? (
              <div className="callout callout-error" role="alert">Deze link is niet compleet. Mail ons gerust op <a href={`mailto:${window.BRAND.email}`}>{window.BRAND.email}</a>, dan halen we je van de lijst.</div>
            ) : state === "klaar" ? (
              <p className="cancel-text" style={{ marginTop: 0 }}>Je staat niet meer op onze mailinglijst. Je reserveringen blijven gewoon staan.</p>
            ) : (
              <React.Fragment>
                {error && <div className="callout callout-error" role="alert">{error}</div>}
                <p className="cancel-text" style={{ marginTop: 0 }}>Wil je geen nieuws en acties meer van ons per mail? Klik dan hieronder. Je reserveringen blijven gewoon staan.</p>
                <div className="cancel-actions">
                  <button className="btn btn-primary" onClick={doUnsubscribe} disabled={state === "bezig"}>
                    {state === "bezig" ? "Bezig…" : "Ja, meld me af"}
                  </button>
                  <a className="btn" href="#home">Nee, laat maar</a>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { PageAnnuleren, PageAfmelden });
