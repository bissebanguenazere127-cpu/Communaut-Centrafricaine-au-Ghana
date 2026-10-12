// Public Supabase values only. Never put a service_role key in this file.
window.supabaseConfig = {
  url: "https://tjofpmjnshdqgdzdgfqr.supabase.co",
  // Replace this with the new project's Publishable key (sb_publishable_...).
  // This key is safe in public JavaScript; the Secret key must stay in .env.
  anonKey: "sb_publishable_9Gs5Zn5hY1Lhc91amUcBzg_duAEoLUz",
};

window.supabaseConfig.isConfigured = Boolean(
  window.supabaseConfig.url &&
  !window.supabaseConfig.url.includes("YOUR_PROJECT_REF") &&
  window.supabaseConfig.anonKey &&
  !window.supabaseConfig.anonKey.startsWith("YOUR_")
);
