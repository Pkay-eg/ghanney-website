// =========================================================
// Supabase configuration
// Replace these two values with your own from the Supabase dashboard:
//   Project Settings → API → Project URL  &  anon public key
// =========================================================
window.__SUPABASE_URL = "REPLACE_WITH_YOUR_PROJECT_URL";
window.__SUPABASE_ANON_KEY = "REPLACE_WITH_YOUR_ANON_KEY";

try {
  if (window.supabase && window.__SUPABASE_URL && !window.__SUPABASE_URL.startsWith("REPLACE")) {
    window.__supabase = window.supabase.createClient(
      window.__SUPABASE_URL,
      window.__SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: "ghanney_portal_session",
        },
      }
    );
  } else {
    console.warn("[ghanney portal] Supabase not configured — running in offline/demo mode.");
  }
} catch (e) {
  console.error("[ghanney portal] Supabase client init failed:", e);
}
