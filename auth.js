(() => {
  'use strict';

  const config = window.supabaseConfig;
  const message = document.querySelector('#auth-message');
  const showMessage = (text, success = false) => {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle('success', success);
  };

  if (!config?.isConfigured || !window.supabase?.createClient) {
    showMessage('La connexion n’est pas encore configurée. Ajoutez l’URL du projet et la clé publiable dans supabsae-config.js.');
    return;
  }

  const client = window.supabase.createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  const setBusy = (form, busy) => {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = busy;
  };

  const ensureAdminThenRedirect = async () => {
    const { data: isAdmin, error } = await client.rpc('is_ccg_admin');
    if (error || isAdmin !== true) {
      await client.auth.signOut();
      showMessage('Ce compte n’est pas autorisé à accéder à l’administration.');
      return;
    }
    window.location.replace('admi.html');
  };

  const loginForm = document.querySelector('#login-form');
  if (loginForm) {
    client.auth.getSession().then(({ data: { session } }) => {
      if (session) ensureAdminThenRedirect();
    });
    loginForm.addEventListener('submit', async event => {
      event.preventDefault();
      setBusy(loginForm, true);
      showMessage('');
      const email = loginForm.elements.email.value.trim();
      const password = loginForm.elements.password.value;
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) showMessage('Connexion impossible. Vérifiez vos identifiants.');
      else await ensureAdminThenRedirect();
      setBusy(loginForm, false);
    });

    const queryError = new URLSearchParams(window.location.search).get('error');
    if (queryError === 'unauthorized') showMessage('Votre compte ne dispose pas des droits administrateur.');
    if (queryError === 'config') showMessage('La connexion doit être configurée avant d’accéder au tableau de bord.');
  }

  const requestForm = document.querySelector('#reset-request-form');
  const updateForm = document.querySelector('#reset-update-form');
  const resetIntro = document.querySelector('#reset-intro');
  const showUpdatePassword = () => {
    requestForm.hidden = true;
    updateForm.hidden = false;
    resetIntro.textContent = 'Choisissez un nouveau mot de passe de 12 caractères ou plus.';
  };

  if (requestForm) {
    client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') showUpdatePassword();
    });
    requestForm.addEventListener('submit', async event => {
      event.preventDefault();
      setBusy(requestForm, true);
      const email = requestForm.elements.email.value.trim();
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${window.location.pathname}`
      });
      showMessage(error ? 'La demande n’a pas pu être envoyée. Réessayez plus tard.' : 'Si cette adresse est enregistrée, un lien de réinitialisation vient d’être envoyé.', !error);
      setBusy(requestForm, false);
    });
    updateForm.addEventListener('submit', async event => {
      event.preventDefault();
      setBusy(updateForm, true);
      const password = updateForm.elements['new-password'].value;
      const { error } = await client.auth.updateUser({ password });
      if (error) showMessage('Le mot de passe n’a pas pu être mis à jour. Demandez un nouveau lien.');
      else {
        showMessage('Mot de passe mis à jour. Redirection vers la connexion…', true);
        await client.auth.signOut();
        window.setTimeout(() => window.location.replace('login.html'), 1200);
      }
      setBusy(updateForm, false);
    });
  }
})();
