/* ==========================================
   CCG WEBSITE JAVASCRIPT
   Communauté de Centrafrique du Ghana
========================================== */



// ================================
// MENU MOBILE
// ================================


const menuBtn = document.querySelector(".menu-btn");
const navbar = document.querySelector("#navbar");


menuBtn.addEventListener("click",()=>{

    navbar.classList.toggle("active");

});



// Fermer le menu après clic sur un lien

document.querySelectorAll("nav a").forEach(link=>{


    link.addEventListener("click",()=>{

        navbar.classList.remove("active");

    });


});







// ================================
// HEADER SCROLL EFFECT
// ================================


window.addEventListener("scroll",()=>{


const header=document.querySelector("header");


if(window.scrollY > 50){

header.style.background="rgba(255,255,255,0.98)";

header.style.boxShadow=
"0 10px 30px rgba(0,0,0,0.15)";

}

else{


header.style.background=
"rgba(255,255,255,0.9)";


header.style.boxShadow=
"0 5px 20px rgba(0,0,0,0.08)";


}


});








// ================================
// ANIMATION AU SCROLL
// ================================


const observer = new IntersectionObserver((entries)=>{


entries.forEach(entry=>{


if(entry.isIntersecting){


entry.target.style.opacity="1";

entry.target.style.transform="translateY(0)";


}


});


},
{

threshold:0.15

});



document.querySelectorAll(".section, .new-section, .member, .card, .new-card, .values div")
.forEach(element=>{


element.style.opacity="0";

element.style.transform="translateY(50px)";

element.style.transition="0.8s ease";


observer.observe(element);


});

const newCards = document.querySelectorAll('.new-card');
newCards.forEach(card => {
    card.addEventListener('click', () => {
        const title = card.querySelector('h3')?.textContent || 'Carte';
        alert(`${title} sélectionnée.`);
    });
});

// ================================
// RECHERCHE DE DOCUMENTS
// ================================

const documentSearchInput = document.querySelector('#document-search-input');

if (documentSearchInput) {
    const documentCards = [...document.querySelectorAll('[data-document-card]')];
    const documentSearchStatus = document.querySelector('#document-search-status');
    const documentNoResults = document.querySelector('#document-no-results');
    const clearDocumentSearch = document.querySelector('#clear-document-search');

    const filterDocuments = () => {
        const query = documentSearchInput.value.trim().toLocaleLowerCase('fr');
        let visibleCount = 0;

        documentCards.forEach((card) => {
            const matches = card.textContent.toLocaleLowerCase('fr').includes(query);
            card.hidden = !matches;
            if (matches) visibleCount += 1;
        });

        documentSearchStatus.textContent = query
            ? `${visibleCount} document${visibleCount > 1 ? 's' : ''} trouvé${visibleCount > 1 ? 's' : ''}`
            : `${documentCards.length} documents disponibles`;
        documentNoResults.hidden = visibleCount !== 0;
        clearDocumentSearch.hidden = !query;
    };

    documentSearchInput.addEventListener('input', filterDocuments);
    clearDocumentSearch.addEventListener('click', () => {
        documentSearchInput.value = '';
        filterDocuments();
        documentSearchInput.focus();
    });
}








// ================================
// GALERIE LIGHTBOX
// ================================


const galleryImages =
document.querySelectorAll(".gallery img");



const lightbox=document.createElement("div");


lightbox.className="lightbox";


lightbox.innerHTML=`

<img src="" alt="image">

<span class="close">
&times;
</span>

`;



document.body.appendChild(lightbox);



const lightboxImage =
lightbox.querySelector("img");

const closeBtn =
lightbox.querySelector(".close");



galleryImages.forEach(image=>{


image.addEventListener("click",()=>{


lightbox.style.display="flex";


lightboxImage.src=image.src;


});


});



closeBtn.onclick=()=>{


lightbox.style.display="none";


};



lightbox.onclick=(e)=>{


if(e.target !== lightboxImage){

lightbox.style.display="none";

}


};







// ================================
// STYLE LIGHTBOX AUTOMATIQUE
// ================================


const style=document.createElement("style");


style.innerHTML=`

.lightbox{

position:fixed;

top:0;

left:0;

width:100%;

height:100%;

background:rgba(0,0,0,.9);

display:none;

justify-content:center;

align-items:center;

z-index:2000;

}


.lightbox img{

max-width:90%;

max-height:85%;

border-radius:20px;

animation:zoom .5s;

}


.close{

position:absolute;

top:30px;

right:50px;

font-size:50px;

color:white;

cursor:pointer;

}



@keyframes zoom{

from{

transform:scale(.5);

opacity:0;

}

to{

transform:scale(1);

opacity:1;

}

}

`;


document.head.appendChild(style);









// ================================
// FORMULAIRE INSCRIPTION
// ================================



const form=document.querySelector(".form");


form.addEventListener("submit",(e)=>{


e.preventDefault();



alert(

"Merci pour votre inscription à la Communauté de Centrafrique du Ghana (CCG). Votre demande sera traitée prochainement."

);



form.reset();



});









// ================================
// WHATSAPP MESSAGE AUTOMATIQUE
// ================================



const whatsapp =
document.querySelector(".whatsapp");



whatsapp.addEventListener("click",()=>{


const message =
"Bonjour, je souhaite rejoindre la Communauté de Centrafrique du Ghana (CCG).";


const number =
"233000000000";



whatsapp.href =
"https://wa.me/"+number+
"?text="+encodeURIComponent(message);



});









// ================================
// ANNEE AUTOMATIQUE FOOTER
// ================================


const year =
new Date().getFullYear();



const footerText =
document.querySelector("footer p");



if(footerText){


footerText.innerHTML =

"© "+year+
" Communauté de Centrafrique du Ghana (CCG). Tous droits réservés.";


}









// ================================
// DARK MODE OPTION
// ================================


const darkButton=document.createElement("button");


darkButton.innerHTML="🌙";


darkButton.className="dark-mode-btn";


document.body.appendChild(darkButton);



darkButton.onclick=()=>{


document.body.classList.toggle("dark");


};


// CARROUSEL DES TÃ‰MOIGNAGES
function setupTestimonials() {
  const slider = document.querySelector('.testimonial-slider');
  if (!slider) return;

  const cards = Array.from(slider.querySelectorAll('.testimonial-card'));
  const prev = document.querySelector('#prevTestimonial');
  const next = document.querySelector('#nextTestimonial');
  if (!cards.length || !prev || !next) return;

  let index = Math.max(0, cards.findIndex(card => card.classList.contains('active')));
  let autoplay;

  function showSlide(newIndex) {
    index = (newIndex + cards.length) % cards.length;
    cards.forEach((card, cardIndex) => {
      card.classList.toggle('active', cardIndex === index);
      card.setAttribute('aria-hidden', String(cardIndex !== index));
    });
  }

  function startAutoplay() {
    clearInterval(autoplay);
    autoplay = setInterval(() => showSlide(index + 1), 6000);
  }

  prev.addEventListener('click', () => {
    showSlide(index - 1);
    startAutoplay();
  });

  next.addEventListener('click', () => {
    showSlide(index + 1);
    startAutoplay();
  });

  slider.addEventListener('mouseenter', () => clearInterval(autoplay));
  slider.addEventListener('mouseleave', startAutoplay);
  slider.addEventListener('focusin', () => clearInterval(autoplay));
  slider.addEventListener('focusout', startAutoplay);

  showSlide(index);
  startAutoplay();
}

setupTestimonials();





// DARK MODE STYLE

const darkStyle=document.createElement("style");


darkStyle.innerHTML=`

.dark{

background:#111;

color:white;

}



.dark header{

background:#1c1c1c;

}



.dark .card,

.dark .member,

.dark .values div,

.dark .president-card{

background:#222;

color:white;

}



.dark .title{

color:#FFD700;

}



.dark-mode-btn{

position:fixed;

left:25px;

bottom:25px;

width:50px;

height:50px;

border-radius:50%;

border:none;

cursor:pointer;

font-size:22px;

z-index:999;

}


`;


document.head.appendChild(darkStyle);


/* =========================================
   CENTRAL AFRICAN COMMUNITY
   200 PHOTO GALLERY
========================================= */


/* =========================================
   VARIABLES
========================================= */

const galleryGrid = document.getElementById("galleryGrid");

const searchInput = document.getElementById("gallerySearch");

const filterButtons =
    document.querySelectorAll(".filter-btn");

const noResults =
    document.getElementById("noResults");

const loadMoreButton =
    document.getElementById("loadMore");

const photoCount =
    document.getElementById("photoCount");


const lightbox =
    document.getElementById("lightbox");

const lightboxImage =
    document.getElementById("lightboxImage");

const lightboxTitle =
    document.getElementById("lightboxTitle");

const lightboxCategory =
    document.getElementById("lightboxCategory");

const lightboxNumber =
    document.getElementById("lightboxNumber");

const lightboxClose =
    document.getElementById("lightboxClose");

const lightboxPrev =
    document.getElementById("lightboxPrev");

const lightboxNext =
    document.getElementById("lightboxNext");


let currentFilter = "all";

let searchTerm = "";

let currentPhoto = 0;

let visiblePhotos = 20;


/* =========================================
   CATEGORY DATA
========================================= */

const categories = [
    "events",
    "community",
    "culture",
    "sports",
    "students",
    "meetings"
];


/* =========================================
   GENERATE 200 PHOTOS
========================================= */

function generatePhotos() {

    /*
        We already have 5 example photos
        inside HTML.

        Generate photos 006 to 200.
    */

    for (let i = 6; i <= 200; i++) {

        const number =
            String(i).padStart(3, "0");

        const category =
            categories[(i - 1) % categories.length];

        const item =
            document.createElement("article");

        item.className = "gallery-item";

        item.dataset.category = category;

        item.dataset.title =
            `${capitalize(category)} ${number}`;

        item.innerHTML = `

            <img
                src="images/gallery/photo-${number}.jpg"
                alt="Central African Community ${category} photo ${number}"
                loading="lazy"
            >

            <div class="photo-overlay">

                <div>

                    <span>
                        ${category.toUpperCase()}
                    </span>

                    <h3>
                        ${capitalize(category)} ${number}
                    </h3>

                </div>

                <button
                    class="view-photo"
                    aria-label="View photo ${number}"
                >
                    ＋
                </button>

            </div>

        `;

        galleryGrid.appendChild(item);
    }

    photoCount.textContent = "200";
}


/* =========================================
   CAPITALIZE
========================================= */

function capitalize(text) {

    return text.charAt(0).toUpperCase()
        + text.slice(1);

}


/* =========================================
   FILTER PHOTOS
========================================= */

function filterPhotos() {

    const items =
        [...document.querySelectorAll(".gallery-item")];

    let matchingItems = [];

    items.forEach(item => {

        const category =
            item.dataset.category;

        const title =
            item.dataset.title.toLowerCase();

        const matchesFilter =
            currentFilter === "all"
            || category === currentFilter;

        const matchesSearch =
            title.includes(searchTerm);

        if (
            matchesFilter &&
            matchesSearch
        ) {

            matchingItems.push(item);

        }

    });


    items.forEach(item => {

        item.classList.add("hidden");

    });


    matchingItems
        .slice(0, visiblePhotos)
        .forEach(item => {

            item.classList.remove("hidden");

        });


    noResults.style.display =
        matchingItems.length === 0
            ? "block"
            : "none";


    if (
        matchingItems.length >
        visiblePhotos
    ) {

        loadMoreButton.style.display =
            "block";

    } else {

        loadMoreButton.style.display =
            "none";

    }

}


/* =========================================
   FILTER BUTTONS
========================================= */

filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            filterButtons.forEach(btn => {

                btn.classList.remove("active");

            });

            button.classList.add("active");

            currentFilter =
                button.dataset.filter;

            visiblePhotos = 20;

            filterPhotos();

        }
    );

});


/* =========================================
   SEARCH
========================================= */

searchInput.addEventListener(
    "input",
    event => {

        searchTerm =
            event.target.value
                .trim()
                .toLowerCase();

        visiblePhotos = 20;

        filterPhotos();

    }
);


/* =========================================
   LOAD MORE
========================================= */

loadMoreButton.addEventListener(
    "click",
    () => {

        visiblePhotos += 20;

        filterPhotos();

    }
);


/* =========================================
   LIGHTBOX
========================================= */

function getVisibleItems() {

    return [
        ...document.querySelectorAll(
            ".gallery-item:not(.hidden)"
        )
    ];

}


function openLightbox(item) {

    const visibleItems =
        getVisibleItems();

    currentPhoto =
        visibleItems.indexOf(item);

    if (currentPhoto < 0) {

        currentPhoto = 0;

    }

    showLightboxPhoto();

    lightbox.classList.add("active");

    document.body.style.overflow = "hidden";

}


function showLightboxPhoto() {

    const items =
        getVisibleItems();

    if (!items.length) return;

    const item =
        items[currentPhoto];

    const image =
        item.querySelector("img");

    const title =
        item.dataset.title;

    const category =
        item.dataset.category;

    lightboxImage.src =
        image.src;

    lightboxImage.alt =
        image.alt;

    lightboxTitle.textContent =
        title;

    lightboxCategory.textContent =
        category.toUpperCase();

    lightboxNumber.textContent =
        `Photo ${currentPhoto + 1} / ${items.length}`;

}


/* =========================================
   OPEN PHOTO
========================================= */

galleryGrid.addEventListener(
    "click",
    event => {

        const item =
            event.target.closest(".gallery-item");

        if (!item) return;

        openLightbox(item);

    }
);


/* =========================================
   CLOSE LIGHTBOX
========================================= */

function closeLightbox() {

    lightbox.classList.remove("active");

    document.body.style.overflow = "";

}


lightboxClose.addEventListener(
    "click",
    closeLightbox
);


/* =========================================
   NEXT PHOTO
========================================= */

function nextPhoto() {

    const items =
        getVisibleItems();

    if (!items.length) return;

    currentPhoto =
        (currentPhoto + 1) % items.length;

    showLightboxPhoto();

}


lightboxNext.addEventListener(
    "click",
    nextPhoto
);


/* =========================================
   PREVIOUS PHOTO
========================================= */

function previousPhoto() {

    const items =
        getVisibleItems();

    if (!items.length) return;

    currentPhoto =
        (currentPhoto - 1 + items.length)
        % items.length;

    showLightboxPhoto();

}


lightboxPrev.addEventListener(
    "click",
    previousPhoto
);


/* =========================================
   KEYBOARD NAVIGATION
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            !lightbox.classList.contains("active")
        ) {
            return;
        }


        if (event.key === "Escape") {

            closeLightbox();

        }


        if (event.key === "ArrowRight") {

            nextPhoto();

        }


        if (event.key === "ArrowLeft") {

            previousPhoto();

        }

    }
);


/* =========================================
   CLICK OUTSIDE IMAGE
========================================= */

lightbox.addEventListener(
    "click",
    event => {

        if (event.target === lightbox) {

            closeLightbox();

        }

    }
);


/* =========================================
   TOUCH SWIPE
========================================= */

let touchStartX = 0;

let touchEndX = 0;


lightbox.addEventListener(
    "touchstart",
    event => {

        touchStartX =
            event.changedTouches[0].screenX;

    },
    { passive: true }
);


lightbox.addEventListener(
    "touchend",
    event => {

        touchEndX =
            event.changedTouches[0].screenX;

        const distance =
            touchEndX - touchStartX;


        if (Math.abs(distance) < 50) {
            return;
        }


        if (distance < 0) {

            nextPhoto();

        } else {

            previousPhoto();

        }

    },
    { passive: true }
);


/* =========================================
   SCROLL REVEAL ANIMATION
========================================= */

const revealElements =
    document.querySelectorAll(".reveal");


const revealObserver =
    new IntersectionObserver(
        entries => {

            entries.forEach(entry => {

                if (entry.isIntersecting) {

                    entry.target.classList.add(
                        "visible"
                    );

                    revealObserver.unobserve(
                        entry.target
                    );

                }

            });

        },
        {
            threshold: 0.15
        }
    );


revealElements.forEach(element => {

    revealObserver.observe(element);

});


/* =========================================
   INITIALIZE
========================================= */

generatePhotos();

filterPhotos();



/* =========================================
   GALERIE COMMUNAUTÉ 🇨🇫
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* ================================
       FILTRES
    ================================= */

    const filterButtons =
        document.querySelectorAll(".filter-btn");

    const categories =
        document.querySelectorAll(".gallery-category");


    filterButtons.forEach(button => {

        button.addEventListener("click", () => {

            const target =
                button.dataset.filter;


            /* Bouton actif */

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");


            /* Cacher les catégories */

            categories.forEach(category => {
                category.classList.remove("active");
            });


            /* Afficher la catégorie */

            const selected =
                document.getElementById(target);

            if (selected) {

                selected.classList.add("active");

                animatePhotos(selected);

            }

        });

    });


    /* ================================
       ANIMATION DES PHOTOS
    ================================= */

    function animatePhotos(category) {

        const photos =
            category.querySelectorAll(".gallery-item");


        photos.forEach((photo, index) => {

            photo.style.animation = "none";

            /* Force le navigateur à recalculer */

            void photo.offsetWidth;

            photo.style.animation =
                `photoAppear .6s ease forwards`;

            photo.style.animationDelay =
                `${Math.min(index * 0.04, 0.8)}s`;

        });

    }


    /* ================================
       LIGHTBOX
    ================================= */

    const lightbox =
        document.getElementById("lightbox");

    const lightboxImage =
        document.getElementById("lightboxImage");

    const lightboxCaption =
        document.getElementById("lightboxCaption");

    const closeButton =
        document.getElementById("lightboxClose");

    const previousButton =
        document.getElementById("lightboxPrev");

    const nextButton =
        document.getElementById("lightboxNext");


    let currentPhotos = [];

    let currentIndex = 0;


    /* ================================
       RÉCUPÉRER LES PHOTOS
    ================================= */

    function getCurrentPhotos() {

        const activeCategory =
            document.querySelector(
                ".gallery-category.active"
            );

        if (!activeCategory) {
            return [];
        }

        return Array.from(
            activeCategory.querySelectorAll(
                ".gallery-item"
            )
        );

    }


    /* ================================
       OUVRIR LIGHTBOX
    ================================= */

    function openLightbox(photo, index) {

        const image =
            photo.querySelector("img");

        const title =
            photo.querySelector("h4");


        if (!image) return;


        lightboxImage.src =
            image.src;

        lightboxImage.alt =
            image.alt;


        lightboxCaption.textContent =
            title
                ? title.textContent
                : image.alt;


        currentIndex = index;


        lightbox.classList.add("active");

        document.body.style.overflow = "hidden";

    }


    /* ================================
       CLIQUER PHOTO
    ================================= */

    document.addEventListener("click", event => {

        const photo =
            event.target.closest(".gallery-item");


        if (!photo) return;


        currentPhotos =
            getCurrentPhotos();


        const index =
            currentPhotos.indexOf(photo);


        openLightbox(photo, index);

    });


    /* ================================
       FERMER
    ================================= */

    function closeLightbox() {

        lightbox.classList.remove("active");

        document.body.style.overflow = "";

    }


    closeButton.addEventListener(
        "click",
        closeLightbox
    );


    /* ================================
       PHOTO SUIVANTE
    ================================= */

    function showNext() {

        if (!currentPhotos.length) return;


        currentIndex =
            (currentIndex + 1) %
            currentPhotos.length;


        openLightbox(
            currentPhotos[currentIndex],
            currentIndex
        );

    }


    /* ================================
       PHOTO PRÉCÉDENTE
    ================================= */

    function showPrevious() {

        if (!currentPhotos.length) return;


        currentIndex =
            (currentIndex - 1 +
            currentPhotos.length) %
            currentPhotos.length;


        openLightbox(
            currentPhotos[currentIndex],
            currentIndex
        );

    }


    nextButton.addEventListener(
        "click",
        showNext
    );


    previousButton.addEventListener(
        "click",
        showPrevious
    );


    /* ================================
       FERMER EN CLIQUANT À L'EXTÉRIEUR
    ================================= */

    lightbox.addEventListener(
        "click",
        event => {

            if (
                event.target === lightbox
            ) {

                closeLightbox();

            }

        }
    );


    /* ================================
       CLAVIER
    ================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                !lightbox.classList.contains(
                    "active"
                )
            ) {
                return;
            }


            if (event.key === "Escape") {
                closeLightbox();
            }


            if (event.key === "ArrowRight") {
                showNext();
            }


            if (event.key === "ArrowLeft") {
                showPrevious();
            }

        }
    );


    /* ================================
       SWIPE MOBILE
    ================================= */

    let touchStartX = 0;
    let touchEndX = 0;


    lightbox.addEventListener(
        "touchstart",
        event => {

            touchStartX =
                event.changedTouches[0].screenX;

        }
    );


    lightbox.addEventListener(
        "touchend",
        event => {

            touchEndX =
                event.changedTouches[0].screenX;

            handleSwipe();

        }
    );


    function handleSwipe() {

        const distance =
            touchEndX - touchStartX;


        if (Math.abs(distance) < 50) {
            return;
        }


        if (distance < 0) {
            showNext();
        } else {
            showPrevious();
        }

    }

});