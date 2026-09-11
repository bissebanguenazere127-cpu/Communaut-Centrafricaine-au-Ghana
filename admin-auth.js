(() => {
  'use strict';

  const config = window.supabaseConfig;
  if (!config?.isConfigured || !window.supabase?.createClient) {
    window.location.replace('login.html?error=config');
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.ccgSupabase = client;

  const protectDashboard = async () => {
    const { data: { session } } = await client.auth.getSession();
    if (!session) {
      window.location.replace('login.html');
      return;
    }

    const { data: isAdmin, error } = await client.rpc('is_ccg_admin');
    if (error || isAdmin !== true) {
      await client.auth.signOut();
      window.location.replace('login.html?error=unauthorized');
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const logout = document.querySelector('.logout-link');
    logout?.addEventListener('click', async event => {
      event.preventDefault();
      if (!window.confirm('Voulez-vous vraiment vous déconnecter ?')) return;
      await client.auth.signOut();
      window.location.replace('login.html');
    });
  });

  protectDashboard();
})();
