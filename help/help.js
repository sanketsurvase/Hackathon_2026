/* =========================================
   MOBILE MENU
========================================= */

const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

if (menuBtn && mobileMenu) {

    menuBtn.addEventListener("click", function () {

        mobileMenu.classList.toggle("show");

        const icon = menuBtn.querySelector("i");

        if (icon) {

            if (mobileMenu.classList.contains("show")) {
                icon.classList.remove("fa-bars");
                icon.classList.add("fa-xmark");
            } else {
                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
            }

        }
    });
}


/* =========================================
   MOBILE MENU LINK CLICK
========================================= */

const mobileLinks =
    document.querySelectorAll(".mobile-menu a");

mobileLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        if (mobileMenu) {
            mobileMenu.classList.remove("show");
        }

        const icon = menuBtn
            ? menuBtn.querySelector("i")
            : null;

        if (icon) {
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
        }

    });
});


/* =========================================
   FAQ ACCORDION
========================================= */

const faqQuestions =
    document.querySelectorAll(".faq-question");

faqQuestions.forEach(function (question) {

    question.addEventListener("click", function () {

        const currentItem =
            this.closest(".faq-item");

        if (!currentItem) return;

        const currentAnswer =
            currentItem.querySelector(".faq-answer");

        if (!currentAnswer) return;

        const isOpen =
            currentItem.classList.contains("active");


        /* Close all FAQ items */

        document
            .querySelectorAll(".faq-item")
            .forEach(function (item) {

                item.classList.remove("active");

                const answer =
                    item.querySelector(".faq-answer");

                if (answer) {
                    answer.style.maxHeight = null;
                }
            });


        /* Open clicked FAQ */

        if (!isOpen) {

            currentItem.classList.add("active");

            currentAnswer.style.maxHeight =
                currentAnswer.scrollHeight + "px";
        }

    });
});


/* =========================================
   CATEGORY SCROLL
========================================= */

function scrollToSection(sectionId) {

    const section =
        document.getElementById(sectionId);

    if (!section) {
        return;
    }


    /*
     * Header height
     * This prevents the FAQ heading from
     * hiding behind the sticky header.
     */

    const header =
        document.querySelector(".header");

    const headerHeight =
        header ? header.offsetHeight : 0;


    const sectionPosition =
        section.getBoundingClientRect().top +
        window.pageYOffset -
        headerHeight -
        15;


    window.scrollTo({
        top: sectionPosition,
        behavior: "smooth"
    });


    /*
     * Open the first FAQ of that section
     */

    const firstItem =
        section.querySelector(".faq-item");

    if (firstItem) {

        const question =
            firstItem.querySelector(".faq-question");

        if (question) {

            setTimeout(function () {

                if (
                    !firstItem.classList.contains("active")
                ) {
                    question.click();
                }

            }, 400);
        }
    }
}


/* =========================================
   HELP INFORMATION BUTTON
========================================= */

/*
 * The Help Information button should go
 * to the GENERAL HELP section.
 *
 * It will NOT go to the third-last section.
 */

function contactSupport() {

    scrollToSection("general");
}


/* =========================================
   BACK BUTTON
========================================= */

function goBack() {

    if (document.referrer) {

        history.back();

    } else {

        window.location.href =
            "../home_page/home.html";
    }
}


/* =========================================
   WINDOW RESIZE
========================================= */

window.addEventListener("resize", function () {

    const activeItem =
        document.querySelector(".faq-item.active");

    if (!activeItem) return;

    const answer =
        activeItem.querySelector(".faq-answer");

    if (answer) {

        answer.style.maxHeight =
            answer.scrollHeight + "px";
    }
});


/* =========================================
   CLOSE MOBILE MENU WHEN CLICKING OUTSIDE
========================================= */

document.addEventListener("click", function (event) {

    if (!menuBtn || !mobileMenu) {
        return;
    }

    const clickedInsideMenu =
        mobileMenu.contains(event.target);

    const clickedMenuButton =
        menuBtn.contains(event.target);

    if (
        !clickedInsideMenu &&
        !clickedMenuButton &&
        mobileMenu.classList.contains("show")
    ) {

        mobileMenu.classList.remove("show");

        const icon =
            menuBtn.querySelector("i");

        if (icon) {

            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
        }
    }
});


/* =========================================
   ESC KEY
========================================= */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        if (
            mobileMenu &&
            mobileMenu.classList.contains("show")
        ) {

            mobileMenu.classList.remove("show");

            const icon =
                menuBtn
                    ? menuBtn.querySelector("i")
                    : null;

            if (icon) {

                icon.classList.remove("fa-xmark");
                icon.classList.add("fa-bars");
            }
        }
    }
});