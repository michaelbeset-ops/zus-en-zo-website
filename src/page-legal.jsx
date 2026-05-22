/* global window, React */
// =============================================================
// Cookie banner + Cookie policy + Privacy policy
// =============================================================
const { useState: useStateK, useEffect: useEffectK } = React;

const STORAGE_KEY = "zusenzo.cookieconsent.v1";

function CookieBanner({ go }) {
  const [state, setState] = useStateK(null); // null = loading, "shown" / "hidden"
  const [showPrefs, setShowPrefs] = useStateK(false);
  const [prefs, setPrefs] = useStateK({ functional: true, analytics: false, marketing: false });

  useEffectK(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState("hidden");
      } else {
        setState("shown");
      }
    } catch (e) {
      setState("shown");
    }
  }, []);

  const save = (choice) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...choice,
        timestamp: new Date().toISOString(),
      }));
    } catch (e) { /* ignore */ }
    setState("hidden");
    setShowPrefs(false);
  };

  if (state !== "shown") return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookietoestemming" aria-live="polite">
      <div className="cookie-banner-inner">
        {!showPrefs ? (
          <React.Fragment>
            <div className="cookie-banner-text">
              <h3>Wij gebruiken cookies.</h3>
              <p>
                We gebruiken functionele cookies om de website goed te laten werken, en
                anonieme statistieken om te zien hoe bezoekers ons vinden. Verder niets
                spannends. Lees meer in ons{" "}
                <a href="#cookiebeleid" onClick={(e) => { e.preventDefault(); go("cookiebeleid"); }}>
                  cookiebeleid
                </a>{" "}en{" "}
                <a href="#privacybeleid" onClick={(e) => { e.preventDefault(); go("privacybeleid"); }}>
                  privacybeleid
                </a>.
              </p>
            </div>
            <div className="cookie-banner-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setShowPrefs(true)}
              >
                Instellingen
              </button>
              <button
                className="btn"
                onClick={() => save({ functional: true, analytics: false, marketing: false })}
              >
                Alleen noodzakelijk
              </button>
              <button
                className="btn btn-primary"
                onClick={() => save({ functional: true, analytics: true, marketing: true })}
              >
                Alles accepteren
              </button>
            </div>
          </React.Fragment>
        ) : (
          <div className="cookie-prefs">
            <div className="cookie-banner-text">
              <h3>Cookie-instellingen</h3>
              <p>Kies welke cookies we mogen plaatsen. Je keuze geldt voor deze browser.</p>
            </div>
            <div className="cookie-pref-list">
              <label className="cookie-pref-row locked">
                <input type="checkbox" checked readOnly disabled />
                <div>
                  <strong>Noodzakelijk</strong>
                  <p>Altijd aan. Zonder deze cookies werkt de website niet.</p>
                </div>
              </label>
              <label className="cookie-pref-row">
                <input
                  type="checkbox"
                  checked={prefs.analytics}
                  onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                />
                <div>
                  <strong>Statistieken</strong>
                  <p>Anonieme bezoekersstatistieken zodat we weten welke pagina's populair zijn.</p>
                </div>
              </label>
              <label className="cookie-pref-row">
                <input
                  type="checkbox"
                  checked={prefs.marketing}
                  onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                />
                <div>
                  <strong>Marketing & social</strong>
                  <p>Voor ingebedde Instagram-content en eventuele advertenties (we gebruiken dit nu niet, maar in de toekomst misschien wel).</p>
                </div>
              </label>
            </div>
            <div className="cookie-banner-actions">
              <button className="btn btn-ghost" onClick={() => setShowPrefs(false)}>
                Terug
              </button>
              <button
                className="btn btn-primary"
                onClick={() => save({ functional: true, ...prefs })}
              >
                Mijn keuze bewaren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Shared building blocks for the two legal pages
// ---------------------------------------------------------------
function LegalPage({ tag, number, title, titleEm, updated, intro, sections }) {
  return (
    <main>
      <window.PageHero
        placeholder
        tint="daylight"
        eyebrow={tag}
        number={number}
        titleNode={
          <React.Fragment>
            {title}<br/>
            <span className="it">{titleEm}</span>
          </React.Fragment>
        }
        lede={intro}
      />

      <section className="legal-section">
        <div className="container legal-grid">
          <aside className="legal-toc">
            <span className="eyebrow"><span className="num">↘</span>Inhoud</span>
            <ol>
              {sections.map((s, i) => (
                <li key={i}>
                  <a href={`#sec-${i}`} onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById("sec-" + i);
                    if (el) {
                      const y = el.getBoundingClientRect().top + window.scrollY - 100;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    }
                  }}>
                    <span className="num">{String(i + 1).padStart(2, "0")}</span>
                    {s.heading}
                  </a>
                </li>
              ))}
            </ol>
            <div className="legal-meta">
              <span className="eyebrow">Laatst bijgewerkt</span>
              <p>{updated}</p>
            </div>
          </aside>

          <article className="legal-body">
            {sections.map((s, i) => (
              <section key={i} id={"sec-" + i} className="legal-block">
                <span className="legal-block-num">{String(i + 1).padStart(2, "0")}</span>
                <h2>{s.heading}</h2>
                {s.body}
              </section>
            ))}

            <section className="legal-block legal-contact-block">
              <h2>Vragen of klachten?</h2>
              <p>
                Heb je een vraag, een klacht, of wil je weten welke gegevens we van je
                hebben? Mail ons gerust op{" "}
                <a href={`mailto:${window.BRAND.email}`}>{window.BRAND.email}</a>, of
                bel{" "}
                <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>. We reageren
                doorgaans binnen één werkdag.
              </p>
              <p style={{ marginTop: 12, color: "var(--ink-mute)", fontSize: 14 }}>
                Vind je dat we niet goed met je gegevens omgaan? Dan kun je een klacht
                indienen bij de Autoriteit Persoonsgegevens via{" "}
                <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noopener noreferrer">
                  autoriteitpersoonsgegevens.nl
                </a>.
              </p>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}

// ---------------------------------------------------------------
// COOKIE POLICY
// ---------------------------------------------------------------
function PageCookiebeleid() {
  const sections = [
    {
      heading: "Wat zijn cookies eigenlijk?",
      body: (
        <React.Fragment>
          <p>
            Cookies zijn kleine tekstbestandjes die een website op je telefoon, tablet of
            computer plaatst. Daarmee kan een site dingen onthouden, bijvoorbeeld dat je
            al eens langs bent geweest, of welke instellingen je hebt gekozen.
          </p>
          <p>
            Wij vinden cookies zelf ook geen feestje, dus we proberen ze zo min mogelijk
            te gebruiken. Wat we wél gebruiken, leggen we hieronder eerlijk uit.
          </p>
        </React.Fragment>
      ),
    },
    {
      heading: "Welke cookies plaatsen wij?",
      body: (
        <React.Fragment>
          <p>We onderscheiden drie soorten cookies op deze website:</p>
          <div className="legal-table">
            <div className="legal-row legal-row-head">
              <div>Soort</div><div>Waarvoor</div><div>Bewaar­termijn</div>
            </div>
            <div className="legal-row">
              <div><strong>Functioneel</strong><br/><span className="legal-pill">Altijd aan</span></div>
              <div>Zorgt dat de site werkt: dat je cookie-keuze wordt onthouden, dat je reservering door de stappen heen blijft staan, en dat menu en filters reageren zoals je verwacht.</div>
              <div>Sessie tot 12 maanden</div>
            </div>
            <div className="legal-row">
              <div><strong>Statistieken</strong><br/><span className="legal-pill optional">Optioneel</span></div>
              <div>We gebruiken een privacy-vriendelijke statistiek-tool die telt hoeveel mensen onze site bezoeken en welke pagina's populair zijn. We zien geen persoonsgegevens en geen volledige IP-adressen.</div>
              <div>Maximaal 12 maanden</div>
            </div>
            <div className="legal-row">
              <div><strong>Marketing & social</strong><br/><span className="legal-pill optional">Optioneel</span></div>
              <div>Voor ingebedde content van bijvoorbeeld Instagram of voor advertenties via sociale netwerken. We gebruiken dit nu niet actief, maar mogelijk in de toekomst, en alleen als je toestemming geeft.</div>
              <div>Tot 24 maanden</div>
            </div>
          </div>
        </React.Fragment>
      ),
    },
    {
      heading: "Hoe vraag je toestemming?",
      body: (
        <React.Fragment>
          <p>
            Bij je eerste bezoek tonen we een cookiebanner. Daarin kun je kiezen tussen
            <em> alleen noodzakelijk</em>,<em> alles accepteren</em>, of je eigen
            instellingen samenstellen. Pas als je toestemming hebt gegeven, zetten we de
            optionele cookies aan. Functionele cookies plaatsen we altijd, want zonder
            werkt de site simpelweg niet.
          </p>
          <p>
            Je keuze bewaren we lokaal in je browser. Wis je je browsergeschiedenis of
            bezoek je ons in een andere browser, dan vragen we het opnieuw.
          </p>
        </React.Fragment>
      ),
    },
    {
      heading: "Je keuze later aanpassen of intrekken",
      body: (
        <React.Fragment>
          <p>
            Van gedachten veranderd? Geen probleem. Onderaan elke pagina vind je een
            link <em>"Cookie-instellingen"</em>. Klik daarop om je voorkeur opnieuw te
            zetten. Je kunt cookies ook zelf wissen via de instellingen van je browser.
          </p>
          <p>
            Voor de bekendste browsers vind je instructies bij{" "}
            <a href="https://www.consumentenbond.nl/internet-privacy/cookies-verwijderen" target="_blank" rel="noopener noreferrer">
              de Consumentenbond
            </a>.
          </p>
        </React.Fragment>
      ),
    },
    {
      heading: "Cookies van derden",
      body: (
        <React.Fragment>
          <p>
            Wanneer je akkoord gaat met marketing-cookies kunnen externe partijen
            (bijvoorbeeld Instagram of Facebook) cookies plaatsen via ingebedde content
            of knoppen. Wij hebben geen invloed op wat die partijen vervolgens met die
            gegevens doen. Lees daarom ook hun eigen privacybeleid voor de details.
          </p>
        </React.Fragment>
      ),
    },
    {
      heading: "Wijzigingen in dit cookiebeleid",
      body: (
        <p>
          We mogen dit cookiebeleid aanpassen, bijvoorbeeld als er iets verandert aan de
          techniek of de wet. De meest recente versie staat altijd op deze pagina, met
          de datum waarop hij is bijgewerkt. Grote wijzigingen melden we via een
          nieuwe cookiebanner, zodat je opnieuw kunt kiezen.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      tag="Pagina 06 · Cookiebeleid"
      number="№ 06"
      title="Ons"
      titleEm="cookiebeleid."
      updated="22 mei 2026"
      intro="Eerlijk en in gewone taal. Wat we gebruiken, waarom we het gebruiken, en hoe je het uit kunt zetten."
      sections={sections}
    />
  );
}

// ---------------------------------------------------------------
// PRIVACY POLICY
// ---------------------------------------------------------------
function PagePrivacybeleid() {
  const sections = [
    {
      heading: "Wie zijn wij?",
      body: (
        <React.Fragment>
          <p>
            Dit is het privacybeleid van Lunchcafé Zus &amp; Zo, gevestigd aan het
            Raadhuisplein 37 in Etten-Leur. We zijn de zogeheten verwerkings­verantwoordelijke
            voor de persoonsgegevens die we via deze website, in de zaak of via telefoon
            of mail ontvangen.
          </p>
          <p>
            Bereikbaar voor vragen over dit beleid:{" "}
            <a href={`mailto:${window.BRAND.email}`}>{window.BRAND.email}</a> of{" "}
            <a href={window.BRAND.phoneHref}>{window.BRAND.phone}</a>.
          </p>
        </React.Fragment>
      ),
    },
    {
      heading: "Welke gegevens verzamelen we?",
      body: (
        <React.Fragment>
          <p>We verzamelen alleen wat we echt nodig hebben. In de praktijk komt het op het volgende neer:</p>
          <ul className="legal-list">
            <li>
              <strong>Bij een reservering:</strong> je naam, telefoonnummer, e-mailadres,
              aantal personen, datum en tijd, en eventuele opmerkingen of dieetwensen.
            </li>
            <li>
              <strong>Bij het contactformulier:</strong> je naam, e-mailadres, onderwerp
              en de inhoud van je bericht.
            </li>
            <li>
              <strong>Bij een bestelling om af te halen:</strong> je naam, telefoonnummer,
              je bestelling en het tijdstip waarop je komt halen.
            </li>
            <li>
              <strong>Bij een sollicitatie:</strong> je CV, motivatiebrief en wat je daar
              verder zelf in meestuurt.
            </li>
            <li>
              <strong>Bij het bezoeken van de website:</strong> beperkte, anonieme
              statistieken (zie ons{" "}
              <a href="#cookiebeleid">cookiebeleid</a>) als je daarvoor toestemming hebt
              gegeven.
            </li>
          </ul>
        </React.Fragment>
      ),
    },
    {
      heading: "Waarom verzamelen we ze?",
      body: (
        <React.Fragment>
          <p>We verwerken je gegevens om concrete dingen mogelijk te maken:</p>
          <ul className="legal-list">
            <li>Je reservering of bestelling klaarmaken en bevestigen.</li>
            <li>Contact opnemen als er iets verandert (bijv. een onverwachte sluiting).</li>
            <li>Je vraag of klacht netjes afhandelen.</li>
            <li>Een sollicitatie­procedure doorlopen.</li>
            <li>Onze website verbeteren op basis van geanonimiseerde statistieken.</li>
            <li>Voldoen aan wettelijke verplichtingen, bijvoorbeeld voor de Belastingdienst.</li>
          </ul>
        </React.Fragment>
      ),
    },
    {
      heading: "Op welke grondslag?",
      body: (
        <React.Fragment>
          <p>
            De AVG (de Europese privacywet) eist dat er een geldige reden is voor het
            verwerken van persoonsgegevens. Wij gebruiken er drie:
          </p>
          <ul className="legal-list">
            <li>
              <strong>Uitvoering van een overeenkomst</strong>, bijvoorbeeld het
              vastleggen van je reservering of bestelling.
            </li>
            <li>
              <strong>Wettelijke verplichting</strong>, bijvoorbeeld het bewaren van
              facturen voor de Belastingdienst.
            </li>
            <li>
              <strong>Toestemming</strong>, bijvoorbeeld voor optionele cookies of
              voor het opslaan van een sollicitatie in onze portefeuille. Toestemming
              kun je altijd weer intrekken.
            </li>
          </ul>
        </React.Fragment>
      ),
    },
    {
      heading: "Hoe lang bewaren we ze?",
      body: (
        <React.Fragment>
          <p>Niet langer dan nodig is. Concreet:</p>
          <div className="legal-table">
            <div className="legal-row legal-row-head">
              <div>Soort gegevens</div>
              <div>Bewaartermijn</div>
            </div>
            <div className="legal-row">
              <div>Reserverings­gegevens</div>
              <div>Tot 6 maanden na bezoek, voor service en eventuele vragen.</div>
            </div>
            <div className="legal-row">
              <div>Contactformulier</div>
              <div>Tot 12 maanden, daarna verwijderen we het bericht.</div>
            </div>
            <div className="legal-row">
              <div>Facturen en boekhouding</div>
              <div>7 jaar, op grond van fiscale bewaarplicht.</div>
            </div>
            <div className="legal-row">
              <div>Sollicitatiegegevens</div>
              <div>Tot 4 weken na afronding van de procedure, of langer met je toestemming.</div>
            </div>
            <div className="legal-row">
              <div>Anonieme statistieken</div>
              <div>Maximaal 12 maanden, daarna geaggregeerd.</div>
            </div>
          </div>
        </React.Fragment>
      ),
    },
    {
      heading: "Met wie delen we ze?",
      body: (
        <React.Fragment>
          <p>
            Wij verkopen je gegevens niet. We delen ze alleen met partijen die ons
            helpen onze zaak te runnen, en alleen voor zover dat strikt nodig is:
          </p>
          <ul className="legal-list">
            <li>
              Onze <strong>boekhouder</strong> (voor facturen en jaarrekeningen).
            </li>
            <li>
              De leverancier van ons <strong>reserverings­systeem</strong> en onze
              <strong> websitehosting</strong>, met wie we een verwerkers­overeenkomst hebben.
            </li>
            <li>
              <strong>Bezorgers of cateringpartners</strong>, alleen als ze voor jouw
              bestelling iets moeten weten.
            </li>
            <li>
              <strong>Overheidsinstanties</strong>, als de wet dat van ons vraagt.
            </li>
          </ul>
          <p>
            We slaan je gegevens op binnen de Europese Economische Ruimte (EER), of
            bij partijen die zich aan AVG-equivalente waarborgen houden.
          </p>
        </React.Fragment>
      ),
    },
    {
      heading: "Hoe beveiligen we ze?",
      body: (
        <p>
          We nemen passende technische en organisatorische maatregelen om je gegevens
          te beschermen. Denk aan versleutelde verbindingen (SSL/TLS), beveiligde
          toegang tot onze systemen, sterke wachtwoorden, en het beperken van toegang
          tot alleen de medewerkers die het nodig hebben. Mocht er ondanks alles
          onverhoopt iets misgaan, dan melden we dat zoals voorgeschreven aan jou en
          aan de Autoriteit Persoonsgegevens.
        </p>
      ),
    },
    {
      heading: "Jouw rechten",
      body: (
        <React.Fragment>
          <p>Onder de AVG heb je een aantal rechten over jouw gegevens. Je kunt ons vragen om:</p>
          <ul className="legal-list">
            <li><strong>Inzage</strong> in de gegevens die we van je hebben.</li>
            <li><strong>Correctie</strong> als iets niet klopt.</li>
            <li><strong>Verwijdering</strong> als we ze niet meer hoeven te bewaren.</li>
            <li><strong>Beperking</strong> van de verwerking, in bepaalde situaties.</li>
            <li><strong>Overdracht</strong> van je gegevens naar een andere partij.</li>
            <li><strong>Bezwaar</strong> tegen een specifieke verwerking.</li>
            <li><strong>Intrekken</strong> van je toestemming, op elk gewenst moment.</li>
          </ul>
          <p>
            Stuur een mailtje naar{" "}
            <a href={`mailto:${window.BRAND.email}`}>{window.BRAND.email}</a> en we
            regelen het binnen een maand. We mogen je vragen je te legitimeren, zodat
            we zeker weten dat we de gegevens aan de juiste persoon teruggeven.
          </p>
        </React.Fragment>
      ),
    },
    {
      heading: "Wijzigingen in dit privacybeleid",
      body: (
        <p>
          We mogen dit beleid bijwerken, bijvoorbeeld als de wet of onze werkwijze
          verandert. De meest actuele versie vind je altijd op deze pagina, met de
          datum waarop hij is gewijzigd. Bij ingrijpende wijzigingen laten we het je
          ook op een andere manier weten, bijvoorbeeld via een melding op de site.
        </p>
      ),
    },
  ];

  return (
    <LegalPage
      tag="Pagina 07 · Privacybeleid"
      number="№ 07"
      title="Ons"
      titleEm="privacybeleid."
      updated="22 mei 2026"
      intro="In gewone taal: wat we van je bewaren, waarom, hoe lang, en hoe je het weer weg kunt laten halen."
      sections={sections}
    />
  );
}

Object.assign(window, { CookieBanner, PageCookiebeleid, PagePrivacybeleid });
