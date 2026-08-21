/* =====================================================
   COMMUNAUTÉ CENTRAFRICAINE AU GHANA
   JAVASCRIPT
===================================================== */


/* ================= LOADER ================= */

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    setTimeout(() => {

        loader.classList.add("hide");

    }, 800);

});


/* ================= HEADER ================= */

const header = document.getElementById("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.classList.add("scrolled");

    } else {

        header.classList.remove("scrolled");

    }

});


/* ================= MOBILE MENU ================= */

const menuBtn = document.getElementById("menuBtn");

const nav = document.getElementById("nav");

menuBtn.addEventListener("click", () => {

    nav.classList.toggle("open");

    const icon = menuBtn.querySelector("i");

    if (nav.classList.contains("open")) {

        icon.classList.remove("fa-bars");

        icon.classList.add("fa-xmark");

    } else {

        icon.classList.remove("fa-xmark");

        icon.classList.add("fa-bars");

    }

});


/* Close mobile menu */

document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", () => {

        nav.classList.remove("open");

        const icon = menuBtn.querySelector("i");

        icon.classList.remove("fa-xmark");

        icon.classList.add("fa-bars");

    });

});


/* ================= ACTIVE NAV ================= */

const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 150;

        if (window.scrollY >= sectionTop) {

            current = section.getAttribute("id");

        }

    });


    document.querySelectorAll(".nav-link").forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + current) {

            link.classList.add("active");

        }

    });

});


/* ================= REVEAL ================= */

const revealElements = document.querySelectorAll(".reveal");


const revealObserver = new IntersectionObserver(

    entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                revealObserver.unobserve(entry.target);

            }

        });

    },

    {
        threshold: .12
    }

);


revealElements.forEach(element => {

    revealObserver.observe(element);

});


/* ================= COUNTERS ================= */

const counters = document.querySelectorAll(".counter");

let counterStarted = false;


function startCounters() {

    if (counterStarted) return;

    counterStarted = true;


    counters.forEach(counter => {

        const target = Number(counter.dataset.target);

        let current = 0;

        const duration = 1600;

        const increment = target / (duration / 16);


        const update = () => {

            current += increment;

            if (current < target) {

                counter.textContent = Math.floor(current);

                requestAnimationFrame(update);

            } else {

                counter.textContent = target;

            }

        };


        update();

    });

}


const statsSection = document.querySelector(".stats");


const counterObserver = new IntersectionObserver(

    entries => {

        if (entries[0].isIntersecting) {

            startCounters();

        }

    },

    {
        threshold: .3
    }

);


counterObserver.observe(statsSection);


/* ================= GALLERY FILTER ================= */

const filterButtons =
    document.querySelectorAll(".filter-btn");

const galleryItems =
    document.querySelectorAll(".gallery-item");


filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(btn => {

            btn.classList.remove("active");

        });

        button.classList.add("active");


        const filter = button.dataset.filter;


        galleryItems.forEach(item => {

            if (
                filter === "all" ||
                item.classList.contains(filter)
            ) {

                item.style.display = "block";

                setTimeout(() => {

                    item.style.opacity = "1";

                    item.style.transform = "scale(1)";

                }, 50);

            } else {

                item.style.opacity = "0";

                item.style.transform = "scale(.8)";

                setTimeout(() => {

                    item.style.display = "none";

                }, 300);

            }

        });

    });

});


/* ================= LIGHTBOX ================= */

const lightbox =
    document.getElementById("lightbox");

const lightboxImage =
    document.getElementById("lightboxImage");

const closeLightbox =
    document.querySelector(".lightbox-close");


document.querySelectorAll(".gallery-item").forEach(item => {

    item.addEventListener("click", () => {

        const image = item.querySelector("img");

        lightboxImage.src = image.src;

        lightbox.classList.add("active");

        document.body.style.overflow = "hidden";

    });

});


closeLightbox.addEventListener("click", closeLightboxFunction);


lightbox.addEventListener("click", event => {

    if (event.target === lightbox) {

        closeLightboxFunction();

    }

});


function closeLightboxFunction() {

    lightbox.classList.remove("active");

    document.body.style.overflow = "";

}


/* ESC */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeLightboxFunction();

    }

});


/* ================= CONTACT FORM ================= */

const contactForm =
    document.getElementById("contactForm");


contactForm.addEventListener("submit", event => {

    event.preventDefault();


    const button =
        contactForm.querySelector("button");


    const originalText =
        button.innerHTML;


    button.innerHTML =
        '<i class="fa-solid fa-check"></i> Message envoyé';


    button.style.background =
        "#159447";


    button.style.color =
        "white";


    contactForm.reset();


    setTimeout(() => {

        button.innerHTML = originalText;

        button.style.background = "";

        button.style.color = "";

    }, 3000);

});


/* ================= LANGUAGE ================= */

const languageBtn =
    document.getElementById("languageBtn");


languageBtn.addEventListener("click", () => {

    alert(
        "La version anglaise peut être ajoutée dans une deuxième page : index-en.html"
    );

});


/* ================= PARALLAX HERO ================= */

const hero = document.querySelector(".hero");


window.addEventListener("scroll", () => {

    const scroll = window.scrollY;

    if (scroll < 700) {

        hero.style.backgroundPositionY =
            `${scroll * .25}px`;

    }

});/* =====================================================
   COMMUNAUTÉ CENTRAFRICAINE AU GHANA
   JAVASCRIPT
===================================================== */


/* ================= LOADER ================= */

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    setTimeout(() => {

        loader.classList.add("hide");

    }, 800);

});


/* ================= HEADER ================= */

const header = document.getElementById("header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.classList.add("scrolled");

    } else {

        header.classList.remove("scrolled");

    }

});


/* ================= MOBILE MENU ================= */

const menuBtn = document.getElementById("menuBtn");

const nav = document.getElementById("nav");

menuBtn.addEventListener("click", () => {

    nav.classList.toggle("open");

    const icon = menuBtn.querySelector("i");

    if (nav.classList.contains("open")) {

        icon.classList.remove("fa-bars");

        icon.classList.add("fa-xmark");

    } else {

        icon.classList.remove("fa-xmark");

        icon.classList.add("fa-bars");

    }

});


/* Close mobile menu */

document.querySelectorAll(".nav-link").forEach(link => {

    link.addEventListener("click", () => {

        nav.classList.remove("open");

        const icon = menuBtn.querySelector("i");

        icon.classList.remove("fa-xmark");

        icon.classList.add("fa-bars");

    });

});


/* ================= ACTIVE NAV ================= */

const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 150;

        if (window.scrollY >= sectionTop) {

            current = section.getAttribute("id");

        }

    });


    document.querySelectorAll(".nav-link").forEach(link => {

        link.classList.remove("active");

        if (link.getAttribute("href") === "#" + current) {

            link.classList.add("active");

        }

    });

});


/* ================= REVEAL ================= */

const revealElements = document.querySelectorAll(".reveal");


const revealObserver = new IntersectionObserver(

    entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                revealObserver.unobserve(entry.target);

            }

        });

    },

    {
        threshold: .12
    }

);


revealElements.forEach(element => {

    revealObserver.observe(element);

});


/* ================= COUNTERS ================= */

const counters = document.querySelectorAll(".counter");

let counterStarted = false;


function startCounters() {

    if (counterStarted) return;

    counterStarted = true;


    counters.forEach(counter => {

        const target = Number(counter.dataset.target);

        let current = 0;

        const duration = 1600;

        const increment = target / (duration / 16);


        const update = () => {

            current += increment;

            if (current < target) {

                counter.textContent = Math.floor(current);

                requestAnimationFrame(update);

            } else {

                counter.textContent = target;

            }

        };


        update();

    });

}


const statsSection = document.querySelector(".stats");


const counterObserver = new IntersectionObserver(

    entries => {

        if (entries[0].isIntersecting) {

            startCounters();

        }

    },

    {
        threshold: .3
    }

);


counterObserver.observe(statsSection);


/* ================= GALLERY FILTER ================= */

const filterButtons =
    document.querySelectorAll(".filter-btn");

const galleryItems =
    document.querySelectorAll(".gallery-item");


filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(btn => {

            btn.classList.remove("active");

        });

        button.classList.add("active");


        const filter = button.dataset.filter;


        galleryItems.forEach(item => {

            if (
                filter === "all" ||
                item.classList.contains(filter)
            ) {

                item.style.display = "block";

                setTimeout(() => {

                    item.style.opacity = "1";

                    item.style.transform = "scale(1)";

                }, 50);

            } else {

                item.style.opacity = "0";

                item.style.transform = "scale(.8)";

                setTimeout(() => {

                    item.style.display = "none";

                }, 300);

            }

        });

    });

});


/* ================= LIGHTBOX ================= */

const lightbox =
    document.getElementById("lightbox");

const lightboxImage =
    document.getElementById("lightboxImage");

const closeLightbox =
    document.querySelector(".lightbox-close");


document.querySelectorAll(".gallery-item").forEach(item => {

    item.addEventListener("click", () => {

        const image = item.querySelector("img");

        lightboxImage.src = image.src;

        lightbox.classList.add("active");

        document.body.style.overflow = "hidden";

    });

});


closeLightbox.addEventListener("click", closeLightboxFunction);


lightbox.addEventListener("click", event => {

    if (event.target === lightbox) {

        closeLightboxFunction();

    }

});


function closeLightboxFunction() {

    lightbox.classList.remove("active");

    document.body.style.overflow = "";

}


/* ESC */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {

        closeLightboxFunction();

    }

});


/* ================= CONTACT FORM ================= */

const contactForm =
    document.getElementById("contactForm");


contactForm.addEventListener("submit", event => {

    event.preventDefault();


    const button =
        contactForm.querySelector("button");


    const originalText =
        button.innerHTML;


    button.innerHTML =
        '<i class="fa-solid fa-check"></i> Message envoyé';


    button.style.background =
        "#159447";


    button.style.color =
        "white";


    contactForm.reset();


    setTimeout(() => {

        button.innerHTML = originalText;

        button.style.background = "";

        button.style.color = "";

    }, 3000);

});


/* ================= LANGUAGE ================= */

const languageBtn =
    document.getElementById("languageBtn");


languageBtn.addEventListener("click", () => {

    alert(
        "La version anglaise peut être ajoutée dans une deuxième page : index-en.html"
    );

});


/* ================= PARALLAX HERO ================= */

const hero = document.querySelector(".hero");


window.addEventListener("scroll", () => {

    const scroll = window.scrollY;

    if (scroll < 700) {

        hero.style.backgroundPositionY =
            `${scroll * .25}px`;

    }

});