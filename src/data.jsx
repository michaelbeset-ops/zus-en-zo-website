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

// Google-reviews, letterlijk overgenomen van het Google-profiel (november 2026).
// Alleen reviews die daar volledig te lezen zijn. Met een Google Places-sleutel
// komen score en reviews live van Google en wordt dit overschreven.
const GOOGLE_REVIEWS = {
  rating: 4.4,
  count: 480,
  url: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Lunchcafé Zus & Zo, Raadhuisplein 37, Etten-Leur"),
  reviews: [
    { author: "Adrie J.", text: "Kennismaking met deze eetgelegenheid was een prettige en positieve ervaring. Heerlijke broodjes en andere gerechten. De menukaart is overduidelijk met grote zorg en passie samengesteld." },
    { author: "Fam. Maas", text: "Erg leuk om te lunchen. Prettige medewerkers. Prijs/kwaliteitsniveau is erg goed" },
    { author: "Sonny F.", text: "Het eten was wederom heerlijk. De bediening was goed en vriendelijk. Een goede aanrader." },
    { author: "Joost B.", text: "Heerlijk buiten gegeten, zeer vriendelijke bediening. Topper." },
    { author: "Thijs v.d. H.", text: "Prima kunnen lunchen, vriendelijk personeel en heerlijk eten!" },
    { author: "Tobias K.", text: "Lunchcafé Zus & Zo is een gezellige, gemoedelijk eetcafé. Voor een intieme lunch met z'n tweeën of grote groepen." },
  ],
};

Object.assign(window, {
  GOOGLE_REVIEWS,
  BRAND, NAV_PAGES, HOURS,
  OFFERINGS, INSTA_POSTS,
});
