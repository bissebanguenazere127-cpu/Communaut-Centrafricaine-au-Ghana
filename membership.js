const STORAGE_KEY = "ccg-members-state";
const SUPABASE_URL = window.supabaseConfig?.url || "";
const SUPABASE_ANON_KEY = window.supabaseConfig?.anonKey || "";
const SUPABASE_CONFIGURED = Boolean(window.supabaseConfig?.isConfigured);
let supabaseClient = null;
let adminSession = null;

const defaultState = {
  members: [
    {
      id: "CF-001",
      firstName: "Nazere",
      lastName: "BISSEBANGUE",
      city: "Accra",
      district: "East Legon",
      phone: "+233 24 123 4567",
      email: "nazere@communaute.org",
      profession: "Ingénieur logiciel",
      birthDate: "1994-05-10",
      gender: "Homme",
      whatsapp: "+233 24 123 4567",
      password: "••••••••",
      joinDate: "2024-01-12",
      status: "verified",
      verified: true,
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "CF-002",
      firstName: "Aline",
      lastName: "MBOCK",
      city: "Kumasi",
      district: "Asafo",
      phone: "+233 20 321 4455",
      email: "aline@communaute.org",
      profession: "Enseignante",
      birthDate: "1990-09-18",
      gender: "Femme",
      whatsapp: "+233 20 321 4455",
      password: "••••••••",
      joinDate: "2023-11-04",
      status: "verified",
      verified: true,
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80"
    },
    {
      id: "CF-003",
      firstName: "Yves",
      lastName: "NGUEMBE",
      city: "Tema",
      district: "Community 9",
      phone: "+233 27 123 7865",
      email: "yves@communaute.org",
      profession: "Commerçant",
      birthDate: "1988-02-22",
      gender: "Homme",
      whatsapp: "+233 27 123 7865",
      password: "••••••••",
      joinDate: "2024-03-22",
      status: "verified",
      verified: true,
      photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80"
    }
  ],
  requests: [
    {
      id: "REQ-001",
      firstName: "Léonie",
      lastName: "KAMBO",
      city: "Takoradi",
      district: "Anaji",
      phone: "+233 26 847 1122",
      email: "leonie@example.org",
      status: "pending"
    }
  ]
};

const state = loadState();
const membersGrid = document.getElementById("membersGrid");
const profileModal = document.getElementById("profileModal");
const joinModal = document.getElementById("joinModal");
const profileModalContent = document.getElementById("profileModalContent");
const membershipForm = document.getElementById("membershipForm");
const formFeedback = document.getElementById("formFeedback");
const searchInput = document.getElementById("memberSearch");
const cityFilter = document.getElementById("cityFilter");
const adminTableBody = document.getElementById("adminTableBody");

const tabButtons = document.querySelectorAll(".tab-btn");
const membersPanel = document.getElementById("members-panel");
const visitorsPanel = document.getElementById("visitorsPanel");
const adminEmailInput = document.getElementById("adminEmail");
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const authStatus = document.getElementById("authStatus");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultState;
  } catch (error) {
    console.warn("Impossible de charger le stockage local", error);
    return defaultState;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function maskPhone(phone) {
  if (!phone) return "Non disponible";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "Non disponible";
  const tail = digits.slice(-2);
  return `+233 XX XXX ${tail}`;
}

function getFilteredMembers() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedCity = cityFilter.value;

  return state.members.filter((member) => {
    const matchesQuery =
      !query ||
      [member.firstName, member.lastName, member.city, member.district]
        .join(" ")
        .toLowerCase()
        .includes(query);
    const matchesCity =
      selectedCity === "all" ||
      (selectedCity === "Autres villes" && !["Accra", "Kumasi", "Tema", "Takoradi"].includes(member.city)) ||
      member.city === selectedCity;

    return matchesQuery && matchesCity && member.status !== "disabled";
  });
}

function renderMembers() {
  const filteredMembers = getFilteredMembers();
  membersGrid.innerHTML = filteredMembers.length
    ? filteredMembers
        .map(
          (member) => `
            <article class="member-card">
              <div class="profile-head">
                <img class="avatar" src="${member.photo}" alt="${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}" />
                <div>
                  <p class="member-name">${escapeHtml(member.lastName)}</p>
                  <p class="member-name">${escapeHtml(member.firstName)}</p>
                </div>
              </div>
              <div class="member-meta">
                <div><strong>Ville :</strong> ${escapeHtml(member.city)}</div>
                <div><strong>Quartier :</strong> ${escapeHtml(member.district)}</div>
                <div><strong>Téléphone :</strong> ${escapeHtml(maskPhone(member.phone))}</div>
                <div><strong>ID :</strong> ${escapeHtml(member.id)}</div>
                <div><strong>Adhésion :</strong> ${escapeHtml(member.joinDate)}</div>
              </div>
              <span class="badge">✓ Membre vérifié</span>
              <button class="btn btn-primary view-profile" data-member-id="${member.id}" type="button">Voir le profil</button>
            </article>
          `
        )
        .join("")
    : '<div class="empty-state"><h3>Aucun membre trouvé</h3><p>Essayez une autre recherche ou un autre filtre.</p></div>';

  updateStats();
  renderAdminTable();
}

function updateStats() {
  document.getElementById("heroMembersCount").textContent = state.members.filter((member) => member.status === "verified").length;
  document.getElementById("heroPendingCount").textContent = state.requests.length;
  document.getElementById("adminTotal").textContent = state.members.length;
  document.getElementById("verifiedCount").textContent = state.members.filter((member) => member.status === "verified").length;
  document.getElementById("pendingCount").textContent = state.requests.length;
  document.getElementById("disabledCount").textContent = state.members.filter((member) => member.status === "disabled").length;
}

function renderAdminTable() {
  const rows = [
    ...state.members.map((member) => ({
      type: "member",
      name: `${member.firstName} ${member.lastName}`,
      city: member.city,
      status: member.status,
      id: member.id
    })),
    ...state.requests.map((request) => ({
      type: "request",
      name: `${request.firstName} ${request.lastName}`,
      city: request.city,
      status: request.status,
      id: request.id
    }))
  ];

  adminTableBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.city)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.id)}</td>
        </tr>
      `
    )
    .join("");
}

function openProfileModal(memberId) {
  const member = state.members.find((entry) => entry.id === memberId);
  if (!member) return;

  profileModalContent.innerHTML = `
    <div class="profile-head">
      <img class="avatar" src="${member.photo}" alt="${escapeHtml(member.firstName)} ${escapeHtml(member.lastName)}" />
      <div>
        <h3 id="modalTitle">${escapeHtml(member.lastName)} ${escapeHtml(member.firstName)}</h3>
        <p>Profil membre vérifié</p>
      </div>
    </div>
    <div class="member-meta">
      <div><strong>Ville :</strong> ${escapeHtml(member.city)}</div>
      <div><strong>Quartier :</strong> ${escapeHtml(member.district)}</div>
      <div><strong>Téléphone :</strong> ${escapeHtml(member.phone)}</div>
      <div><strong>Email :</strong> ${escapeHtml(member.email)}</div>
      <div><strong>Profession :</strong> ${escapeHtml(member.profession)}</div>
      <div><strong>Numéro WhatsApp :</strong> ${escapeHtml(member.whatsapp)}</div>
      <div><strong>ID membre :</strong> ${escapeHtml(member.id)}</div>
      <div><strong>Date d’adhésion :</strong> ${escapeHtml(member.joinDate)}</div>
    </div>
    <p class="badge">✓ Accès restreint à l’administration et aux membres autorisés</p>
  `;
  profileModal.classList.remove("hidden");
  profileModal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function showJoinModal() {
  joinModal.classList.remove("hidden");
  joinModal.setAttribute("aria-hidden", "false");
  formFeedback.textContent = "";
  membershipForm.reset();
}

function handleMembershipSubmit(event) {
  event.preventDefault();
  const data = new FormData(membershipForm);
  const password = data.get("password");
  const confirmPassword = data.get("confirmPassword");

  if (password !== confirmPassword) {
    formFeedback.textContent = "Les mots de passe ne correspondent pas.";
    return;
  }

  const request = {
    id: `REQ-${String(state.requests.length + 1).padStart(3, "0")}`,
    firstName: data.get("firstName"),
    lastName: data.get("lastName"),
    city: data.get("city"),
    district: data.get("district"),
    phone: data.get("phone"),
    email: data.get("email"),
    status: "pending"
  };

  state.requests.push(request);
  saveState();
  renderMembers();
  formFeedback.textContent = "Votre demande d’adhésion a été envoyée. Elle sera vérifiée par l’administration.";
  membershipForm.reset();
}

function addMember() {
  const nextId = `CF-${String(state.members.length + 1).padStart(3, "0")}`;
  state.members.push({
    id: nextId,
    firstName: "Nouveau",
    lastName: "Membre",
    city: "Accra",
    district: "Dansoman",
    phone: "+233 24 000 0000",
    email: "nouveau@communaute.org",
    profession: "Profession à renseigner",
    birthDate: "2000-01-01",
    gender: "Autre",
    whatsapp: "+233 24 000 0000",
    password: "••••••••",
    joinDate: new Date().toISOString().slice(0, 10),
    status: "verified",
    verified: true,
    photo: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80"
  });
  saveState();
  renderMembers();
}

function modifyMember() {
  if (!state.members.length) return;
  const first = state.members[0];
  first.city = "Kumasi";
  first.district = "Aboabo";
  saveState();
  renderMembers();
}

function deleteMember() {
  if (!state.members.length) return;
  state.members.shift();
  saveState();
  renderMembers();
}

function validateRequest() {
  if (!state.requests.length) return;
  const request = state.requests.shift();
  state.members.push({
    id: `CF-${String(state.members.length + 1).padStart(3, "0")}`,
    firstName: request.firstName,
    lastName: request.lastName,
    city: request.city,
    district: request.district,
    phone: request.phone,
    email: request.email,
    profession: "À définir",
    birthDate: "2000-01-01",
    gender: "Autre",
    whatsapp: request.phone,
    password: "••••••••",
    joinDate: new Date().toISOString().slice(0, 10),
    status: "verified",
    verified: true,
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"
  });
  saveState();
  renderMembers();
}

function refuseRequest() {
  if (!state.requests.length) return;
  state.requests.shift();
  saveState();
  renderMembers();
}

function disableAccount() {
  if (!state.members.length) return;
  const first = state.members.find((member) => member.status !== "disabled");
  if (first) first.status = "disabled";
  saveState();
  renderMembers();
}

function exportMembers() {
  const data = JSON.stringify(state.members, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "membres-communaute.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function initSupabase() {
  if (!window.supabase || !SUPABASE_CONFIGURED) {
    authStatus.textContent = "Mode local actif : configurez Supabase pour activer la sécurité RLS complète.";
    return;
  }

  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: sessionData } = await supabaseClient.auth.getSession();
  adminSession = sessionData?.session || null;

  if (adminSession) {
    authStatus.textContent = "Administration connectée à Supabase.";
  }
}

async function loginAdmin() {
  if (!supabaseClient) {
    authStatus.textContent = "Supabase n’est pas configuré. Le mode local reste actif.";
    return;
  }

  if (!adminEmailInput.value || !adminPasswordInput.value) {
    authStatus.textContent = "Veuillez renseigner votre email et votre mot de passe.";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: adminEmailInput.value,
    password: adminPasswordInput.value
  });

  if (error) {
    authStatus.textContent = `Erreur de connexion : ${error.message}`;
    return;
  }

  adminSession = data.session;
  authStatus.textContent = "Connexion administrateur réussie.";
}

searchInput.addEventListener("input", renderMembers);
cityFilter.addEventListener("change", renderMembers);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    const isVisitors = button.dataset.tab === "visitors";
    membersPanel.classList.toggle("hidden", isVisitors);
    visitorsPanel.classList.toggle("hidden", !isVisitors);
  });
});

membersGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".view-profile");
  if (!button) return;
  openProfileModal(button.dataset.memberId);
});

document.getElementById("closeProfileModal").addEventListener("click", () => closeModal(profileModal));
document.getElementById("closeJoinModal").addEventListener("click", () => closeModal(joinModal));
profileModal.addEventListener("click", (event) => {
  if (event.target === profileModal) closeModal(profileModal);
});
joinModal.addEventListener("click", (event) => {
  if (event.target === joinModal) closeModal(joinModal);
});

document.getElementById("joinNowBtn").addEventListener("click", showJoinModal);
document.getElementById("joinFromVisitor").addEventListener("click", showJoinModal);
document.getElementById("addMemberBtn").addEventListener("click", addMember);
document.getElementById("modifyMemberBtn").addEventListener("click", modifyMember);
document.getElementById("deleteMemberBtn").addEventListener("click", deleteMember);
document.getElementById("validateRequestBtn").addEventListener("click", validateRequest);
document.getElementById("refuseRequestBtn").addEventListener("click", refuseRequest);
document.getElementById("disableAccountBtn").addEventListener("click", disableAccount);
document.getElementById("exportMembersBtn").addEventListener("click", exportMembers);
adminLoginBtn.addEventListener("click", loginAdmin);
membershipForm.addEventListener("submit", handleMembershipSubmit);

/*
Architecture cible pour Supabase :
- profiles : id, first_name, last_name, city, district, phone, email, profession, birth_date, gender, whatsapp, status, join_date, profile_photo_url
- membership_requests : id, profile_id, status, created_at, reviewed_by
- cities : id, name
- districts : id, city_id, name
- RLS : policies en lecture/écriture restreintes aux administrateurs et au profil connecté
*/

initSupabase().catch((error) => {
  console.warn("Supabase indisponible", error);
});
renderMembers();
