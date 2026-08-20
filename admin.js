/* ======================================
   CCG ADMIN DASHBOARD JAVASCRIPT
====================================== */

const membersTableBody = document.querySelector('.admin-table tbody');

const createMemberRow = ({ photo = 'image/image.png', name, city, status = 'Actif' }) => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><img src="${photo}" alt="${name}"></td>
        <td>${name}</td>
        <td>${city}</td>
        <td>${status}</td>
        <td>
            <button class="edit">Modifier</button>
            <button class="delete">Supprimer</button>
        </td>
    `;
    attachTableRowEvents(row);
    return row;
};

const attachTableRowEvents = row => {
    const editButton = row.querySelector('button.edit');
    const deleteButton = row.querySelector('button.delete');

    editButton.addEventListener('click', () => {
        const cells = row.querySelectorAll('td');
        const currentName = cells[1].textContent.trim();
        const currentCity = cells[2].textContent.trim();
        const currentStatus = cells[3].textContent.trim();

        const newName = prompt('Modifier le nom du membre :', currentName);
        const newCity = prompt('Modifier la ville du membre :', currentCity);
        const newStatus = prompt('Modifier le statut du membre :', currentStatus);

        if (newName) cells[1].textContent = newName;
        if (newCity) cells[2].textContent = newCity;
        if (newStatus) cells[3].textContent = newStatus;
    });

    deleteButton.addEventListener('click', () => {
        if (confirm('Supprimer ce membre ?')) {
            row.remove();
        }
    });
};

const initializeExistingMemberRows = () => {
    document.querySelectorAll('.admin-table tbody tr').forEach(row => {
        attachTableRowEvents(row);
    });
};

const addMemberToTable = ({ name, city, status, photo }) => {
    const newRow = createMemberRow({ name, city, status, photo });
    if (membersTableBody) {
        membersTableBody.appendChild(newRow);
    }
};

// Quick action buttons
const adminActionButtons = document.querySelectorAll('.admin-actions button');

adminActionButtons.forEach(button => {
    button.addEventListener('click', () => {
        const actionTitle = button.closest('.action-card')?.querySelector('h3')?.textContent?.trim();

        switch (actionTitle) {
            case 'Ajouter membre': {
                const memberName = prompt('Nom du nouveau membre :');
                const memberCity = prompt('Ville du nouveau membre :');
                const memberStatus = prompt('Statut du membre :', 'Actif');
                if (memberName && memberCity) {
                    addMemberToTable({
                        name: memberName,
                        city: memberCity,
                        status: memberStatus || 'Actif'
                    });
                    alert(`Membre ajouté : ${memberName}`);
                }
                break;
            }
            case 'Créer actualité': {
                const newsTitle = prompt('Titre de l’actualité :');
                if (newsTitle) {
                    alert(`Actualité créée : ${newsTitle}`);
                }
                break;
            }
            case 'Nouvel événement': {
                const eventName = prompt('Nom de l’événement :');
                if (eventName) {
                    alert(`Événement créé : ${eventName}`);
                }
                break;
            }
            case 'Ajouter photo': {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.onchange = () => {
                    if (fileInput.files?.length) {
                        alert(`Photo ajoutée : ${fileInput.files[0].name}`);
                    }
                };
                fileInput.click();
                break;
            }
            default:
                alert(`Action administrateur : ${actionTitle || 'indéfinie'}`);
        }
    });
});

initializeExistingMemberRows();

// Sidebar link active state
const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
sidebarLinks.forEach(link => {
    link.addEventListener('click', event => {
        sidebarLinks.forEach(item => item.classList.remove('active'));
        link.classList.add('active');
    });
});

// Logout confirmation
const logoutLink = document.querySelector('.logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', event => {
        const confirmed = confirm('Voulez-vous vraiment vous déconnecter ?');
        if (!confirmed) {
            event.preventDefault();
        }
    });
}
