window.supabaseConfig = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_ANON_KEY"
};

window.supabase = window.supabase || null;

window.supabaseConfig.isConfigured = Boolean(
  window.supabaseConfig.url &&
  !window.supabaseConfig.url.includes("YOUR_PROJECT_REF") &&
  window.supabaseConfig.anonKey &&
  window.supabaseConfig.anonKey !== "YOUR_ANON_KEY"
);

url: "https://vsbvkgnxgnltkghjrcvg.supabase.co/rest/v1/"
anonKey: "vsbvkgnxgnltkghjrcvg"