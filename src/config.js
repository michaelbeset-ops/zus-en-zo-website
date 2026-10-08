/* global window */
// =============================================================
// Koppeling met Supabase (reserveringssysteem)
// =============================================================
// Wordt automatisch ingevuld door: node installeer/installeer.mjs
// (zie RESERVERINGEN.md). Handmatig kan ook, uit Supabase, Project
// Settings, API:
//   supabaseUrl      "Project URL", bijv. https://abcdefgh.supabase.co
//   supabaseAnonKey  de "anon public" (of "publishable") key
//
// Deze sleutel is bedoeld om openbaar in de website te staan: bezoekers
// kunnen er alleen beschikbaarheid mee opvragen. Lezen en wijzigen van
// reserveringen is afgeschermd in de database (zie supabase/schema.sql).
// Zet hier NOOIT de service_role- of secret-key neer.
window.RESERVERING_CONFIG = {
  supabaseUrl: "",
  supabaseAnonKey: "",
};
