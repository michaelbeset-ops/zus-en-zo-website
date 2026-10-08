/* global window */
// =============================================================
// Reserveringen: praat met Supabase (beschikbaarheid) en met de
// Edge Function "reservering" (aanmaken, annuleren, bevestigen).
// Gedeeld door de website (reserve.jsx, page-annuleren.jsx) en het
// beheer (beheer.jsx).
// =============================================================
(function () {
  const cfg = window.RESERVERING_CONFIG || {};
  const url = (cfg.supabaseUrl || "").replace(/\/+$/, "");
  const key = cfg.supabaseAnonKey || "";
  const configured = Boolean(url && key);

  // De oude "anon"-sleutel is een JWT en mag als Bearer mee; de nieuwe
  // "publishable"-sleutel niet, die gaat alleen als apikey.
  function headers(token) {
    const h = { "Content-Type": "application/json", apikey: key };
    if (token) h.Authorization = "Bearer " + token;
    else if (key.startsWith("eyJ")) h.Authorization = "Bearer " + key;
    return h;
  }

  async function post(path, body, token) {
    if (!configured) return { ok: false, code: "niet_ingesteld" };
    try {
      const res = await fetch(url + path, {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      return { res, data };
    } catch (e) {
      return { ok: false, code: "netwerk" };
    }
  }

  // Beschikbaarheid per tijdslot: [{ slot: "12:00", available: true, reason: null }]
  async function availability(date, type, guests) {
    const r = await post("/rest/v1/rpc/get_availability", { p_date: date, p_type: type, p_guests: guests });
    if (!r.res) return { ok: false, code: r.code };
    if (!r.res.ok || !Array.isArray(r.data)) return { ok: false, code: "fout" };
    return { ok: true, slots: r.data };
  }

  async function call(action, body, token) {
    const r = await post("/functions/v1/reservering", Object.assign({ action }, body), token);
    if (!r.res) return { ok: false, code: r.code };
    return r.data || { ok: false, code: "fout" };
  }

  // Foutcode naar een zin voor de bezoeker.
  function message(code) {
    const PHONE = (window.BRAND && window.BRAND.phone) || "076 504 1134";
    switch (code) {
      case "vol": return "Dit tijdstip zit inmiddels vol. Kies een ander tijdstip.";
      case "gesloten": return "Op dit moment zijn we gesloten. Kies een andere dag of tijd.";
      case "ongeldig": return "Er klopt iets niet in je gegevens. Kijk ze nog even na.";
      case "te_veel": return `Je hebt net al een paar aanvragen gedaan. Bel ons even op ${PHONE}, dan regelen we het samen.`;
      case "niet_gevonden": return "We kunnen deze reservering niet vinden. Klopt de link uit je mail?";
      case "geannuleerd": return "Deze reservering is al geannuleerd.";
      case "voorbij": return "Deze reservering ligt in het verleden en kan niet meer online worden geannuleerd.";
      case "netwerk": return "Geen verbinding. Controleer je internet en probeer het opnieuw.";
      case "niet_ingesteld": return `Online reserveren is nog niet beschikbaar. Bel ons op ${PHONE}, dan zetten we je erin.`;
      default: return `Er ging iets mis. Probeer het opnieuw of bel ons op ${PHONE}.`;
    }
  }

  // Lokale datum als YYYY-MM-DD (toISOString() rekent in UTC en geeft
  // 's avonds laat de verkeerde dag).
  function localDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  window.ReserveApi = { configured, url, key, availability, call, message, localDate };
})();
