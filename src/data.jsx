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

Object.assign(window, {
  BRAND, NAV_PAGES, HOURS,
  OFFERINGS, INSTA_POSTS,
});
