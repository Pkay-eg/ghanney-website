// =========================================================
// Supabase configuration
// Replace these two values with your own from the Supabase dashboard:
//   Project Settings → API → Project URL  &  anon public key
// =========================================================
window.__SUPABASE_URL = "https://pbrqvidpybpkkxuvchic.supabase.co";
window.__SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBicnF2aWRweWJwa2t4dXZjaGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NjY0MTUsImV4cCI6MjA5NTQ0MjQxNX0.rTOUfSI9hY_DKvIOHcJgvlOzNw2stHTpO4AqLTpwQvA";

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
