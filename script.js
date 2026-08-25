"use strict";

/* =====================================================
   COMMUNAUTÉ CENTRAFRICAINE AU GHANA 🇨🇫🇬🇭
   JAVASCRIPT PRINCIPAL — VERSION CORRIGÉE
===================================================== */


/* =====================================================
   LOADER
===================================================== */

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    if (!loader) return;

    setTimeout(() => {
        loader.classList.add("hide");
    }, 800);

});


/* =====================================================
   ELEMENTS NAVIGATION
===================================================== */

const header = document.getElementById("navbar") ||
               document.getElementById("header");

const navMenu = document.getElementById("navMenu") ||
                document.getElementById("nav-menu") ||
                document.getElementById("nav");

const menuToggle = document.getElementById("menuToggle") ||
                   document.getElementById("menu-toggle") ||
                   document.getElementById("menuBtn");

const navLinks = document.querySelectorAll(
    ".nav-link[href^='#']"
);


/* =====================================================
   HEADER SCROLL
===================================================== */

function updateHeader() {

    if (!header) return;

    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }

}


/* =====================================================
   MOBILE MENU
===================================================== */

function openMenu() {

    if (!navMenu || !menuToggle) return;

    navMenu.classList.add("active");
    navMenu.classList.add("open");

    menuToggle.classList.add("active");

    menuToggle.setAttribute(
        "aria-expanded",
        "true"
    );

    document.body.classList.add("menu-open");

}


function closeMenu() {

    if (!navMenu || !menuToggle) return;

    navMenu.classList.remove("active");
    navMenu.classList.remove("open");

    menuToggle.classList.remove("active");

    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.classList.remove("menu-open");

}


function toggleMenu() {

    if (!navMenu) return;

    const isOpen =
        navMenu.classList.contains("active") ||
        navMenu.classList.contains("open");

    if (isOpen) {
        closeMenu();
    } else {
        openMenu();
    }

}


if (menuToggle) {

    menuToggle.setAttribute(
        "aria-expanded",
        "false"
    );

    menuToggle.addEventListener(
        "click",
        (event) => {

            event.preventDefault();
            event.stopPropagation();

            toggleMenu();

        }
    );

}


/* =====================================================
   NAVIGATION LINKS
===================================================== */

navLinks.forEach(link => {

    link.addEventListener(
        "click",
        event => {

            const href =
                link.getAttribute("href");

            if (
                !href ||
                href === "#" ||
                !href.startsWith("#")
            ) {
                return;
            }

            const target =
                document.querySelector(href);

            if (!target) return;

            event.preventDefault();

            closeMenu();

            const headerHeight =
                header
                    ? header.offsetHeight
                    : 0;

            const targetPosition =
                target.getBoundingClientRect().top +
                window.scrollY -
                headerHeight;

            window.scrollTo({

                top: Math.max(
                    0,
                    targetPosition
                ),

                behavior: "smooth"

            });

        }
    );

});


/* =====================================================
   ACTIVE NAVIGATION
===================================================== */

const sections =
    document.querySelectorAll(
        "section[id]"
    );


function updateActiveNavigation() {

    if (!sections.length) return;

    let currentSection = "";

    const scrollPosition =
        window.scrollY +
        (header ? header.offsetHeight : 80) +
        100;


    sections.forEach(section => {

        const sectionTop =
            section.offsetTop;

        const sectionBottom =
            sectionTop +
            section.offsetHeight;


        if (
            scrollPosition >= sectionTop &&
            scrollPosition < sectionBottom
        ) {

            currentSection =
                section.getAttribute("id");

        }

    });


    navLinks.forEach(link => {

        link.classList.remove("active");

        const href =
            link.getAttribute("href");

        if (
            href ===
            `#${currentSection}`
        ) {

            link.classList.add("active");

        }

    });

}


window.addEventListener(
    "scroll",
    updateActiveNavigation
);


/* =====================================================
   ESCAPE — FERMER MENU
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeMenu();

        }

    }
);


/* =====================================================
   CLICK OUTSIDE
===================================================== */

document.addEventListener(
    "click",
    event => {

        if (!navMenu || !menuToggle) return;

        const clickedMenu =
            navMenu.contains(event.target);

        const clickedButton =
            menuToggle.contains(event.target);

        if (
            !clickedMenu &&
            !clickedButton
        ) {

            closeMenu();

        }

    }
);


/* =====================================================
   RESIZE
===================================================== */

window.addEventListener(
    "resize",
    () => {

        if (window.innerWidth > 1050) {

            closeMenu();

        }

    }
);


/* =====================================================
   DARK / LIGHT MODE
===================================================== */

const themeButton =
    document.getElementById("theme-btn");

const savedTheme =
    localStorage.getItem("ccg-theme");


if (
    themeButton &&
    savedTheme === "dark"
) {

    document.body.classList.add("dark");

    themeButton.innerHTML =
        '<i class="fa-solid fa-sun"></i>';

}


if (themeButton) {

    themeButton.addEventListener(
        "click",
        () => {

            document.body.classList.toggle(
                "dark"
            );

            const isDark =
                document.body.classList.contains(
                    "dark"
                );


            if (isDark) {

                themeButton.innerHTML =
                    '<i class="fa-solid fa-sun"></i>';

                localStorage.setItem(
                    "ccg-theme",
                    "dark"
                );

            } else {

                themeButton.innerHTML =
                    '<i class="fa-solid fa-moon"></i>';

                localStorage.setItem(
                    "ccg-theme",
                    "light"
                );

            }

        }
    );

}


/* =====================================================
   REVEAL ANIMATION
===================================================== */

const revealElements =
    document.querySelectorAll(
        ".reveal"
    );


if (
    "IntersectionObserver" in window
) {

    const revealObserver =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target.classList.add(
                                "visible"
                            );

                            revealObserver.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.12
            }
        );


    revealElements.forEach(
        element => {

            revealObserver.observe(
                element
            );

        }
    );

} else {

    revealElements.forEach(
        element => {

            element.classList.add(
                "visible"
            );

        }
    );

}


/* =====================================================
   COUNTERS
===================================================== */

const counters =
    document.querySelectorAll(
        ".counter"
    );

const statsSection =
    document.querySelector(
        ".stats"
    );

let counterStarted = false;


function startCounters() {

    if (counterStarted) return;

    counterStarted = true;


    counters.forEach(counter => {

        const target =
            Number(
                counter.dataset.target
            );

        if (isNaN(target)) return;


        let current = 0;

        const duration = 1600;

        const startTime =
            performance.now();


        function updateCounter(
            currentTime
        ) {

            const elapsed =
                currentTime -
                startTime;

            const progress =
                Math.min(
                    elapsed / duration,
                    1
                );


            const easedProgress =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );


            current =
                Math.floor(
                    easedProgress *
                    target
                );


            counter.textContent =
                current;


            if (progress < 1) {

                requestAnimationFrame(
                    updateCounter
                );

            } else {

                counter.textContent =
                    target;

            }

        }


        requestAnimationFrame(
            updateCounter
        );

    });

}


if (
    statsSection &&
    "IntersectionObserver" in window
) {

    const counterObserver =
        new IntersectionObserver(
            entries => {

                if (
                    entries[0] &&
                    entries[0].isIntersecting
                ) {

                    startCounters();

                    counterObserver.disconnect();

                }

            },
            {
                threshold: 0.3
            }
        );


    counterObserver.observe(
        statsSection
    );

}


/* =====================================================
   GALLERY FILTER
===================================================== */

const filterButtons =
    document.querySelectorAll(
        ".filter-btn"
    );

const galleryItems =
    document.querySelectorAll(
        ".gallery-item"
    );


filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            filterButtons.forEach(
                btn => {
                    btn.classList.remove(
                        "active"
                    );
                }
            );


            button.classList.add(
                "active"
            );


            const filter =
                button.dataset.filter;


            galleryItems.forEach(
                item => {

                    const matches =
                        filter === "all" ||
                        item.classList.contains(
                            filter
                        );


                    if (matches) {

                        item.style.display =
                            "block";

                        requestAnimationFrame(
                            () => {

                                item.style.opacity =
                                    "1";

                                item.style.transform =
                                    "scale(1)";

                            }
                        );

                    } else {

                        item.style.opacity =
                            "0";

                        item.style.transform =
                            "scale(.8)";


                        setTimeout(
                            () => {

                                item.style.display =
                                    "none";

                            },
                            300
                        );

                    }

                }
            );

        }
    );

});


/* =====================================================
   LIGHTBOX
===================================================== */

const lightbox =
    document.getElementById(
        "lightbox"
    );

const lightboxImage =
    document.getElementById(
        "lightboxImage"
    );

const closeLightbox =
    document.querySelector(
        ".lightbox-close"
    );


function openLightbox(
    imageSrc
) {

    if (
        !lightbox ||
        !lightboxImage
    ) return;


    lightboxImage.src =
        imageSrc;

    lightbox.classList.add(
        "active"
    );

    document.body.style.overflow =
        "hidden";

}


function closeLightboxFunction() {

    if (!lightbox) return;

    lightbox.classList.remove(
        "active"
    );

    document.body.style.overflow =
        "";

}


document
    .querySelectorAll(
        ".gallery-item"
    )
    .forEach(item => {

        item.addEventListener(
            "click",
            () => {

                const image =
                    item.querySelector(
                        "img"
                    );

                if (!image) return;

                openLightbox(
                    image.src
                );

            }
        );

    });


if (closeLightbox) {

    closeLightbox.addEventListener(
        "click",
        closeLightboxFunction
    );

}


if (lightbox) {

    lightbox.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                lightbox
            ) {

                closeLightboxFunction();

            }

        }
    );

}


/* =====================================================
   ESCAPE LIGHTBOX
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeLightboxFunction();

        }

    }
);


/* =====================================================
   CONTACT FORM
===================================================== */

const contactForm =
    document.getElementById(
        "contactForm"
    );


if (contactForm) {

    contactForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const button =
                contactForm.querySelector(
                    "button"
                );


            if (!button) return;


            const originalText =
                button.innerHTML;


            button.innerHTML =
                '<i class="fa-solid fa-check"></i> Message envoyé';


            button.style.background =
                "#159447";

            button.style.color =
                "#ffffff";


            contactForm.reset();


            setTimeout(
                () => {

                    button.innerHTML =
                        originalText;

                    button.style.background =
                        "";

                    button.style.color =
                        "";

                },
                3000
            );

        }
    );

}


/* =====================================================
   LANGUAGE
===================================================== */

const languageBtn =
    document.getElementById(
        "languageBtn"
    );


if (languageBtn) {

    languageBtn.addEventListener(
        "click",
        () => {

            alert(
                "La version anglaise sera disponible prochainement."
            );

        }
    );

}


/* =====================================================
   PARALLAX HERO
===================================================== */

const hero =
    document.querySelector(
        ".hero"
    );


function updateParallax() {

    if (!hero) return;


    const scroll =
        window.scrollY;


    if (scroll < 700) {

        hero.style.backgroundPositionY =
            `${scroll * 0.25}px`;

    }

}


window.addEventListener(
    "scroll",
    updateParallax
);


/* =====================================================
   INITIALISATION
===================================================== */

updateHeader();

updateActiveNavigation();

updateParallax();


console.log(
    "🇨🇫 CCG — JavaScript chargé avec succès."
);


/* ================================
   WHATSAPP SYSTEM
================================ */

function closeWhatsApp() {

    const message = document.querySelector(".whatsapp-message");

    if (message) {
        message.style.display = "none";
    }

}


/* =========================
   EVENTS REVEAL ANIMATION
========================= */

const revealElement = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("active");

                revealObserver.unobserve(entry.target);

            }

        });

    },
    {
        threshold: 0.15
    }
);

revealElements.forEach((element) => {
    revealObserver.observe(element);
});


/* =========================
   ACTUALITÉS ANIMATION
========================= */

document.addEventListener("DOMContentLoaded", () => {

    const elements =
        document.querySelectorAll(".reveal");

    const observer =
        new IntersectionObserver(
            (entries) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "active"
                        );

                        observer.unobserve(
                            entry.target
                        );
                    }

                });

            },
            {
                threshold: 0.15
            }
        );

    elements.forEach((element) => {
        observer.observe(element);
    });

});


/* =========================================================
   CCG — PREMIUM PAGE ANIMATION ENGINE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       1. SCROLL REVEAL
    ===================================================== */

    const animatedElements =
        document.querySelectorAll("[data-animation]");

    const revealObserver =
        new IntersectionObserver(
            (entries) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "is-visible"
                        );

                        revealObserver.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -60px 0px"
            }
        );


    animatedElements.forEach((element) => {

        revealObserver.observe(element);

    });


    /* =====================================================
       2. SECTION HEADERS
    ===================================================== */

    const headers = document.querySelectorAll(
        ".section-title, .news-header, .events-header, " +
        ".gallery-header, .about-header, .members-header"
    );

    const headerObserver =
        new IntersectionObserver(
            (entries) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "visible"
                        );

                        headerObserver.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: 0.2
            }
        );


    headers.forEach((header) => {

        headerObserver.observe(header);

    });


    /* =====================================================
       3. AUTOMATIC CARD ANIMATION
    ===================================================== */

    const cardGroups = document.querySelectorAll(
        ".news-grid, " +
        ".events-grid, " +
        ".members-grid, " +
        ".gallery-grid, " +
        ".executive-grid"
    );


    cardGroups.forEach((group) => {

        const cards =
            group.children;

        Array.from(cards).forEach(
            (card, index) => {

                card.classList.add(
                    "stagger-item"
                );

                card.setAttribute(
                    "data-animation",
                    "fade-up"
                );

                card.style.transitionDelay =
                    `${index * 0.08}s`;

                revealObserver.observe(card);

            }
        );

    });


    /* =====================================================
       4. NAVBAR SCROLL
    ===================================================== */

    const nav =
        document.querySelector(
            "header, .navbar, nav"
        );

    const handleNavigation =
        () => {

            if (!nav) return;

            if (window.scrollY > 50) {

                nav.classList.add(
                    "scrolled"
                );

            } else {

                nav.classList.remove(
                    "scrolled"
                );

            }

        };


    window.addEventListener(
        "scroll",
        handleNavigation,
        { passive: true }
    );

    handleNavigation();


    /* =====================================================
       5. SCROLL TOP BUTTON
    ===================================================== */

    const scrollTop =
        document.getElementById(
            "scrollTop"
        );


    if (scrollTop) {

        window.addEventListener(
            "scroll",
            () => {

                if (window.scrollY > 500) {

                    scrollTop.classList.add(
                        "show"
                    );

                } else {

                    scrollTop.classList.remove(
                        "show"
                    );

                }

            },
            { passive: true }
        );


        scrollTop.addEventListener(
            "click",
            () => {

                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });

            }
        );

    }


    /* =====================================================
       6. ACTIVE NAVIGATION
    ===================================================== */

    const sections =
        document.querySelectorAll(
            "section[id]"
        );

    const navLinks =
        document.querySelectorAll(
            "nav a[href^='#'], " +
            ".navbar a[href^='#']"
        );


    const sectionObserver =
        new IntersectionObserver(
            (entries) => {

                entries.forEach(
                    (entry) => {

                        if (
                            entry.isIntersecting
                        ) {

                            const id =
                                entry.target.id;

                            navLinks.forEach(
                                (link) => {

                                    link.classList.remove(
                                        "active"
                                    );

                                    if (
                                        link.getAttribute(
                                            "href"
                                        ) === `#${id}`
                                    ) {

                                        link.classList.add(
                                            "active"
                                        );

                                    }

                                }
                            );

                        }

                    }
                );

            },
            {
                threshold: 0.35
            }
        );


    sections.forEach(
        (section) => {

            sectionObserver.observe(
                section
            );

        }
    );


    /* =====================================================
       7. SMOOTH ANCHOR NAVIGATION
    ===================================================== */

    document.querySelectorAll(
        'a[href^="#"]'
    ).forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                const targetId =
                    link.getAttribute(
                        "href"
                    );

                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }

                const target =
                    document.querySelector(
                        targetId
                    );

                if (!target) return;

                event.preventDefault();

                const navHeight =
                    nav
                        ? nav.offsetHeight
                        : 0;

                const position =
                    target.getBoundingClientRect()
                        .top +
                    window.scrollY -
                    navHeight;

                window.scrollTo({
                    top: position,
                    behavior: "smooth"
                });

            }
        );

    });


    /* =====================================================
       8. PARALLAX HERO
    ===================================================== */

    const hero =
        document.querySelector(
            ".hero"
        );

    const heroBackground =
        document.querySelector(
            ".hero-bg img, " +
            ".hero-bg video, " +
            ".hero img.hero-image"
        );


    if (
        hero &&
        heroBackground &&
        window.matchMedia(
            "(prefers-reduced-motion: no-preference)"
        ).matches
    ) {

        window.addEventListener(
            "scroll",
            () => {

                const scroll =
                    window.scrollY;

                if (scroll < hero.offsetHeight) {

                    heroBackground.style.transform =
                        `translateY(${scroll * 0.15}px) scale(1.02)`;

                }

            },
            { passive: true }
        );

    }


    /* =====================================================
       9. MOUSE MICRO-INTERACTION
    ===================================================== */

    const interactiveCards =
        document.querySelectorAll(
            ".news-card, " +
            ".event-card, " +
            ".member-card"
        );


    interactiveCards.forEach(
        (card) => {

            card.addEventListener(
                "mousemove",
                (event) => {

                    if (
                        window.innerWidth < 768
                    ) {
                        return;
                    }

                    const rect =
                        card.getBoundingClientRect();

                    const x =
                        event.clientX -
                        rect.left;

                    const y =
                        event.clientY -
                        rect.top;

                    const centerX =
                        rect.width / 2;

                    const centerY =
                        rect.height / 2;

                    const rotateX =
                        (y - centerY) /
                        30;

                    const rotateY =
                        (centerX - x) /
                        30;

                    card.style.transform =
                        `perspective(1000px)
                         rotateX(${rotateX}deg)
                         rotateY(${rotateY}deg)
                         translateY(-6px)`;

                }
            );


            card.addEventListener(
                "mouseleave",
                () => {

                    card.style.transform =
                        "";

                }
            );

        }
    );

});


/* =========================================================
   CCG — GALLERY BACKGROUND SLIDESHOW
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const background =
        document.querySelector(".gallery-bg-image");

    if (!background) return;


    const backgrounds = [

        "images/gallery-bg-1.jpg",

        "images/gallery-bg-2.jpg",

        "images/gallery-bg-3.jpg",

        "images/gallery-bg-4.jpg",

        "images/gallery-bg-5.jpg"

    ];


    let current = 0;


    function changeBackground() {

        current++;

        if (current >= backgrounds.length) {
            current = 0;
        }


        background.style.opacity = "0";


        setTimeout(() => {

            background.style.backgroundImage =
                `url("${backgrounds[current]}")`;

            background.style.opacity = "1";

        }, 600);

    }


    background.style.backgroundImage =
        `url("${backgrounds[0]}")`;


    setInterval(
        changeBackground,
        7000
    );

});