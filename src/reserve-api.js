/* global window */
// =============================================================
// Reserveringen: praat met Supabase (instellingen, beschikbaarheid) en
// met de Edge Function "reservering" (aanmaken, annuleren, beheer).
// Gedeeld door de website (reserve.jsx, page-annuleren.jsx, app.jsx) en
// het beheer (beheer.jsx).
//
// Openingstijden, reserveringstypes en termijnen komen uit het beheer.
// DEFAULT_CONFIG hieronder is alleen de terugval zolang Supabase niet
// gekoppeld of even onbereikbaar is; hij is gelijk aan de beginwaarden in
// supabase/schema.sql.
// =============================================================
(function () {
  const cfg = window.RESERVERING_CONFIG || {};
  const url = (cfg.supabaseUrl || "").replace(/\/+$/, "");
  const key = cfg.supabaseAnonKey || "";
  const configured = Boolean(url && key);

  const DEFAULT_CONFIG = {
    types: [
      { id: "lunch", name: "Lunch", description: "Belegde broodjes, salades, koffie & lekkers", tag: "", days: [1, 2, 3, 4, 5, 6], first_slot: "11:30", last_slot: "15:00", interval_min: 30 },
      { id: "hightea", name: "High Tea", description: "Uitgebreide 3-gangen high tea op reservering", tag: "", days: [1, 2, 3, 4, 5, 6], first_slot: "13:00", last_slot: "15:00", interval_min: 30 },
      { id: "diner", name: "Diner", description: "We trekken alles uit de kast", tag: "Alleen op vrijdagavond", days: [5], first_slot: "17:30", last_slot: "19:00", interval_min: 30 },
    ],
    hours: [
      { isodow: 1, closed: false, open_time: "10:00", close_time: "17:30", note: "", highlight: false },
      { isodow: 2, closed: false, open_time: "10:00", close_time: "17:30", note: "", highlight: false },
      { isodow: 3, closed: false, open_time: "10:00", close_time: "17:30", note: "", highlight: false },
      { isodow: 4, closed: false, open_time: "10:00", close_time: "17:30", note: "", highlight: false },
      { isodow: 5, closed: false, open_time: "10:00", close_time: "21:00", note: "Diner-avond", highlight: true },
      { isodow: 6, closed: false, open_time: "10:00", close_time: "17:00", note: "", highlight: false },
      { isodow: 7, closed: false, open_time: "11:00", close_time: "17:00", note: "Alleen koopzondag (laatste zondag van de maand)", highlight: false },
    ],
    settings: {
      max_guests_online: 8,
      min_minutes_ahead: 60,
      max_days_ahead: 180,
      ask_marketing: true,
      marketing_text: "Ja, stuur me af en toe nieuws en acties van Zus & Zo per mail. Afmelden kan altijd.",
      auto_confirm: false,
    },
  };

  let current = DEFAULT_CONFIG;
  let loading = null;

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

  // Instellingen uit het beheer ophalen (een keer per bezoek).
  function loadConfig(force) {
    if (!configured) return Promise.resolve(current);
    if (loading && !force) return loading;
    loading = post("/rest/v1/rpc/get_public_config", {}).then((r) => {
      if (r.res && r.res.ok && r.data && Array.isArray(r.data.types)) {
        current = {
          types: r.data.types,
          hours: Array.isArray(r.data.hours) && r.data.hours.length === 7 ? r.data.hours : DEFAULT_CONFIG.hours,
          settings: Object.assign({}, DEFAULT_CONFIG.settings, r.data.settings || {}),
        };
        window.dispatchEvent(new Event("zz-config"));
      }
      return current;
    });
    return loading;
  }

  const getConfig = () => current;

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

  // ── Datums en tijden ──

  // Lokale datum als YYYY-MM-DD (toISOString() rekent in UTC en geeft
  // 's avonds laat de verkeerde dag).
  function localDate(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  // ISO-weekdag: 1 = maandag, 7 = zondag.
  function isoDow(dateStr) {
    const d = new Date(dateStr + "T12:00:00").getDay();
    return d === 0 ? 7 : d;
  }

  const DAY_NAMES = ["", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];

  // [2,3,4,5,6,7] -> "dinsdag t/m zondag", [5] -> "vrijdag", [2,4] -> "dinsdag en donderdag"
  function daysText(days) {
    const ds = Array.from(new Set(days || [])).sort((a, b) => a - b);
    if (ds.length === 0) return "";
    if (ds.length === 7) return "elke dag";
    const groups = [];
    ds.forEach((d) => {
      const g = groups[groups.length - 1];
      if (g && g[1] === d - 1) g[1] = d; else groups.push([d, d]);
    });
    const parts = groups.map(([a, b]) => a === b ? DAY_NAMES[a] : b - a === 1 ? `${DAY_NAMES[a]} en ${DAY_NAMES[b]}` : `${DAY_NAMES[a]} t/m ${DAY_NAMES[b]}`);
    return parts.length === 1 ? parts[0] : parts.slice(0, -1).join(", ") + " en " + parts[parts.length - 1];
  }

  // Kan dit type op deze datum? (soort actief op die weekdag en café open)
  function dayAllowed(type, dateStr) {
    if (!type || !dateStr) return false;
    const dow = isoDow(dateStr);
    const h = current.hours.find((x) => x.isodow === dow);
    return (type.days || []).indexOf(dow) !== -1 && !(h && h.closed);
  }

  // Dagen waarop een type echt kan (rekening houdend met sluitingsdagen).
  function bookableDays(type) {
    return (type.days || []).filter((d) => {
      const h = current.hours.find((x) => x.isodow === d);
      return !(h && h.closed);
    });
  }

  const toMin = (t) => parseInt(t.slice(0, 2), 10) * 60 + parseInt(t.slice(3, 5), 10);
  const toTime = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

  // Spiegelt slots_for() in de database; alleen voor als die onbereikbaar is.
  function slotsFor(type) {
    const out = [];
    if (!type) return out;
    for (let m = toMin(type.first_slot); m <= toMin(type.last_slot); m += type.interval_min || 30) out.push(toTime(m));
    return out;
  }

  // Openingstijden in de vorm die de website toont (window.HOURS).
  function siteHours() {
    return current.hours.map((h) => ({
      day: DAY_NAMES[h.isodow].charAt(0).toUpperCase() + DAY_NAMES[h.isodow].slice(1),
      time: h.closed || !h.open_time ? "Gesloten" : `${h.open_time} – ${h.close_time || ""}`.trim(),
      closed: !!h.closed,
      note: h.note || undefined,
      special: !!h.highlight,
    }));
  }

  // Foutcode naar een zin voor de bezoeker.
  function message(code) {
    const PHONE = (window.BRAND && window.BRAND.phone) || "076 504 1134";
    switch (code) {
      case "vol": return "Dit tijdstip zit inmiddels vol. Kies een ander tijdstip.";
      case "gesloten": return "Op dit moment zijn we gesloten. Kies een andere dag of tijd.";
      case "ongeldig": return "Er klopt iets niet in de gegevens. Kijk ze nog even na.";
      case "te_veel": return `Je hebt net al een paar aanvragen gedaan. Bel ons even op ${PHONE}, dan regelen we het samen.`;
      case "niet_gevonden": return "We kunnen dit niet vinden. Klopt de link uit je mail?";
      case "geannuleerd": return "Deze reservering is al geannuleerd.";
      case "voorbij": return "Deze reservering ligt in het verleden en kan niet meer online worden geannuleerd.";
      case "al_bevestigd": return "Deze reservering was al bevestigd.";
      case "geen_toegang": return "Je bent niet (meer) ingelogd. Log opnieuw in.";
      case "ongeldig_email": return "Vul een geldig e-mailadres in.";
      case "wachtwoord_kort": return "Kies een wachtwoord van minstens 8 tekens.";
      case "jezelf": return "Je kunt jezelf niet verwijderen.";
      case "netwerk": return "Geen verbinding. Controleer je internet en probeer het opnieuw.";
      case "niet_ingesteld": return `Online reserveren is nog niet beschikbaar. Bel ons op ${PHONE}, dan zetten we je erin.`;
      default: return `Er ging iets mis. Probeer het opnieuw of bel ons op ${PHONE}.`;
    }
  }

  window.ReserveApi = {
    configured, url, key, DEFAULT_CONFIG,
    loadConfig, getConfig, availability, call, message,
    localDate, isoDow, daysText, dayAllowed, bookableDays, slotsFor, siteHours, DAY_NAMES,
  };
})();
