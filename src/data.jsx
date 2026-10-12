/* global window */
// =============================================================
// Lunchcafé Zus & Zo ,  Data
// All dishes & prices transcribed from the provided menukaarten.
// =============================================================

const BRAND = {
  name: "Lunchcafé Zus & Zo",
  address: "Raadhuisplein 37",
  postcode: "4873 BH Etten-Leur",
  phone: "076 504 1134",
  phoneHref: "tel:+31765041134",
  email: "info@lunchcafezusenzo.nl",
  emailOrder: "bestellen@lunchcafezusenzo.nl",
  instagram: "@zusenzo_ettenleur",
  instagramUrl: "https://www.instagram.com/zusenzo_ettenleur",
  facebookUrl: "#",
};

const NAV_PAGES = [
  { id: "home",      label: "Home",            num: "01" },
  { id: "lunch",     label: "Lunch",           num: "02" },
  { id: "hightea",   label: "High Moments",    num: "03" },
  { id: "bezorging", label: "Bezorgingen",     num: "04" },
  { id: "diner",     label: "Diner & Feesten", num: "05" },
  { id: "contact",   label: "Contact",         num: "06" },
];

// Terugval; de echte tijden komen uit het beheer (Openingstijden).
const HOURS = [
  { day: "Maandag",   time: "10:00 – 17:30" },
  { day: "Dinsdag",   time: "10:00 – 17:30" },
  { day: "Woensdag",  time: "10:00 – 17:30" },
  { day: "Donderdag", time: "10:00 – 17:30" },
  { day: "Vrijdag",   time: "10:00 – 21:00", note: "Diner-avond", special: true },
  { day: "Zaterdag",  time: "10:00 – 17:00" },
  { day: "Zondag",    time: "11:00 – 17:00", note: "Alleen koopzondag (laatste zondag van de maand)" },
];

// =============================================================
// LUNCH & HIGH TEA kaart (page 2)
// =============================================================
const BELEGDE_BROODJES = {
  intro: "Belegd met dagverse rauwkost. Keuze uit wit of bruin stokbrood of een Italiaanse bol.",
  items: [
    { name: "Brie", extra: "(met spek + €0,80)", desc: "met zontomaat, walnoten, rucola en honing-mosterddressing", price: "7,50" },
    { name: "Carpaccio", desc: "met zontomaat, pijnboompitjes, Parmezaanse kaas, rucola en truffelmayonaise", price: "8,50" },
    { name: "Tonijnsalade", desc: "met paprika, rode ui, kappertjes, bosui en sesamdressing", price: "7,50" },
    { name: "Gezond", desc: "met ham, kaas, ei, sla, tomaat, komkommer en cocktailsaus", price: "6,50" },
    { name: "Gerookte zalm", desc: "met oosterse dressing, bosui en wasabi-pinda crunch", price: "8,95" },
    { name: "Hete kip", desc: "pittige kip volgens Zus & Zo recept, rauwkost, mais, tomatensalsa en cocktailsaus", price: "8,95" },
    { name: "Vega club", desc: "met oude kaas, hummus, gegrilde paprika, pijnboompitjes, zontomaat, mais en rucola", price: "8,50" },
    { name: "Martino", desc: "met filet americain, ui, ei, augurk en martinosaus", price: "8,50" },
  ],
};

const SANDWICHES = {
  intro: "3-laagse sandwich. Belegd met dagverse rauwkost. Keuze uit wit of bruin sandwichbrood.",
  items: [
    { name: "Zus", desc: "met kip, spek, ei en remouladesaus", price: "8,50" },
    { name: "Zo", desc: "met kip, gerookte zalm, ei, cocktailsaus en remouladesaus", price: "9,95" },
    { name: "Beef & Bacon", desc: "met rosbief, spek en eisalade", price: "8,50" },
  ],
};

const SALADES = {
  intro: "Alle salades worden geserveerd met dagverse rauwkost, brood en kruidenboter.",
  items: [
    { name: "Carpaccio", desc: "met zontomaat, pijnboompitjes, Parmezaanse kaas, rucola, truffelmayonaise en vinaigrette", price: "9,75" },
    { name: "Geitenkaas", extra: "(met spek + €0,80)", desc: "met rode biet, geitenkaasloempia's, amandel, rucola, balsamicostroop en honing-mosterddressing", price: "8,95" },
    { name: "Zus & Zo", desc: "met gemarineerde kipfilet, mango, ei, spek, croutons, Parmezaanse kaas en honing-mosterddressing", price: "9,50" },
    { name: "Mexicaanse kip", desc: "met pittige kip volgens Zus & Zo recept, mais, paprika, nacho's, kaas, tomatensalsa en cocktailsaus", price: "9,50" },
    { name: "Oosterse zalm", desc: "met gerookte zalm, oosterse dressing, bosui en wasabi-pinda crunch", price: "9,95" },
  ],
};

const FLATBREAD = {
  intro: "Belegd met dagverse rauwkost.",
  items: [
    { name: "Vitello Tonato", desc: "met rosbief, tonijnmayonaise, zontomaat, rode ui en rucola", price: "9,95" },
    { name: "Oosterse carpaccio", desc: "met kimchi-mayonaise, zontomaat, wasabi crunch en gefrituurde noedels", price: "10,25" },
    { name: "Gerookte zalm", desc: "met roomkaas, limoendressing en dille", price: "9,50" },
  ],
};

const SAP = {
  items: [
    { name: "Kleine verse jus / smoothie", price: "3,95" },
    { name: "1 liter verse jus", price: "9,95" },
  ],
};

// =============================================================
// DINERKAART (page 4)
// =============================================================
const VOORGERECHTEN = [
  { name: "Broodplankje", desc: "met 3 smeersels", price: "7,95" },
  { name: "Tomatensoep", desc: "met stokbroodje", price: "7,25" },
  { name: "Carpaccio", desc: "met zontomaat, pijnboompitjes, truffelmayonaise, rucola, vinaigrette en Parmezaanse kaas", price: "11,25" },
  { name: "Gyoza's", extra: "3 stuks", desc: "Krokante Japanse dumplings gevuld met kip, geserveerd met Sriracha-mayonaise, bosui, paprika en sesamzaad", price: "9,95" },
  { name: "Bietencarpaccio", extra: "(met spek + €1,25)", desc: "met geitenkaas, rode ui, zongedroogde tomaat, pijnboompitjes en balsamico", price: "12,25" },
  { name: "Zalmcarpaccio", desc: "met mierikswortelmayonaise, kappertjes, rode ui, komkommer en rucola", price: "12,95" },
];

const HOOFDGERECHTEN = [
  { name: "Surf & Turf tartaarpuntjes", desc: "scampi's en diverse groenten geserveerd met chimichurri", price: "n.o." },
  { name: "Kipsaté", desc: "met satésaus en kroepoek", price: "18,95" },
  { name: "Biefstuk", desc: "met peperjus, champignonroomsaus of kruidenboter", price: "22,95" },
  { name: "Italiaanse biefstuk", desc: "met Parmezaanse kaas, zontomaat, balsamicostroop, pijnboompitjes en rucola", price: "22,95" },
  { name: "Zalm teriyaki", desc: "met diverse roerbakgroenten en sesamzaad", price: "22,95" },
  { name: "Big Zus & Zo", desc: "broodje met runderhamburger, spek, cheddar, crunch van augurk, gefrituurde uitjes en hamburgersaus", price: "18,95" },
  { name: "Mix grillspies", desc: "met peperjus, champignonroomsaus of kruidenboter", price: "19,95" },
  { name: "The Goat Classic", desc: "Geitenkaasburger met rode ui chutney, zongedroogde tomaat, rucola en walnoten", price: "17,95" },
  { name: "Loaded fries truffel", desc: "met truffelmayonaise, Parmezaanse kaas en bosui", price: "6,95" },
];

const HOOG_GERECHTEN = [
  { name: "Surf & Turf tartaarpuntjes", desc: "met diverse ingrediënten geserveerd met chimichurri", price: "19,95" },
  { name: "Pork Belly", desc: "Ons 3 courgette, zongedroogde tomaat, rucola", price: "17,95" },
  { name: "Pork Belly Burnt Ends", desc: "met BBQ-saus en coleslaw", price: "18,95" },
  { name: "Loaded fries Pork Belly", desc: "Met buikspek, kimchi-mayonaise en sesamzaad", price: "9,95" },
];

// =============================================================
// Featured offerings on the home page (with hero copy)
// =============================================================
const OFFERINGS = [
  {
    id: "lunch",
    num: "01",
    title: "Met liefde",
    titleEm: "bereid",
    body: "Van rijk belegde broodjes tot verse salades: bij Zus & Zo wordt ieder gerecht met zorg en aandacht bereid. Ook voor gluten- en lactosevrije opties hebben we een aparte kaart samengesteld.",
    image: "assets/gastvrouw-tray.png",
    alt: "Gastvrouw met een blad vol lunchgerechten",
    link: { page: "lunch", label: "Bekijk de lunchkaart" },
    layout: "left",
  },
  {
    id: "welkom",
    num: "02",
    title: "Een warm",
    titleEm: "welkom",
    body: "Met lekker eten, persoonlijke aandacht en een oprechte glimlach maken we bij Zus & Zo ieders dag graag nog een beetje mooier.",
    image: "assets/Schermafbeelding 2026-05-22 162842.png",
    alt: "Gastvrouw met koffie bij de ingang van Zus & Zo",
    layout: "right",
  },
  {
    id: "hightea",
    num: "03",
    title: "High",
    titleEm: "Moments",
    body: "Van een gezellige high tea tot een feestelijke high cocktail of smaakvolle high bites: bij Zus & Zo maken we van ieder moment iets bijzonders. Perfect om samen te proosten, bij te kletsen en te genieten.",
    image: "assets/terras-proost.png",
    alt: "Gasten proosten op het terras met een sharing board",
    link: { page: "hightea", label: "Bekijk High Moments" },
    layout: "left",
  },
];

// =============================================================
// Instagram-feed placeholders, distinct, not 4 identical squares
// =============================================================
const INSTA_POSTS = [
  { image: "assets/Schermafbeelding 2026-05-22 162801.png", label: "Borrel & Bites op het terras", url: "https://www.instagram.com/p/DYmrnl9Nt-e/" },
  { image: "assets/Schermafbeelding 2026-05-22 162823.png", label: "Team Koningsdag",              url: "https://www.instagram.com/p/DXoUvYPjXgz/" },
  { image: "assets/Schermafbeelding 2026-05-22 162842.png", label: "Kom genieten",                 url: "https://www.instagram.com/p/DWEGxU_jcrm/" },
  { image: "assets/Schermafbeelding 2026-05-22 162856.png", label: "High Bites & cocktails",       url: "https://www.instagram.com/p/DVYbuAgDYHz/" },
  { image: "assets/Schermafbeelding 2026-05-22 162905.png", label: "Kerst bij Zus & Zo",           url: "https://www.instagram.com/p/DSpoFiuDbTD/" },
  { image: "assets/Schermafbeelding 2026-05-22 162916.png", label: "Sfeer op het terras",          url: "https://www.instagram.com/p/DKebgUOt1bo/" },
];

Object.assign(window, {
  BRAND, NAV_PAGES, HOURS,
  BELEGDE_BROODJES, SANDWICHES, SALADES, FLATBREAD, SAP,
  VOORGERECHTEN, HOOFDGERECHTEN, HOOG_GERECHTEN,
  OFFERINGS, INSTA_POSTS,
});
