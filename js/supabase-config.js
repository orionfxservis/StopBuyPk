// Supabase configuration for OrionFx
const SUPABASE_URL = "https://aywuxnimzuqmocjccvbv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rnxMaJuE7KAjchYt3VN53Q_lYuJQpW7";

// Initialize Supabase Client
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
