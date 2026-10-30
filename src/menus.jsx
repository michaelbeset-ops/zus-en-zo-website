/* global window */
// =============================================================
// Menukaarten, overgenomen uit de pdf's van het café:
//   Zomerkaart 2026 (lunch), Bezorgkaart winter 25/26, Dinerkaart zomer 2026.
// Nieuwe kaart? Pas alleen dit bestand aan.
// veg: true = vegetarisch (groene V op de kaart).
// =============================================================

const LUNCHKAART = [
  {
    title: "Belegde broodjes",
    intro: "Wit of bruin stokbrood, waldkorn of een focaccia. Belegd met dagverse rauwkost.",
    items: [
      { name: "Carpaccio", desc: "met zontomaat, pittenmelange, Parmezaanse kaas, rucola, truffelkroepoek en truffelmayonaise", price: "12,50" },
      { name: "Oosterse carpaccio", desc: "met wasabi crunch, bosui, rode curry kroepoek en kimchimayonaise", price: "12,95" },
      { name: "Tonijnsalade", desc: "met paprika, rode ui, bosui en sesamdressing", price: "10,75" },
      { name: "Gezond", veg: true, desc: "met ham, kaas, ei, sla, maïs, paprika, tomaat, komkommer, ui en cocktailsaus", price: "11,25" },
      { name: "Brioche zalm", desc: "belegd met gerookte zalm, guacamole, gebakken ei, rode ui, komkommer, rucola en een topping van furikake", price: "14,50" },
      { name: "Rosbief", desc: "met radijs, zoetzure komkommer, bieslook, tomaatjes, zwarte kroepoek en mierikswortelmayonaise", price: "13,50" },
      { name: "Eiersalade", veg: true, extra: "(met rauwe ham + €1,95)", desc: "met bosui en truffelmayonaise", price: "9,95" },
    ],
  },
  {
    title: "Sandwiches (3-laags)",
    intro: "Wit of bruin sandwichbrood. Belegd met dagverse rauwkost.",
    items: [
      { name: "Zus", desc: "met kip, spek, ei en remouladesaus", price: "14,25" },
      { name: "Zo", desc: "met kip, gerookte zalm, ei, cocktailsaus en remouladesaus", price: "15,75" },
      { name: "Tex Mex", desc: "met pittige roomkaas, guacamole, kip, ui, paprika, nacho's en cheddar", price: "14,25" },
      { name: "Healthy sandwich", veg: true, extra: "(met rosbief + €2,00)", desc: "met hoemoes, zongedroogde tomaat, gegrilde groenten, oude kaas en pittenmelange, geserveerd met groentechips", price: "14,25" },
    ],
  },
  {
    title: "Soepen en specials",
    items: [
      { name: "Tomatensoep", veg: true, desc: "met basilicumolie en briochebrood", price: "7,25" },
      { name: "Special Zus", desc: "tomatensoep, een stokbroodje met kroket en een brioche met gebakken ei en gesmolten kaas", price: "14,95" },
      { name: "Special Zo", desc: "sandwich met tonijn, een stokbroodje met garnalenkroket en een brioche met gebakken ei, gerookte zalm en mierikswortelmayonaise", price: "16,95" },
      { name: "Special Vega", veg: true, desc: "tomatensoep, een stokbroodje met kaaskroket en een brioche met gebakken ei en gesmolten kaas", price: "14,95" },
    ],
  },
  {
    title: "Eiergerechten (omelet of uitsmijter)",
    intro: "Wit, bruin of briochebrood.",
    items: [
      { name: "Naturel", price: "9,50" },
      { name: "Extra ingrediënt", desc: "keuze uit kaas, ham of spek", price: "+ 1,50" },
      { name: "Uitsmijter deluxe", desc: "rosbief, pittenmelange, Parmezaanse kaas, rucola en truffelmayonaise", price: "15,95" },
      { name: "Uitsmijter zalm", desc: "gerookte zalm, rode ui, rucola en mierikswortelmayonaise", price: "16,75" },
    ],
  },
  {
    title: "Ambachtelijke kroketten (2 stuks)",
    intro: "Op wit of bruin stokbrood, focaccia of waldkorn.",
    items: [
      { name: "Rundvlees", price: "12,50" },
      { name: "Garnaal", price: "13,95" },
      { name: "Kaas", veg: true, price: "12,95" },
    ],
  },
  {
    title: "Salades",
    intro: "Geserveerd met stokbrood en kruidenboter.",
    items: [
      { name: "Carpaccio", desc: "met zontomaat, pittenmelange, Parmezaanse kaas, rucola en truffelmayonaise", price: "16,95" },
      { name: "Geitenkaas", veg: true, extra: "(met spek + €1,50)", desc: "met frambozendressing, warme geitenkaas op notenbrood, walnoten, rucola, rode biet, zontomaat en balsamicostroop", price: "15,95" },
      { name: "Salade Zus & Zo", desc: "met krokante kip, ei, spek, croutons, Parmezaanse kaas en honingmosterddressing", price: "16,50" },
      { name: "Mexicaanse kip", desc: "met pittige kip volgens Zus & Zo recept, maïs, paprika, nacho's, kaas en tomatensalsa", price: "15,95" },
      { name: "Salade vis", extra: "(met 3 gefrituurde garnalen + €2,95)", desc: "met gerookte zalm en tonijnsalade, rode ui, gefrituurde kappertjes, kroepoek en citroen-dilledressing", price: "18,50" },
      { name: "Salade kipgyoza", desc: "met rode ui, radijs, cherrytomaatjes, zoetzure komkommer, sesamzaadjes en sesamdressing, geserveerd met crispy chili-olie", price: "16,95" },
    ],
  },
  {
    title: "Warme lunch specialiteiten",
    intro: "Wit of bruin stokbrood, focaccia of waldkorn. Belegd met dagverse rauwkost.",
    items: [
      { name: "Geitenkaas", veg: true, extra: "(met spek + €1,50)", desc: "met frambozendressing, walnoten, rode biet, rucola, zontomaat en balsamicostroop", price: "13,95" },
      { name: "Wrap crispy chicken", desc: "met krokante kip, paprika en kimchimayonaise", price: "12,50" },
      { name: "Hete kip", desc: "met pittige kip volgens Zus & Zo recept, maïs, tomatensalsa en cocktailsaus", price: "13,95" },
      { name: "Big Zus & Zo burger", desc: "met spek, cheddar, gefrituurde uitjes, crunch van augurk en hamburgersaus. Geserveerd met een mandje friet", price: "18,95" },
      { name: "Broodje steak", desc: "met gebakken ui, champignon, cherrytomaat, cheddar, rucola en chimichurrimayonaise", price: "18,95" },
      { name: "Pork belly burnt ends", desc: "malse, langzaam gegaarde buikspek met coleslaw, gefrituurde uitjes en BBQ-saus", price: "18,50" },
      { name: "Warme brie", extra: "(met rauwe ham + €1,75)", desc: "met vijgenchutney, walnoten, rode ui, zontomaat en balsamico", price: "13,95" },
    ],
  },
  {
    title: "Lunchplank",
    items: [
      { name: "Lunchplank", extra: "p.p.", desc: "Een mix van diverse lunchgerechtjes: tomatensoep met basilicumolie, stokbroodje met mini-kroketje, mini-croissant met warme brie en balsamico, broodje eiersalade met truffelmayonaise, brioche met zalm en roomkaas en een rustieke kipsalade met Parmezaanse kaas, eitje en croutons", price: "18,50" },
    ],
  },
  {
    title: "Stokbroodjes en tosti's",
    items: [
      { name: "Kaas", veg: true, price: "7,50" },
      { name: "Ham en kaas", price: "7,95" },
      { name: "Ham, kaas en ananas", price: "8,50" },
      { name: "Kip, kaas en spek", price: "8,95" },
      { name: "Extra ingrediënt", price: "+ 1,25" },
    ],
  },
  {
    title: "American pancakes (3 stuks)",
    items: [
      { name: "Kaas", veg: true, price: "8,95" },
      { name: "Ham en kaas", price: "9,25" },
      { name: "Ham, kaas en ananas", price: "9,75" },
      { name: "Kaas en spek", price: "10,50" },
    ],
  },
  {
    title: "Kindergerechten",
    items: [
      { name: "Boterham", desc: "met ham, kaas of divers zoet beleg", price: "3,95" },
      { name: "Tosti kaas of ham/kaas", price: "vanaf 6,50" },
      { name: "Sandwich Zus", price: "9,25" },
      { name: "Sandwich gezond", price: "8,50" },
      { name: "2 pancakes", desc: "met marshmallows en stroop", price: "7,50" },
      { name: "Friet met snack", desc: "kroket, frikandel of kipnuggets", price: "8,95" },
      { name: "Broodje met snack", desc: "kroket of frikandel", price: "5,95" },
    ],
  },
  {
    title: "Desserts",
    intro: "Al onze desserts zijn uit te breiden met een bol vanille-ijs!",
    items: [
      { name: "Brownie", desc: "met karamelsaus, karamelblokjes en slagroom", price: "5,25" },
      { name: "Frambozenmeringue", desc: "met vruchtensaus en slagroom", price: "6,95" },
      { name: "Warme appeltaart", desc: "met karamelsaus en slagroom", price: "4,25" },
      { name: "Dame blanche", desc: "met 2 bollen vanille-ijs, chocoladesaus en slagroom", price: "6,95" },
      { name: "Cherry crunch", desc: "met vanille-ijs, kersen, speculoos, crunch en slagroom", price: "7,50" },
      { name: "Kinderijsje", desc: "vanille-ijs met snoepjes en een hoorntje", price: "3,50" },
      { name: "Dessertproeverij", extra: "p.p.", desc: "Een echte verwennerij op een plankje, met onder andere brownie, macaron, ijs en andere zoete lekkernijen", price: "12,95" },
    ],
  },
];

// Bezorg- en afhaalkaart (zelfde kaart)
const BEZORGKAART = [
  {
    title: "Belegde broodjes",
    intro: "Wit of bruin stokbrood, waldkorn of een focaccia. Belegd met dagverse rauwkost.",
    items: [
      { name: "Carpaccio", desc: "met zontomaat, pittenmelange, Parmezaanse kaas, rucola, truffelkroepoek en truffelmayonaise", price: "11,50" },
      { name: "Oosterse carpaccio", desc: "met kimchimayonaise, wasabi crunch, bosui, sesamzaad en wasabikroepoek", price: "11,95" },
      { name: "Tonijnsalade", desc: "met paprika, rode ui, bosui en rucola", price: "9,95" },
      { name: "Eiersalade", veg: true, extra: "(met rauwe ham + €1,95)", desc: "met truffelmayonaise en bosui", price: "8,95" },
      { name: "Broodje rosbief", desc: "met radijs, tomaatjes, zoetzure komkommer en mierikswortelmayonaise", price: "11,95" },
      { name: "Gerookte zalm", desc: "met guacamole, rode ui, komkommer, rucola, gekookt ei en een topping van furikake", price: "11,95" },
      { name: "Brie", extra: "(met rauwe ham + €1,95)", desc: "met vijgencompote, rode ui, zontomaat, gesuikerde walnoten en balsamicostroop", price: "10,50" },
    ],
  },
  {
    title: "Salades",
    intro: "Geserveerd met brood en kruidenboter.",
    items: [
      { name: "Carpaccio", extra: "(oosterse variant €13,95)", desc: "met zontomaat, pittenmelange, Parmezaanse kaas, rucola, truffelkroepoek en truffelmayonaise", price: "13,50" },
      { name: "Geitenkaas", veg: true, extra: "(met spek + €1,50)", desc: "met frambozendressing, warme geitenkaas op notenbrood, gesuikerde walnoten, rucola, zontomaat, rode bietjes en balsamicostroop", price: "13,50" },
      { name: "Salade Zus & Zo", desc: "met krokante kip, ei, spek, croutons, Parmezaanse kaas en honingmosterddressing", price: "13,95" },
      { name: "Mexicaanse kip", desc: "met pittige kip volgens Zus & Zo recept, maïs, paprika, nacho's, kaas en tomatensalsa", price: "13,95" },
      { name: "Salade vis", extra: "(met 3 gefrituurde garnalen + €2,50)", desc: "met gerookte zalm, tonijnsalade, rode ui, gefrituurde kappertjes, ei, wasabikroepoek en citroen-dilledressing", price: "14,50" },
      { name: "Salade kipgyoza", desc: "met rode ui, radijs, cherrytomaat, zoetzure komkommer, sesamdressing en crispy chili-olie", price: "13,50" },
    ],
  },
  {
    title: "Sandwiches (3-laags)",
    intro: "Wit of bruin sandwichbrood. Belegd met dagverse rauwkost.",
    items: [
      { name: "Sandwich Zus", desc: "met kip, spek, ei en remouladesaus", price: "12,25" },
      { name: "Sandwich Zo", desc: "met kip, gerookte zalm, ei, cocktailsaus en remouladesaus", price: "13,75" },
      { name: "Tex Mex sandwich", desc: "met pittige roomkaas, guacamole, kip, ui, paprika, nacho's en cheddar", price: "12,95" },
      { name: "Healthy sandwich", veg: true, extra: "(met rosbief + €2,00)", desc: "met hoemoes, zongedroogde tomaat, gegrilde groenten en pittenmelange, geserveerd met groentechips", price: "12,25" },
    ],
  },
  {
    title: "Warme lunch specialiteiten",
    intro: "Wit of bruin stokbrood of een meergranenbol.",
    items: [
      { name: "Wrap crispy chicken", desc: "met krokante kip, paprika en kimchimayonaise", price: "10,50" },
      { name: "Hete kip", desc: "met pittige kip volgens Zus & Zo recept, maïs, tomatensalsa en cocktailsaus", price: "12,95" },
    ],
  },
];

const VERGADERPAKKETTEN = [
  {
    title: "Vergaderpakketten",
    items: [
      { name: "Vergaderpakket 1", desc: "1 zacht broodje met ham of kaas, 1 baguette met divers beleg (o.a. eiersalade, gezond, roomkaas, tonijnsalade, oude kaas) en 1 stuk fruit", price: "10,95" },
      { name: "Vergaderpakket 2", desc: "1 baguette met divers beleg (o.a. eiersalade, gezond, roomkaas, tonijnsalade, oude kaas), 1/2 sandwich met divers beleg (o.a. zalm, Zus, carpaccio, truffel deluxe), 1 bladerdeeggebakje en 1 stuk fruit", price: "14,95" },
    ],
  },
  {
    title: "Assortiment broodjes op schaal",
    intro: "Wij adviseren 1½ broodje of sandwich per persoon.",
    items: [
      { name: "Categorie 1", desc: "jonge kaas, ham", price: "6,95" },
      { name: "Categorie 2", desc: "tonijnsalade, filet americain, eiersalade, roomkaas, kipsalade, gezond, hoemoes", price: "7,95" },
      { name: "Categorie 3", desc: "carpaccio, brie, gerookte zalm, rauwe ham", price: "9,50" },
      { name: "Categorie 4: 2-laags sandwiches", desc: "Zus, Zo, Tex Mex, healthy, tonijn", price: "9,95" },
      { name: "Categorie 5: wraps", desc: "zalm-roomkaas of oosterse carpaccio", price: "9,95" },
    ],
  },
  {
    title: "De lunch verder uitbreiden",
    items: [
      { name: "Pak melk", price: "3,95" },
      { name: "Flesje verse jus d'orange", price: "3,50" },
      { name: "Liter verse jus d'orange", price: "9,95" },
      { name: "Flesje smoothie", price: "4,95" },
      { name: "Liter pak jus d'orange", price: "5,50" },
      { name: "Tomatensoep", veg: true, desc: "geserveerd met brood", price: "6,95" },
      { name: "Vers fruit", desc: "o.a. appel, sinaasappel en druiven", price: "1,00" },
      { name: "High tea to go", desc: "Een compleet verzorgde high tea met diverse hartige en zoete lekkernijen, inclusief theesmaakjes", price: "24,95" },
    ],
  },
];

const DINERKAART = [
  {
    title: "Voorgerechten",
    items: [
      { name: "Broodplankje", veg: true, desc: "met 3 smeersels", price: "7,95" },
      { name: "Tomatensoep", veg: true, desc: "met stokbroodje", price: "7,25" },
      { name: "Carpaccio", desc: "met zontomaat, pittenmelange, truffelmayonaise, rucola, vinaigrette en Parmezaanse kaas", price: "11,25" },
      { name: "Gyoza's (3 stuks)", desc: "krokante Japanse dumplings gevuld met kip, geserveerd met sriracha-mayonaise, bosui, paprika en sesamzaad", price: "9,95" },
      { name: "Bietencarpaccio", veg: true, extra: "(met spek + €1,25)", desc: "met geitenkaas, walnoot, tomaat, frambozendressing en balsamico", price: "12,25" },
      { name: "Zalmcarpaccio", desc: "met mierikswortelmayonaise, kappertjes, rode ui, komkommer en rucola", price: "12,95" },
    ],
  },
  {
    title: "Warme gerechten",
    intro: "Alle gerechten worden geserveerd met friet met mayonaise, groenten en/of salade.",
    items: [
      { name: "Kipsaté", desc: "met satésaus en kroepoek", price: "18,95" },
      { name: "Biefstuk", desc: "met peperjus, champignonroomsaus of kruidenboter", price: "22,95" },
      { name: "Italiaanse biefstuk", desc: "met Parmezaanse kaas, zontomaat, balsamicostroop, pitjes en rucola", price: "23,95" },
      { name: "Zalm teriyaki", desc: "met diverse roerbakgroenten en sesamzaad", price: "22,95" },
      { name: "Big Zus & Zo", desc: "bol met runderhamburger, spek, cheddar, crunch van augurk, gefrituurde uitjes en hamburgersaus", price: "18,95" },
      { name: "Mix grillspies", desc: "met peperjus, champignonroomsaus of kruidenboter", price: "21,95" },
      { name: "The goat classic", veg: true, desc: "geitenkaasburger met rode-uichutney, zontomaat, rucola en walnoten", price: "17,95" },
      { name: "Surf & turf", desc: "biefstukpuntjes, scampi's en diverse groenten, geserveerd met chimichurri", price: "21,95" },
      { name: "Franse burger", desc: "bol met runderhamburger, spek, brie, rucola, walnoten en vijgenchutney", price: "19,95" },
      { name: "Pork belly burnt ends", desc: "buikspek met BBQ-saus en coleslaw", price: "20,95" },
    ],
  },
  {
    title: "Erbij",
    items: [
      { name: "Loaded fries pork belly", desc: "met buikspek, kimchimayonaise en sesamzaad", price: "9,95" },
      { name: "Loaded fries truffel", veg: true, desc: "met truffelmayonaise, Parmezaanse kaas en bosui", price: "6,95" },
    ],
  },
  {
    title: "Desserts",
    items: [
      { name: "Brownie", desc: "met karamelsaus en karamelfudge", price: "5,25" },
      { name: "Frambozenmeringue", price: "6,95" },
      { name: "Coupe advocaat", desc: "met 2 bollen vanille-ijs, advocaat en slagroom", price: "7,95" },
      { name: "Dame blanche", desc: "met 2 bollen vanille-ijs, chocoladesaus en slagroom", price: "6,95" },
      { name: "Kinderijsje", desc: "vanille-ijs met smarties en een hoorntje", price: "3,50" },
      { name: "Cherry crunch", desc: "met vanille-ijs, kersen, speculoos, crunch en slagroom", price: "7,50" },
      { name: "Dessert van de chef", desc: "wisselende ijscoupe met ijs van Prego", price: "8,95" },
      { name: "Bonbon van Bonbonnerie Van der Linden", desc: "diverse smaken", price: "1,25" },
    ],
  },
  {
    title: "Kindergerechten",
    intro: "Met keuze uit appelmoes, ketchup, curry of mayonaise.",
    items: [
      { name: "Kipnuggets (5 stuks)", desc: "met saus en friet", price: "8,95" },
      { name: "Crispy chicken (3 stuks)", desc: "met saus en friet", price: "9,50" },
      { name: "Kroket of frikandel", desc: "met saus en friet", price: "8,95" },
    ],
  },
  {
    title: "Luxe koffie",
    items: [
      { name: "Irish coffee", desc: "Jameson, suiker en slagroom", price: "8,75" },
      { name: "Spanish coffee", desc: "Licor 43 en slagroom", price: "8,75" },
      { name: "French coffee", desc: "Grand Marnier en slagroom", price: "8,75" },
      { name: "Italian coffee", desc: "Amaretto en slagroom", price: "8,75" },
      { name: "Afrikaanse koffie", desc: "Amarula en slagroom", price: "8,75" },
    ],
  },
];

Object.assign(window, { LUNCHKAART, BEZORGKAART, VERGADERPAKKETTEN, DINERKAART });
