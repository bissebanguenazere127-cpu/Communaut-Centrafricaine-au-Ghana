(() => {
  "use strict";

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));

  const safeImageUrl = (value) => {
    const url = String(value ?? "").trim();
    return /^(https?:\/\/|\.\.?\/|[\w-]+\/)[^\s]*$/i.test(url) ? url : "image.png";
  };

  function setContactStatus(element, text, state = "") {
    if (!element) return;
    element.textContent = text;
    element.className = `form-status${state ? ` ${state}` : ""}`;
  }

  async function loadPublishedNews(client) {
    const grid = document.querySelector("#actualites .news-grid");
    if (!grid) return;

    const { data, error } = await client
      .from("news_articles")
      .select("title,summary,category,cover_image_url,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(6);

    // Keep the existing editorial cards as a safe fallback until content is published.
    if (error || !data?.length) return;

    grid.innerHTML = data.map((article) => {
      const date = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
        .format(new Date(article.published_at));
      return `<article class="news-card reveal">
        <div class="news-image">
          <img src="${escapeHtml(safeImageUrl(article.cover_image_url))}" alt="${escapeHtml(article.title)}" loading="lazy">
          <span class="news-category">${escapeHtml(article.category)}</span>
        </div>
        <div class="news-content">
          <div class="news-date">${escapeHtml(date)}</div>
          <h3>${escapeHtml(article.title)}</h3>
          <p>${escapeHtml(article.summary)}</p>
        </div>
      </article>`;
    }).join("");
  }

  function subscribeToPublishedNews(client) {
    if (typeof client.channel !== "function") return;
    client.channel("ccg-public-news")
      .on("postgres_changes", { event: "*", schema: "public", table: "news_articles" }, () => {
        loadPublishedNews(client);
      })
      .subscribe();
  }

  function connectPublicForms(client) {
    const form = document.getElementById("contactForm");
    if (!form) return;
    const status = document.getElementById("contactStatus");
    const submit = document.getElementById("contactSubmit");

    // Capture phase prevents the legacy EmailJS-only listener from sending a
    // message that is not stored in the secure admin inbox.
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const name = form.elements.from_name.value.trim();
      const email = form.elements.from_email.value.trim();
      const message = form.elements.message.value.trim();
      if (!name || !email || !message) return;

      if (submit) submit.disabled = true;
      setContactStatus(status, "Envoi en cours...");

      try {
        const { error } = await client.from("contact_messages").insert({
          sender_name: name,
          sender_email: email,
          message
        });
        if (error) throw error;

        // E-mail delivery remains a convenience; the inbox insert is the
        // source of truth and is successful even if the provider is offline.
        if (window.emailjs?.sendForm) {
          try {
            await window.emailjs.sendForm("service_dsdyaw8", "template_xdezry7", form);
          } catch (_) {
            // The administrator can still read the stored message.
          }
        }

        form.reset();
        setContactStatus(status, "Votre message a ete recu. Nous vous repondrons rapidement.", "success");
      } catch (_) {
        setContactStatus(status, "Impossible d'envoyer votre message. Veuillez reessayer.", "error");
      } finally {
        if (submit) submit.disabled = false;
      }
    }, true);
  }

  function connectMembershipRequests(client) {
    const form = document.getElementById("membershipForm");
    if (!form) return;
    const status = document.getElementById("membershipStatus");
    const submit = document.getElementById("membershipSubmit");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();

      const request = {
        last_name: form.elements.nom.value.trim(),
        first_name: form.elements.prenom.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.whatsapp.value.trim(),
        city: form.elements.ville.value.trim()
      };
      if (Object.values(request).some((value) => !value)) return;

      if (submit) submit.disabled = true;
      setContactStatus(status, "Envoi de la demande en cours...");
      try {
        const { error } = await client.from("membership_requests").insert(request);
        if (error) throw error;

        if (window.emailjs?.sendForm) {
          try {
            await window.emailjs.sendForm("service_dsdyaw8", "template_2f89i0q", form);
          } catch (_) {
            // The request remains available in the administration dashboard.
          }
        }

        form.reset();
        setContactStatus(status, "Votre demande a ete recue. Elle sera examinee par l'administration.", "success");
      } catch (_) {
        setContactStatus(status, "Impossible d'envoyer la demande. Veuillez reessayer.", "error");
      } finally {
        if (submit) submit.disabled = false;
      }
    }, true);
  }

  function start() {
    const config = window.supabaseConfig;
    if (!config?.isConfigured || !window.supabase?.createClient) return;
    const client = window.supabase.createClient(config.url, config.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    connectPublicForms(client);
    connectMembershipRequests(client);
    loadPublishedNews(client);
    subscribeToPublishedNews(client);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
