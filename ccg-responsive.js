
/* CCG responsive navigation enhancement */
document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll(
    ".menu-toggle, .nav-toggle, .hamburger, [aria-label*='menu' i]"
  );

  toggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const nav =
        toggle.closest("header, nav, .navbar, .nav-container")?.querySelector(
          ".nav-menu, .nav-links, .navigation-links"
        ) || document.querySelector(".nav-menu, .nav-links, .navigation-links");

      if (!nav) return;
      nav.classList.toggle("active");
      toggle.classList.toggle("active");
      toggle.setAttribute("aria-expanded", nav.classList.contains("active") ? "true" : "false");
    });
  });

  document.querySelectorAll("a[href^='#']").forEach(link => {
    link.addEventListener("click", () => {
      const nav = document.querySelector(".nav-menu.active, .nav-links.active, .navigation-links.active");
      if (nav) nav.classList.remove("active");
    });
  });
});
