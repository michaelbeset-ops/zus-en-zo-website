/* global window */
// =============================================================
// Koppeling met Supabase (reserveringssysteem)
// =============================================================
// Invullen na het aanmaken van het Supabase-project, zie RESERVERINGEN.md.
// Supabase, Project Settings, API:
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
