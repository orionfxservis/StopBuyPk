// js/supabase.js

const supabaseUrl = "https://qmfcveywsavujcuoygng.supabase.co/rest/v1/";
const supabaseKey = "sb_publishable_q9tutF2DgPmgKvim8QvxPA_3nQhYRcG";

const supabase = window.supabase.createClient(
    supabaseUrl,
    supabaseKey
);