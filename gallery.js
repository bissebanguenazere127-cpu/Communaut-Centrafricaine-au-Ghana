const photoGrid = document.getElementById("photoGrid");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const photoCount = document.getElementById("photoCount");
const recentPhotos = [
  "image/WhatsApp Image 2026-07-31 at 11.02.56 AM (3).jpeg",
  "image/WhatsApp Image 2026-07-09 at 1.46.42 PM (1).jpeg",
  "image/WhatsApp Image 2026-07-31 at 10.21.44 AM (1).jpeg",
  "image/WhatsApp Image 2026-07-31 at 10.21.44 AM.jpeg",
  "image/WhatsApp Image 2026-07-31 at 10.21.45 AM (1).jpeg",
  "image/WhatsApp Image 2026-07-31 at 10.21.45 AM (2).jpeg",
  "image/ben.jpeg",
  "image/WhatsApp Image 2026-07-31 at 10.21.45 AM (3).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.55 AM (1).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.55 AM (1).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.55 AM.jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.56 AM (1).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.56 AM (2).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.56 AM (3).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.56 AM (4).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.56 AM (5).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.57 AM (1).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.56 AM (5).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.57 AM (1).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.57 AM (2).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.57 AM (3).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.57 AM (4).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.57 AM (5).jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.57 AM.jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.58 AM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.29.02 PM.jpeg",
  "image/WhatsApp Image 2026-07-31 at 11.02.58 AM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.29.02 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.29.01 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.29.01 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.29.00 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.29.00 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.59 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.58 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.58 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.57 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.57 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.56 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.56 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.55 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.54 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.54 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.52 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.52 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.52 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.51 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.51 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.50 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.50 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.49 PM.jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.49 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-19 at 12.28.35 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.27 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.28 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.28 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.28 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.28 PM (5).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.28 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.29 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.29 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.29 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.29 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.29 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.30 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.30 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.31 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.31 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.31 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.32 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.32 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.32 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.32 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.33 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.33 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.33 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.07.33 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.46 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.46 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.47 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.47 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.47 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.47 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.48 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.48 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.49 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.49 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.49 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.49 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.50 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.53 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.53 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.54 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.54 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.54 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.54 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.54 PM (5).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.54 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.55 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.55 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.55 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.55 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.55 PM (5).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.55 PM (5).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.55 PM (6).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.55 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.56 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.56 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.56 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.56 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.56 PM (5).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.56 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 1.10.45 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.59 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.59 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.59 PM (5).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.39.59 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.29 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.29 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.29 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.30 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.30 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.30 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.31 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.31 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.31 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.31 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.31 PM (5).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.31 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.32 PM (1).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.32 PM (2).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.32 PM (3).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.32 PM (4).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.32 PM (5).jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.32 PM.jpeg",
  "image/WhatsApp Image 2026-08-07 at 12.59.33 PM.jpeg",
  "image/WhatsApp Image 2026-08-12 at 12.26.21 PM (1).jpeg"
];
const totalPhotos = recentPhotos.length;
let selectedPhoto = 0;

function getPhotoUrl(index) {
  return encodeURI(`./${recentPhotos[index]}`);
}

function renderGallery() {
  photoCount.textContent = totalPhotos;
  photoGrid.innerHTML = Array.from({ length: totalPhotos }, (_, index) => `
    <button class="photo-card" type="button" style="--index: ${index}" data-photo-index="${index}" aria-label="Ouvrir la photo ${index + 1}">
      <img src="${getPhotoUrl(index)}" alt="Photo communautaire ${index + 1}" loading="lazy" />
      <span class="photo-card__number">${String(index + 1).padStart(3, "0")}</span>
      <span class="photo-card__caption">Photo communautaire ${index + 1}</span>
    </button>
  `).join("");
}

function showPhoto(index) {
  selectedPhoto = (index + totalPhotos) % totalPhotos;
  lightboxImage.src = getPhotoUrl(selectedPhoto);
  lightboxImage.alt = `Souvenir communautaire ${selectedPhoto + 1}`;
  lightboxCaption.textContent = `Souvenir communautaire ${selectedPhoto + 1} sur ${totalPhotos}`;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = "";
}

photoGrid.addEventListener("click", (event) => {
  const card = event.target.closest("[data-photo-index]");
  if (card) showPhoto(Number(card.dataset.photoIndex));
});
document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
document.getElementById("previousPhoto").addEventListener("click", () => showPhoto(selectedPhoto - 1));
document.getElementById("nextPhoto").addEventListener("click", () => showPhoto(selectedPhoto + 1));
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showPhoto(selectedPhoto - 1);
  if (event.key === "ArrowRight") showPhoto(selectedPhoto + 1);
});

renderGallery();