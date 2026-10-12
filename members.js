(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const config = window.supabaseConfig;
  const enabled = Boolean(config?.isConfigured && window.supabase?.createClient);
  const client = enabled ? window.supabase.createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null;
  let members = [], admin = false;
  const esc = (v) => String(v ?? "").replace(/[&<>'"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const modal = (id, show = true) => { $(id).classList.toggle("hidden", !show); $(id).setAttribute("aria-hidden", String(!show)); };
  const status = (s) => ({approved:"Vérifié",pending:"En attente",rejected:"Refusé",disabled:"Désactivé"}[s] || s);
  const card = (m) => '<article class="member-card"><img class="member-cover" src="Ghana.jpg" alt="Communauté centrafricaine au Ghana"><div class="member-card-content"><div class="profile-head"><img class="avatar" src="' + esc(m.profile_photo_url || "profile.png") + '" alt="Photo de ' + esc(m.first_name) + '" onerror="this.src=' + "'profile.png'" + '"><div><p class="member-name">' + esc(m.last_name) + '</p><p class="member-name">' + esc(m.first_name) + '</p></div></div><div class="member-meta"><div><strong>Ville :</strong> ' + esc(m.city) + '</div><div><strong>Quartier :</strong> ' + esc(m.district) + '</div><div><strong>ID :</strong> ' + esc(m.membership_number || "—") + '</div></div><span class="badge">✓ Membre vérifié</span><button class="btn btn-primary profile" data-id="' + esc(m.id) + '" type="button">Voir le profil</button></div></article>';

  function visible() {
    const term = $("#memberSearch").value.trim().toLowerCase(), city = $("#cityFilter").value;
    return members.filter((m) => m.membership_status === "approved" && (!term || [m.first_name,m.last_name,m.city,m.district].join(" ").toLowerCase().includes(term)) && (city === "all" || m.city === city || (city === "Autres villes" && !["Accra","Kumasi","Tema","Takoradi"].includes(m.city))));
  }
  function render() {
    const list = visible(), count = (s) => members.filter((m) => m.membership_status === s).length;
    $("#membersGrid").innerHTML = list.length ? list.map(card).join("") : "<div class='empty-state'><h3>Aucun membre trouvé</h3><p>Essayez une autre recherche ou un autre filtre.</p></div>";
    $("#heroMembersCount").textContent = count("approved"); $("#heroPendingCount").textContent = admin ? count("pending") : "—";
    $("#adminTotal").textContent = members.length; $("#verifiedCount").textContent = count("approved"); $("#pendingCount").textContent = count("pending"); $("#disabledCount").textContent = count("disabled");
    $("#adminTableBody").innerHTML = admin ? members.map((m) => "<tr><td>" + esc(m.first_name) + " " + esc(m.last_name) + "</td><td>" + esc(m.city) + "</td><td>" + esc(status(m.membership_status)) + "</td><td>" + esc(m.membership_number || m.id) + "</td></tr>").join("") : "";
  }
  async function load() {
    const {data:sessionData} = await client.auth.getSession();
    admin = sessionData.session ? (await client.rpc("is_ccg_admin")).data === true : false;
    const source = admin ? client.from("profiles") : client.from("member_directory");
    const {data,error} = await source.select("id,first_name,last_name,city,district,membership_number,membership_status,profile_photo_url,created_at").order("created_at",{ascending:false});
    if (error) { console.error(error); $("#membersGrid").innerHTML = "<div class='empty-state'><h3>Répertoire indisponible</h3><p>Réessayez dans un instant.</p></div>"; return; }
    members = data || []; render();
  }
  function profile(id) {
    const m = members.find((item) => item.id === id); if (!m) return;
    $("#profileModalContent").innerHTML = '<div class="profile-head"><img class="avatar" src="' + esc(m.profile_photo_url || "profile.png") + '" alt=""><div><h3 id="modalTitle">' + esc(m.last_name) + " " + esc(m.first_name) + '</h3><p>Profil membre vérifié</p></div></div><div class="member-meta"><div><strong>Ville :</strong> ' + esc(m.city) + '</div><div><strong>Quartier :</strong> ' + esc(m.district) + '</div><div><strong>ID membre :</strong> ' + esc(m.membership_number || "—") + "</div></div>";
    modal("#profileModal");
  }
  async function apply(event) {
    event.preventDefault(); const form = event.currentTarget, feedback = $("#formFeedback"), data = new FormData(form);
    if (!client) { feedback.textContent = "L’inscription est indisponible : configurez Supabase."; return; }
    if (data.get("password") !== data.get("confirmPassword")) { feedback.textContent = "Les mots de passe ne correspondent pas."; return; }
    const button = form.querySelector("button[type=submit]"); button.disabled = true; feedback.textContent = "Envoi de votre demande…";
    const meta = {first_name:data.get("firstName").trim(),last_name:data.get("lastName").trim(),phone:data.get("phone").trim(),city:data.get("city"),district:data.get("district").trim(),profession:data.get("profession").trim(),birth_date:data.get("birthDate"),gender:data.get("gender"),whatsapp:data.get("whatsapp").trim()};
    const {data:signup,error} = await client.auth.signUp({email:data.get("email").trim(),password:data.get("password"),options:{data:meta}});
    if (error) { feedback.textContent = error.message; button.disabled = false; return; }
    const photo = data.get("photo");
    if (signup.session && photo instanceof File && photo.size) {
      const path = signup.user.id + "/avatar." + (photo.name.split(".").pop() || "jpg"), upload = await client.storage.from("ccg-avatars").upload(path,photo,{upsert:true});
      if (!upload.error) { const {data:url} = client.storage.from("ccg-avatars").getPublicUrl(path); await client.from("profiles").update({profile_photo_url:url.publicUrl}).eq("id",signup.user.id); }
    }
    form.reset(); feedback.textContent = signup.session ? "Demande envoyée. Elle sera examinée par l’administration." : "Demande créée. Vérifiez votre e-mail pour confirmer votre adresse."; button.disabled = false; await load();
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
  $("#addMemberBtn").onclick = () => $("#authStatus").textContent="Les membres s’ajoutent via le formulaire d’adhésion."; $("#modifyMemberBtn").onclick = () => $("#authStatus").textContent="Modifiez les dossiers dans Supabase."; $("#deleteMemberBtn").onclick = () => $("#authStatus").textContent="La suppression est gérée dans Supabase pour préserver les comptes.";
  $("#exportMembersBtn").onclick = () => { if(!admin) return; const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([JSON.stringify(members,null,2)],{type:"application/json"})); a.download="membres-ccg.json"; a.click(); URL.revokeObjectURL(a.href); };
  if (!enabled) $("#membersGrid").innerHTML = "<div class='empty-state'><h3>Configuration requise</h3><p>Ajoutez les clés publiques Supabase dans supabsae-config.js.</p></div>"; else load();
})();
