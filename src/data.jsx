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
  { id: "home",     label: "Home",            num: "01" },
  { id: "lunch",    label: "Lunch & Menu",    num: "02" },
  { id: "hightea",  label: "High Tea",        num: "03" },
  { id: "diner",    label: "Diner & Feesten", num: "04" },
  { id: "contact",  label: "Contact",         num: "05" },
];

const HOURS = [
  { day: "Maandag",   time: "Gesloten", closed: true },
  { day: "Dinsdag",   time: "09:00 – 17:00" },
  { day: "Woensdag",  time: "09:00 – 17:00" },
  { day: "Donderdag", time: "09:00 – 17:00" },
  { day: "Vrijdag",   time: "09:00 – 22:00", note: "Diner-avond", special: true },
  { day: "Zaterdag",  time: "09:00 – 17:00" },
  { day: "Zondag",    time: "10:00 – 16:00" },
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
    eyebrow: "Dagelijks van 9 tot 17",
    title: "Lunch",
    titleEm: "om langer voor te blijven zitten",
    body: "Belegde broodjes, sandwiches, salades en flatbreads, alles met dagverse rauwkost. Vraag gerust naar onze glutenvrije of lactosevrije kaart, daar denken we aan mee.",
    meta: ["Belegde broodjes", "Salades", "Flatbreads"],
    layout: "left", // image left
  },
  {
    id: "hightea",
    num: "02",
    eyebrow: "Op reservering · 3 gangen",
    title: "High Tea",
    titleEm: "met etagère & verse thee",
    body: "Een middag plat genieten met zoet, hartig en eindeloos veel thee. Geknipt voor verjaardagen, een vrijdagmiddag met je moeder, of gewoon omdat het kan.",
    meta: ["3 gangen", "Vanaf 2 personen", "Reservering"],
    layout: "right", // image right
  },
  {
    id: "diner",
    num: "03",
    eyebrow: "Alleen op vrijdagavond",
    title: "Vrijdagavond Diner",
    titleEm: "we trekken alles uit de kast",
    body: "Eén avond in de week schakelen we 's avonds door. Voorgerechten, hooggerechten, een 3-gangen keuzemenu of onze High Bites om te delen, gemoedelijk, met een wijntje erbij.",
    meta: ["3 gangen €32,95", "High Bites €24,95", "Vrijdag t/m 22:00"],
    layout: "left",
    dark: true,
  },
  {
    id: "feesten",
    num: "04",
    eyebrow: "Op afspraak",
    title: "Feesten & Bedrijven",
    titleEm: "wij koken, jullie kletsen",
    body: "Verjaardagen, bruiloften, personeelsuitjes of een Brabantse koffietafel. Ook bezorgen we lunch en vergaderpakketten bij bedrijven in Etten-Leur, ma t/m vr.",
    meta: ["Besloten", "Buffet warm/koud", "Bezorging"],
    layout: "right",
  },
];

// =============================================================
// Instagram-feed placeholders, distinct, not 4 identical squares
// =============================================================
const INSTA_POSTS = [
  { image: "assets/insta-cocktails.jpg",        label: "Borrel & Bites op het terras",   url: "https://www.instagram.com/p/DYmrnl9Nt-e/" },
  { image: "assets/insta-team-koningsdag.jpg",  label: "Team Koningsdag",                url: "https://www.instagram.com/p/DXoUvYPjXgz/" },
  { image: "assets/insta-gastvrouw-bord.jpg",   label: "Kom genieten",                   url: "https://www.instagram.com/p/DWEGxU_jcrm/" },
  { image: "assets/insta-high-bites.jpg",       label: "High Bites & cocktails",         url: "https://www.instagram.com/p/DVYbuAgDYHz/" },
  { image: "assets/insta-kerst.jpg",            label: "Kerst bij Zus & Zo",             url: "https://www.instagram.com/p/DSpoFiuDbTD/" },
  { image: null,                                label: "Sfeer op het terras",            url: "https://www.instagram.com/p/DKebgUOt1bo/" },
];

Object.assign(window, {
  BRAND, NAV_PAGES, HOURS,
  BELEGDE_BROODJES, SANDWICHES, SALADES, FLATBREAD, SAP,
  VOORGERECHTEN, HOOFDGERECHTEN, HOOG_GERECHTEN,
  OFFERINGS, INSTA_POSTS,
});
