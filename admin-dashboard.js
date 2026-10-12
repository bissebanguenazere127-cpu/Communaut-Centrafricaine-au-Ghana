(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));

  const labels = {
    new: "Nouveau",
    read: "Lu",
    archived: "Archive",
    pending: "En attente",
    approved: "Approuvee",
    rejected: "Refusee"
  };

  function setStatus(text, type = "") {
    const target = $("#admin-dashboard-status");
    if (!target) return;
    target.textContent = text;
    target.className = `dashboard-status${type ? ` ${type}` : ""}`;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium", timeStyle: "short"
    }).format(date);
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials: "same-origin",
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      ...options
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Operation impossible.");
    return payload;
  }

  function emptyRow(columns, text) {
    return `<tr><td class="admin-empty" colspan="${columns}">${escapeHtml(text)}</td></tr>`;
  }

  async function loadOverview() {
    try {
      const overview = await api("/api/admin/overview");
      if (!overview.storageConfigured) {
        setStatus(overview.error || "Supabase doit etre configure dans .env pour afficher les donnees.", "error");
        return false;
      }
      const counts = overview.counts || {};
      setStatus(`${counts.newMessages ?? 0} nouveau(x) message(s), ${counts.pendingRequests ?? 0} demande(s) en attente et ${counts.publishedNews ?? 0} actualite(s) publiee(s).`, "success");
      return true;
    } catch (error) {
      setStatus(error.message || "Impossible de charger le tableau de bord.", "error");
      return false;
    }
  }

  async function loadMessages() {
    const body = $("#messages-table-body");
    if (!body) return;
    body.innerHTML = emptyRow(5, "Chargement des messages...");
    try {
      const status = $("#message-status-filter")?.value || "";
      const query = new URLSearchParams({ limit: "50" });
      if (status) query.set("status", status);
      const { messages } = await api(`/api/admin/contact-messages?${query}`);
      body.innerHTML = messages?.length ? messages.map((message) => {
        const action = message.status === "new"
          ? `<button class="table-action" type="button" data-message-id="${escapeHtml(message.id)}" data-message-status="read">Marquer lu</button>`
          : message.status === "read"
            ? `<button class="table-action secondary" type="button" data-message-id="${escapeHtml(message.id)}" data-message-status="archived">Archiver</button>`
            : `<button class="table-action secondary" type="button" data-message-id="${escapeHtml(message.id)}" data-message-status="read">Restaurer</button>`;
        return `<tr>
          <td><strong>${escapeHtml(message.sender_name)}</strong><br><a href="mailto:${encodeURIComponent(message.sender_email)}">${escapeHtml(message.sender_email)}</a></td>
          <td class="message-cell">${escapeHtml(message.message)}</td>
          <td>${escapeHtml(formatDate(message.created_at))}</td>
          <td><span class="status-badge ${escapeHtml(message.status)}">${escapeHtml(labels[message.status] || message.status)}</span></td>
          <td>${action}</td>
        </tr>`;
      }).join("") : emptyRow(5, "Aucun message dans cette liste.");
    } catch (error) {
      body.innerHTML = emptyRow(5, error.message || "Impossible de charger les messages.");
      setStatus(error.message || "Impossible de charger les messages.", "error");
    }
  }

  async function loadRequests() {
    const body = $("#requests-table-body");
    if (!body) return;
    body.innerHTML = emptyRow(6, "Chargement des demandes...");
    try {
      const status = $("#request-status-filter")?.value || "";
      const query = new URLSearchParams({ limit: "50" });
      if (status) query.set("status", status);
      const { requests } = await api(`/api/admin/membership-requests?${query}`);
      body.innerHTML = requests?.length ? requests.map((request) => {
        const actions = request.status === "pending"
          ? `<div class="table-actions"><button class="table-action approve" type="button" data-request-id="${escapeHtml(request.id)}" data-request-status="approved">Approuver</button><button class="table-action reject" type="button" data-request-id="${escapeHtml(request.id)}" data-request-status="rejected">Refuser</button></div>`
          : `<button class="table-action secondary" type="button" data-request-id="${escapeHtml(request.id)}" data-request-status="archived">Archiver</button>`;
        return `<tr>
          <td><strong>${escapeHtml(request.first_name)} ${escapeHtml(request.last_name)}</strong></td>
          <td><a href="mailto:${encodeURIComponent(request.email)}">${escapeHtml(request.email)}</a><br>${escapeHtml(request.phone)}</td>
          <td>${escapeHtml(request.city)}</td>
          <td>${escapeHtml(formatDate(request.created_at))}</td>
          <td><span class="status-badge ${escapeHtml(request.status)}">${escapeHtml(labels[request.status] || request.status)}</span></td>
          <td>${actions}</td>
        </tr>`;
      }).join("") : emptyRow(6, "Aucune demande dans cette liste.");
    } catch (error) {
      body.innerHTML = emptyRow(6, error.message || "Impossible de charger les demandes.");
      setStatus(error.message || "Impossible de charger les demandes.", "error");
    }
  }

  async function updateMessage(button) {
    button.disabled = true;
    try {
      await api(`/api/admin/contact-messages/${encodeURIComponent(button.dataset.messageId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: button.dataset.messageStatus })
      });
      await Promise.all([loadOverview(), loadMessages()]);
    } catch (error) {
      setStatus(error.message || "Mise a jour impossible.", "error");
    } finally {
      button.disabled = false;
    }
  }

  async function updateRequest(button) {
    const status = button.dataset.requestStatus;
    if (status === "rejected" && !window.confirm("Refuser cette demande d'adhesion ?")) return;
    button.disabled = true;
    try {
      await api(`/api/admin/membership-requests/${encodeURIComponent(button.dataset.requestId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      await Promise.all([loadOverview(), loadRequests()]);
    } catch (error) {
      setStatus(error.message || "Mise a jour impossible.", "error");
    } finally {
      button.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const authenticated = await window.ccgAdminReady;
    if (!authenticated) return;

    $("#refresh-messages")?.addEventListener("click", () => { loadOverview(); loadMessages(); });
    $("#refresh-requests")?.addEventListener("click", () => { loadOverview(); loadRequests(); });
    $("#message-status-filter")?.addEventListener("change", loadMessages);
    $("#request-status-filter")?.addEventListener("change", loadRequests);
    $("#messages-table-body")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-message-id]");
      if (button) updateMessage(button);
    });
    $("#requests-table-body")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-request-id]");
      if (button) updateRequest(button);
    });

    const configured = await loadOverview();
    if (configured) await Promise.all([loadMessages(), loadRequests()]);
  });
})();
