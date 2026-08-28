"use strict";

/* =====================================================
   CCG 🇨🇫🇬🇭
   JAVASCRIPT PRINCIPAL
===================================================== */


/* =====================================================
   DOM READY
===================================================== */

document.addEventListener("DOMContentLoaded", () => {


    /* =================================================
       ELEMENTS
    ================================================= */

    const header =
        document.getElementById("navbar");

    const navMenu =
        document.getElementById("navMenu");

    const menuToggle =
        document.getElementById("menuToggle");

    const navLinks =
        document.querySelectorAll(
            ".nav-link[href^='#']"
        );


    /* =================================================
       LOADER
    ================================================= */

    const loader =
        document.getElementById("loader");

    if (loader) {

        setTimeout(() => {

            loader.classList.add("hide");

        }, 800);

    }


    /* =================================================
       HEADER SCROLL
    ================================================= */

    function updateHeader() {

        if (!header) return;

        if (window.scrollY > 50) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    }

    window.addEventListener(
        "scroll",
        updateHeader,
        { passive: true }
    );

    updateHeader();


    /* =================================================
       MOBILE MENU
    ================================================= */

    function openMenu() {

        if (!navMenu || !menuToggle) return;

        navMenu.classList.add("active");

        menuToggle.classList.add("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.classList.add(
            "menu-open"
        );

    }


    function closeMenu() {

        if (!navMenu || !menuToggle) return;

        navMenu.classList.remove("active");

        menuToggle.classList.remove("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove(
            "menu-open"
        );

    }


    function toggleMenu() {

        if (!navMenu) return;

        if (
            navMenu.classList.contains("active")
        ) {

            closeMenu();

        } else {

            openMenu();

        }

    }


    if (menuToggle) {

        menuToggle.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                event.stopPropagation();

                toggleMenu();

            }
        );

    }


    /* =================================================
       NAVIGATION
    ================================================= */

    navLinks.forEach(link => {

        link.addEventListener(
            "click",
            (event) => {

                const href =
                    link.getAttribute("href");

                if (
                    !href ||
                    href === "#"
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


                const position =
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    headerHeight;


                window.scrollTo({

                    top: Math.max(
                        0,
                        position
                    ),

                    behavior: "smooth"

                });

            }
        );

    });


    /* =================================================
       CLICK OUTSIDE
    ================================================= */

    document.addEventListener(
        "click",
        (event) => {

            if (!navMenu || !menuToggle) {
                return;
            }

            if (
                !navMenu.contains(event.target) &&
                !menuToggle.contains(event.target)
            ) {

                closeMenu();

            }

        }
    );


    /* =================================================
       ESCAPE
    ================================================= */

    document.addEventListener(
        "keydown",
        (event) => {

            if (event.key === "Escape") {

                closeMenu();

                closeLightbox();

            }

        }
    );


    /* =================================================
       RESIZE
    ================================================= */

    window.addEventListener(
        "resize",
        () => {

            if (window.innerWidth > 1050) {

                closeMenu();

            }

        }
    );


    /* =================================================
       ACTIVE NAVIGATION
    ================================================= */

    const sections =
        document.querySelectorAll(
            "section[id]"
        );


    function updateActiveNavigation() {

        if (!sections.length) return;

        let current = "";


        const scrollPosition =
            window.scrollY +
            (header
                ? header.offsetHeight
                : 80) +
            150;


        sections.forEach(section => {

            const top =
                section.offsetTop;

            const bottom =
                top +
                section.offsetHeight;


            if (
                scrollPosition >= top &&
                scrollPosition < bottom
            ) {

                current =
                    section.id;

            }

        });


        navLinks.forEach(link => {

            link.classList.remove(
                "active"
            );


            if (
                link.getAttribute("href") ===
                `#${current}`
            ) {

                link.classList.add(
                    "active"
                );

            }

        });

    }


    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        { passive: true }
    );


    updateActiveNavigation();


    /* =================================================
       REVEAL ANIMATION
    ================================================= */

    const revealElements =
        document.querySelectorAll(
            ".reveal"
        );


    if (
        "IntersectionObserver" in window
    ) {

        const observer =
            new IntersectionObserver(
                (entries) => {

                    entries.forEach(
                        entry => {

                            if (
                                entry.isIntersecting
                            ) {

                                entry.target.classList.add(
                                    "visible"
                                );

                                entry.target.classList.add(
                                    "active"
                                );

                                observer.unobserve(
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

                observer.observe(
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


    /* =================================================
       SCROLL TOP
    ================================================= */

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


    /* =================================================
       CONTACT FORM — EMAILJS
    ================================================= */

    const contactForm =
        document.getElementById(
            "contactForm"
        );

    const contactStatus =
        document.getElementById(
            "contactStatus"
        );

    const contactSubmit =
        document.getElementById(
            "contactSubmit"
        );


    if (contactForm) {

        contactForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                if (
                    typeof emailjs ===
                    "undefined"
                ) {

                    console.error(
                        "EmailJS n'est pas chargé."
                    );

                    if (contactStatus) {

                        contactStatus.textContent =
                            "Erreur : EmailJS n'est pas chargé.";

                        contactStatus.className =
                            "form-status error";

                    }

                    return;

                }


                const buttonText =
                    contactSubmit
                        ? contactSubmit.querySelector(
                            "span"
                        )
                        : null;


                if (contactSubmit) {

                    contactSubmit.disabled =
                        true;

                }


                if (buttonText) {

                    buttonText.textContent =
                        "Envoi en cours...";

                }


                if (contactStatus) {

                    contactStatus.textContent =
                        "";

                    contactStatus.className =
                        "form-status";

                }


                try {

                    await emailjs.sendForm(

                        "service_dsdyaw8",

                        "template_xdezry7",

                        contactForm

                    );


                    if (contactStatus) {

                        contactStatus.textContent =
                            "✓ Votre message a été envoyé avec succès !";

                        contactStatus.className =
                            "form-status success";

                    }


                    contactForm.reset();


                } catch (error) {

                    console.error(
                        "EmailJS Contact Error:",
                        error
                    );


                    if (contactStatus) {

                        contactStatus.textContent =
                            "✕ Impossible d'envoyer le message. Veuillez réessayer.";

                        contactStatus.className =
                            "form-status error";

                    }

                }


                if (contactSubmit) {

                    contactSubmit.disabled =
                        false;

                }


                if (buttonText) {

                    buttonText.textContent =
                        "Envoyer le message";

                }

            }
        );

    }


    /* =================================================
       MEMBERSHIP FORM — EMAILJS
    ================================================= */

    const membershipForm =
        document.getElementById(
            "membershipForm"
        );

    const membershipStatus =
        document.getElementById(
            "membershipStatus"
        );

    const membershipSubmit =
        document.getElementById(
            "membershipSubmit"
        );

    const memberDate =
        document.getElementById(
            "memberDate"
        );


    if (membershipForm) {


        membershipForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                /* Vérification EmailJS */

                if (
                    typeof emailjs ===
                    "undefined"
                ) {

                    console.error(
                        "EmailJS n'est pas chargé."
                    );

                    if (membershipStatus) {

                        membershipStatus.textContent =
                            "Erreur : EmailJS n'est pas chargé.";

                        membershipStatus.className =
                            "form-status error";

                    }

                    return;

                }


                /* DATE */

                if (memberDate) {

                    const today =
                        new Date();


                    memberDate.value =
                        today.toLocaleDateString(
                            "fr-FR",
                            {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric"
                            }
                        );

                }


                /* BOUTON */

                if (membershipSubmit) {

                    membershipSubmit.disabled =
                        true;

                }


                const buttonText =
                    membershipSubmit
                        ? membershipSubmit.querySelector(
                            "span"
                        )
                        : null;


                if (buttonText) {

                    buttonText.textContent =
                        "Inscription en cours...";

                }


                if (membershipStatus) {

                    membershipStatus.textContent =
                        "";

                    membershipStatus.className =
                        "form-status";

                }


                /* ENVOI */

                try {

                    await emailjs.sendForm(

                        "service_dsdyaw8",

                        "template_2f89i0q",

                        membershipForm

                    );


                    /* SUCCÈS */

                    if (membershipStatus) {

                        membershipStatus.textContent =
                            "✓ Votre inscription a été envoyée avec succès. Bienvenue dans la CCG 🇨🇫🇬🇭 !";

                        membershipStatus.className =
                            "form-status success";

                    }


                    membershipForm.reset();


                } catch (error) {

                    console.error(
                        "EmailJS Membership Error:",
                        error
                    );


                    if (membershipStatus) {

                        membershipStatus.textContent =
                            "✕ Impossible d'envoyer votre inscription. Veuillez réessayer.";

                        membershipStatus.className =
                            "form-status error";

                    }

                }


                /* RÉACTIVER */

                if (membershipSubmit) {

                    membershipSubmit.disabled =
                        false;

                }


                if (buttonText) {

                    buttonText.textContent =
                        "S'inscrire";

                }

            }
        );

    }


    /* =================================================
       LIGHTBOX
    ================================================= */

    const lightbox =
        document.getElementById(
            "lightbox"
        );

    const lightboxImage =
        document.getElementById(
            "lightboxImage"
        );

    const lightboxClose =
        document.querySelector(
            ".lightbox-close"
        );


    function openLightbox(src) {

        if (
            !lightbox ||
            !lightboxImage
        ) {
            return;
        }


        lightboxImage.src =
            src;


        lightbox.classList.add(
            "active"
        );


        document.body.style.overflow =
            "hidden";

    }


    function closeLightbox() {

        if (!lightbox) return;


        lightbox.classList.remove(
            "active"
        );


        document.body.style.overflow =
            "";

    }


    document
        .querySelectorAll(
            ".gallery-item img"
        )
        .forEach(image => {

            image.addEventListener(
                "click",
                () => {

                    openLightbox(
                        image.src
                    );

                }
            );

        });


    if (lightboxClose) {

        lightboxClose.addEventListener(
            "click",
            closeLightbox
        );

    }


    if (lightbox) {

        lightbox.addEventListener(
            "click",
            (event) => {

                if (
                    event.target ===
                    lightbox
                ) {

                    closeLightbox();

                }

            }
        );

    }


    /* =================================================
       WHATSAPP
    ================================================= */

    window.closeWhatsApp =
        function () {

            const message =
                document.querySelector(
                    ".whatsapp-message"
                );


            if (message) {

                message.style.display =
                    "none";

            }

        };


    /* =================================================
       PARALLAX
    ================================================= */

    const hero =
        document.querySelector(
            ".hero"
        );


    if (hero) {

        window.addEventListener(
            "scroll",
            () => {

                if (
                    window.scrollY <
                    700
                ) {

                    hero.style.backgroundPositionY =
                        `${window.scrollY * 0.2}px`;

                }

            },
            { passive: true }
        );

    }


    /* =================================================
       CARD HOVER
    ================================================= */

    const cards =
        document.querySelectorAll(
            ".news-card, .event-card"
        );


    cards.forEach(card => {

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
                    (y - centerY) / 35;


                const rotateY =
                    (centerX - x) / 35;


                card.style.transform =
                    `perspective(1000px)
                     rotateX(${rotateX}deg)
                     rotateY(${rotateY}deg)
                     translateY(-5px)`;

            }
        );


        card.addEventListener(
            "mouseleave",
            () => {

                card.style.transform =
                    "";

            }
        );

    });


    /* =================================================
       CONSOLE
    ================================================= */

    console.log(
        "🇨🇫🇬🇭 CCG — Site chargé avec succès."
    );

});

/* =====================================================
   TESTIMONIAL SLIDER
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    const testimonials =
        document.querySelectorAll(".testimonial-card");

    const nextButton =
        document.getElementById("nextTestimonial");

    const prevButton =
        document.getElementById("prevTestimonial");

    const dotsContainer =
        document.getElementById("testimonialDots");


    if (
        !testimonials.length ||
        !nextButton ||
        !prevButton
    ) {
        return;
    }


    let currentIndex = 0;

    let autoSlide;


    /* =================================================
       CREATE DOTS
    ================================================= */

    testimonials.forEach((_, index) => {

        const dot = document.createElement("span");

        dot.classList.add("testimonial-dot");

        if (index === 0) {
            dot.classList.add("active");
        }

        dot.addEventListener("click", () => {

            showTestimonial(index);

            restartAutoSlide();

        });

        dotsContainer.appendChild(dot);

    });


    const dots =
        document.querySelectorAll(".testimonial-dot");


    /* =================================================
       SHOW TESTIMONIAL
    ================================================= */

    function showTestimonial(index) {

        testimonials.forEach((testimonial) => {

            testimonial.classList.remove("active");

        });


        dots.forEach((dot) => {

            dot.classList.remove("active");

        });


        testimonials[index].classList.add("active");

        dots[index].classList.add("active");


        currentIndex = index;

    }


    /* =================================================
       NEXT
    ================================================= */

    function nextTestimonial() {

        let nextIndex =
            currentIndex + 1;

        if (nextIndex >= testimonials.length) {

            nextIndex = 0;

        }

        showTestimonial(nextIndex);

    }


    /* =================================================
       PREVIOUS
    ================================================= */

    function previousTestimonial() {

        let previousIndex =
            currentIndex - 1;

        if (previousIndex < 0) {

            previousIndex =
                testimonials.length - 1;

        }

        showTestimonial(previousIndex);

    }


    /* =================================================
       BUTTON EVENTS
    ================================================= */

    nextButton.addEventListener(
        "click",
        function () {

            nextTestimonial();

            restartAutoSlide();

        }
    );


    prevButton.addEventListener(
        "click",
        function () {

            previousTestimonial();

            restartAutoSlide();

        }
    );


    /* =================================================
       AUTO SLIDE
    ================================================= */

    function startAutoSlide() {

        autoSlide = setInterval(() => {

            nextTestimonial();

        }, 5000);

    }


    /* =================================================
       RESTART AUTO SLIDE
    ================================================= */

    function restartAutoSlide() {

        clearInterval(autoSlide);

        startAutoSlide();

    }


    /* =================================================
       START
    ================================================= */

    startAutoSlide();


    /* =================================================
       PAUSE WHEN MOUSE IS OVER SLIDER
    ================================================= */

    const slider =
        document.querySelector(".testimonial-slider");


    slider.addEventListener(
        "mouseenter",
        () => {

            clearInterval(autoSlide);

        }
    );


    slider.addEventListener(
        "mouseleave",
        () => {

            startAutoSlide();

        }
    );


});