(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const config = window.supabaseConfig;
  const enabled = Boolean(config?.isConfigured && window.supabase?.createClient);
  const client = enabled ? window.supabase.createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
  let members = [], admin = false;
  let dashboardRefreshTimer = null;
  const esc = (v) => String(v ?? "").replace(/[&<>\'\"]/g, (c) => ({"&":"&amp;","<":"&lt;", ">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
  const modal = (id, show = true) => { $(id).classList.toggle("hidden", !show); $(id).setAttribute("aria-hidden", String(!show)); };
  const status = (s) => ({approved:"Vérifié",pending:"En attente",rejected:"Refusé",disabled:"Désactivé"}[s] || s);
  const card = (m) => '<article class="member-card"><img class="member-cover" src="Ghana.jpg" alt="Communauté centrafricaine au Ghana"><div class="member-card-content"><div class="profile-head"><div><h3>' + esc(m.first_name) + ' ' + esc(m.last_name) + '</h3><span>' + esc(m.city || "—") + '</span></div><button class="profile" data-id="' + esc(m.id) + '" type="button">Voir profil</button></div><div class="member-meta"><span>' + esc(m.membership_number || "—") + '</span><span>' + esc(status(m.membership_status)) + '</span></div></div></article>';

  function showToast(message, type = "success") {
    let container = document.getElementById("ccgToastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "ccgToastContainer";
      container.setAttribute("role", "status");
      container.setAttribute("aria-live", "polite");
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<strong>${esc(type === "error" ? "Erreur" : type === "info" ? "Info" : "Succès" )}</strong><span>${esc(message)}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 350);
    }, 4200);
  }

  function startDashboardRefreshLoop() {
    if (dashboardRefreshTimer) clearInterval(dashboardRefreshTimer);
    dashboardRefreshTimer = setInterval(() => {
      if (!document.hidden && client && admin) {
        load();
      }
    }, 15000);
  }

  async function notifyAdminNewMember(meta) {
    const adminEmail = "ccdughana@gmail.com";
    const fullName = `${meta.first_name || ""} ${meta.last_name || ""}`.trim();
    const memberSummary = {
      full_name: fullName,
      email: meta.email,
      phone: meta.phone || "—",
      city: meta.city || "—",
      district: meta.district || "—",
      profession: meta.profession || "—",
      to_email: adminEmail,
      to_name: "Administrateur CCG"
    };

    showToast("Nouvelle demande de membre reçue. Vérifiez le tableau de bord.", "info");

    if (window.emailjs && typeof window.emailjs.send === "function") {
      try {
        await window.emailjs.send("service_dsdyaw8", "template_2f89i0q", memberSummary);
      } catch (error) {
        console.warn("EmailJS alert non envoyé :", error);
      }
    }

    if (admin) {
      await load();
    }
  }

  function visible() {
    const term = $("#memberSearch").value.trim().toLowerCase(), city = $("#cityFilter").value;
    return members.filter((m) => m.membership_status === "approved" && (!term || [m.first_name,m.last_name,m.city,m.district].join(" ").toLowerCase().includes(term)) && (city === "all" || m.city === city));
  }
  function render() {
    const list = visible(), count = (s) => members.filter((m) => m.membership_status === s).length;
    $("#membersGrid").innerHTML = list.length ? list.map(card).join("") : "<div class='empty-state'><h3>Aucun membre trouvé</h3><p>Essayez une autre recherche ou un autre filtre.</p></div>";
    $("#heroMembersCount").textContent = count("approved"); $("#heroPendingCount").textContent = admin ? count("pending") : "—";
    $("#adminTotal").textContent = members.length; $("#verifiedCount").textContent = count("approved"); $("#pendingCount").textContent = count("pending"); $("#disabledCount").textContent = count("disabled");
    $("#adminTableBody").innerHTML = admin ? members.map((m) => "<tr><td>" + esc(m.first_name) + " " + esc(m.last_name) + "</td><td>" + esc(m.city) + "</td><td>" + esc(status(m.membership_status)) + "</td><td>" + esc(m.membership_number || "—") + "</td></tr>").join("") : "<tr><td colspan='4'>Connectez-vous comme administrateur pour voir les demandes.</td></tr>";
  }
  async function load() {
    if (!client) return;
    const {data:sessionData} = await client.auth.getSession();
    admin = sessionData.session ? (await client.rpc("is_ccg_admin")).data === true : false;
    const source = admin ? client.from("profiles") : client.from("member_directory");
    const {data,error} = await source.select("id,first_name,last_name,city,district,membership_number,membership_status,profile_photo_url,created_at").order("created_at",{ascending:false});
    if (error) { console.error(error); $("#membersGrid").innerHTML = "<div class='empty-state'><h3>Répertoire indisponible</h3><p>Réessayez dans un instant.</p></div>"; return; }
    members = data || []; render();
    if (admin) startDashboardRefreshLoop();
  }
  function profile(id) {
    const m = members.find((item) => item.id === id); if (!m) return;
    $("#profileModalContent").innerHTML = '<div class="profile-head"><img class="avatar" src="' + esc(m.profile_photo_url || "profile.png") + '" alt=""><div><h3 id="modalTitle">' + esc(m.last_name) + ' ' + esc(m.first_name) + '</h3><p>' + esc(m.city || "—") + '</p></div></div><div class="profile-body"><p><strong>Ville :</strong> ' + esc(m.city || "—") + '</p><p><strong>Quartier :</strong> ' + esc(m.district || "—") + '</p><p><strong>Statut :</strong> ' + esc(status(m.membership_status)) + '</p></div>';
    modal("#profileModal");
  }
  async function apply(event) {
    event.preventDefault(); const form = event.currentTarget, feedback = $("#formFeedback"), data = new FormData(form);
    if (!client) { feedback.textContent = "L’inscription est indisponible : configurez Supabase."; return; }
    if (data.get("password") !== data.get("confirmPassword")) { feedback.textContent = "Les mots de passe ne correspondent pas."; return; }
    const button = form.querySelector("button[type=submit]"); button.disabled = true; feedback.textContent = "Envoi de votre demande…";
    const meta = {first_name:data.get("firstName").trim(),last_name:data.get("lastName").trim(),phone:data.get("phone").trim(),city:data.get("city"),district:data.get("district").trim(),profession:data.get("profession").trim(),email:data.get("email").trim(),membership_number:""};
    const {data:signup,error} = await client.auth.signUp({email:data.get("email").trim(),password:data.get("password"),options:{data:meta}});
    if (error) { feedback.textContent = error.message; button.disabled = false; return; }
    const photo = data.get("photo");
    if (signup.session && photo instanceof File && photo.size) {
      const path = signup.user.id + "/avatar." + (photo.name.split(".").pop() || "jpg"), upload = await client.storage.from("ccg-avatars").upload(path,photo,{upsert:true});
      if (!upload.error) { const {data:url} = client.storage.from("ccg-avatars").getPublicUrl(path); await client.from("profiles").update({profile_photo_url:url.publicUrl}).eq("id",signup.user.id); }
    }
    form.reset();
    if (signup.session) {
      feedback.textContent = "Demande envoyée. Elle sera examinée par l’administration.";
      showToast("Demande de membre soumise avec succès.", "success");
      await notifyAdminNewMember(meta);
    } else {
      feedback.textContent = "Demande créée. Vérifiez votre e-mail pour confirmer votre adresse.";
      showToast("Demande créée. Vérifiez votre e-mail pour confirmer votre inscription.", "info");
    }
    button.disabled = false;
    if (window.supabase && window.supabase.createClient && client) await load();
  }
  async function updateCandidate(nextStatus) {
    if (!admin) { $("#authStatus").textContent = "Connectez-vous avec un compte administrateur."; return; }
    const m = members.find((item) => item.membership_status === "pending") || members.find((item) => item.membership_status === "approved"); if (!m) return;
    {
      const action = ({ approved: "approve", rejected: "reject", disabled: "disable" })[nextStatus];
      if (!action) { $("#authStatus").textContent = "Action non prise en charge."; return; }
      const result = await client.functions.invoke("admin-member-action", { body: { action, memberId: m.id } });
      $("#authStatus").textContent = result.error ? "Mise a jour impossible." : "Membre mis a jour.";
      await load();
      return;
    }
    const {error} = await client.from("profiles").update({membership_status:nextStatus}).eq("id",m.id); $("#authStatus").textContent = error ? error.message : "Membre mis à jour."; await load();
  }
  document.querySelectorAll(".join-trigger").forEach((b) => b.onclick = () => { $("#membershipForm").reset(); $("#formFeedback").textContent = ""; modal("#joinModal"); });
  $("#closeProfileModal").onclick = () => modal("#profileModal",false); $("#closeJoinModal").onclick = () => modal("#joinModal",false);
  ["#profileModal","#joinModal"].forEach((id) => $(id).onclick = (e) => { if(e.target === $(id)) modal(id,false); });
  $("#memberSearch").oninput = render; $("#cityFilter").onchange = render; $("#membersGrid").onclick = (e) => { const b=e.target.closest(".profile"); if(b) profile(b.dataset.id); };
  $("#membershipForm").onsubmit = apply; $("#adminToggle").onclick = () => $("#adminPanel").classList.toggle("hidden"); $("#adminLoginBtn").onclick = () => { location.href="login.html"; };
  $("#validateRequestBtn").onclick = () => updateCandidate("approved"); $("#refuseRequestBtn").onclick = () => updateCandidate("rejected"); $("#disableAccountBtn").onclick = () => updateCandidate("disabled");
  $("#addMemberBtn").onclick = () => $("#authStatus").textContent="Les membres s’ajoutent via le formulaire d’adhésion."; $("#modifyMemberBtn").onclick = () => $("#authStatus").textContent="Une fois validée, la demande apparaît dans le répertoire.";
  $("#exportMembersBtn").onclick = () => { if(!admin) return; const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(members,null,2)],{type:"application/json"})); a.download="ccg-members.json"; a.click(); };
  if (!enabled) $("#membersGrid").innerHTML = "<div class='empty-state'><h3>Configuration requise</h3><p>Ajoutez les clés publiques Supabase dans supabsae-config.js.</p></div>"; else load();
})();
