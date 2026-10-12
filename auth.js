(() => {
  "use strict";

  const message = document.getElementById("auth-message");
  const loginForm = document.getElementById("login-form");

  const showMessage = (text, success = false) => {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle("success", success);
  };

  const setSubmitting = (busy) => {
    const button = loginForm?.querySelector("button[type=submit]");
    if (button) button.disabled = busy;
  };

  async function redirectIfAlreadySignedIn() {
    if (!loginForm) return;
    try {
      const response = await fetch("/api/auth/session", { credentials: "same-origin" });
      if (response.ok) window.location.replace("admi.html");
    } catch (_) {
      showMessage("Le serveur d’administration est indisponible.");
    }
  }

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = loginForm.email.value.trim().toLowerCase();
    const password = loginForm.password.value;
    setSubmitting(true);
    showMessage("Connexion en cours...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        showMessage(result.error || "Adresse e-mail ou mot de passe incorrect.");
        return;
      }
      window.location.replace("admi.html");
    } catch (_) {
      showMessage("Le serveur d’administration est momentanément indisponible. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  });

  redirectIfAlreadySignedIn();
})();
