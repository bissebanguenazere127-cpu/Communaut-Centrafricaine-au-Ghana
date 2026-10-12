(() => {
  "use strict";

  const goToLogin = () => window.location.replace("login.html");

  window.ccgAdminReady = (async () => {
    try {
      const response = await fetch("/api/auth/session", { credentials: "same-origin" });
      if (!response.ok) {
        goToLogin();
        return false;
      }

      const session = await response.json();
      const email = document.getElementById("admin-email");
      if (email) email.textContent = session.email || "Administrateur";
      document.body.classList.remove("admin-pending");
      document.body.classList.add("admin-authenticated");
      return true;
    } catch (_) {
      goToLogin();
      return false;
    }
  })();

  document.addEventListener("DOMContentLoaded", () => {
    const logout = document.querySelector(".logout-link");
    if (!logout) return;
    logout.addEventListener("click", async (event) => {
      event.preventDefault();
      if (!window.confirm("Voulez-vous vraiment vous déconnecter ?")) return;
      try {
        await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
      } finally {
        goToLogin();
      }
    });
  });
})();
