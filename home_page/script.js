// ========================================
// AUTHENTICATION GUARD
// ========================================

function checkAuth() {
    const isSessionLoggedIn = sessionStorage.getItem("kisanSetuLoggedIn") === "true";
    const isLocalLoggedIn = localStorage.getItem("kisanSetuLoggedIn") === "true";

    if (!isSessionLoggedIn && !isLocalLoggedIn) {
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("kisanSetuUser");
        localStorage.removeItem("kisanSetuLoggedIn");
        sessionStorage.clear();
        window.location.replace("../Login/login.html");
    } else if (!isSessionLoggedIn && isLocalLoggedIn) {
        sessionStorage.setItem("kisanSetuLoggedIn", "true");
        sessionStorage.setItem("loggedInUser", localStorage.getItem("loggedInUser") || "");
        sessionStorage.setItem("kisanSetuUser", localStorage.getItem("kisanSetuUser") || "");
    }
}

checkAuth();

window.addEventListener("pageshow", function () {
    checkAuth();
});

const menuItems = [
    { id: "home", icon: "🏠", label: "मुख्यपृष्ठ" },
    { id: "profile", icon: "👤", label: "माझी माहिती" },
    { id: "crops", icon: "🌱", label: "पिकांची माहिती" },
    { id: "booking", icon: "🧾", label: "स्लॉट बुकिंग" },
    { id: "myBooking", icon: "🧺", label: "माझी बुकिंग" },
    { id: "liveQueue", icon: "📄", label: "लाईव्ह रांग" },
    { id: "purchase", icon: "⏱️", label: "खरेदीची स्थिती" },
    { id: "payment", icon: "📍", label: "देयक स्थिती" },
    { id: "notification", icon: "🔔", label: "सूचना" },
    { id: "complaint", icon: "📝", label: "तक्रार / अभिप्राय" },
    { id: "help", icon: "❓", label: "मदत व संपर्क" }
];

let activeTab = "home";


const defaultUser = {
    userId: "KS1001",
    name: "शेतकरी मित्र",
    mobile: ""
};


// ========================================
// GET USER
// ========================================

function getUser() {
    try {
        let loggedIn = null;
        let kisanUser = null;

        const rawLoggedIn = localStorage.getItem("loggedInUser");
        if (rawLoggedIn) {
            try { loggedIn = JSON.parse(rawLoggedIn); } catch (e) {}
        }

        const rawKisan = localStorage.getItem("kisanSetuUser");
        if (rawKisan) {
            try { kisanUser = JSON.parse(rawKisan); } catch (e) {}
        }

        let name = defaultUser.name;
        let userId = defaultUser.userId;
        let mobile = defaultUser.mobile;

        if (loggedIn && loggedIn.name && loggedIn.name !== "संकट पाटील") {
            name = loggedIn.name;
        } else if (kisanUser && (kisanUser.full_name || kisanUser.name)) {
            name = kisanUser.full_name || kisanUser.name;
        } else if (loggedIn && loggedIn.name) {
            name = loggedIn.name;
        }

        if (loggedIn && loggedIn.userId) {
            userId = loggedIn.userId;
        } else if (kisanUser && kisanUser.farmer_id) {
            userId = "KS" + kisanUser.farmer_id;
        }

        if (loggedIn && loggedIn.mobile) {
            mobile = loggedIn.mobile;
        } else if (kisanUser && (kisanUser.mobile_number || kisanUser.mobile)) {
            mobile = kisanUser.mobile_number || kisanUser.mobile;
        }

        return {
            userId: userId,
            name: name,
            mobile: mobile
        };

    } catch (error) {
        return defaultUser;
    }
}


// ========================================
// UPDATE USER INFORMATION
// ========================================

function updateUserUI() {
    const currentUser = getUser();

    const profileName =
        document.getElementById("profileName");

    const profileUserId =
        document.getElementById("profileUserId");

    const profileInfoUserId =
        document.getElementById("profileInfoUserId");

    const profileMobile =
        document.getElementById("profileMobile");

    const drawerName =
        document.getElementById("drawerName");

    const drawerUserId =
        document.getElementById("drawerUserId");

    const welcomeName =
        document.getElementById("welcomeName");

    const welcomeUserId =
        document.getElementById("welcomeUserId");


    if (profileName) {
        profileName.textContent = currentUser.name;
    }

    if (profileUserId) {
        profileUserId.textContent = currentUser.userId;
    }

    if (profileInfoUserId) {
        profileInfoUserId.textContent = currentUser.userId;
    }

    if (profileMobile) {
        profileMobile.textContent = currentUser.mobile || "-";
    }

    if (drawerName) {
        drawerName.textContent = currentUser.name;
    }

    if (drawerUserId) {
        drawerUserId.textContent = currentUser.userId;
    }

    if (welcomeName) {
        welcomeName.textContent = currentUser.name;
    }

    if (welcomeUserId) {
        welcomeUserId.textContent = currentUser.userId;
    }
}


// ========================================
// CREATE MENU
// ========================================

function createDrawerMenu() {

    const drawerMenu =
        document.getElementById("drawerMenu");


    if (!drawerMenu) {

        return;

    }


    drawerMenu.innerHTML = "";


    menuItems.forEach(function (item) {

        const button =
            document.createElement("button");


        button.type = "button";

        button.className =
            "drawer-item";


        if (activeTab === item.id) {

            button.classList.add("active");

        }


        button.setAttribute(
            "data-menu-id",
            item.id
        );


        const icon =
            document.createElement("span");


        icon.className =
            "drawer-item-icon";


        icon.textContent =
            item.icon;


        const label =
            document.createElement("span");


        label.className =
            "drawer-item-label";


        label.textContent =
            item.label;


        const arrow =
            document.createElement("span");


        arrow.className =
            "drawer-item-arrow";


        arrow.textContent = "›";


        button.appendChild(icon);

        button.appendChild(label);

        button.appendChild(arrow);


        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                handleMenuClick(item.id);

            }
        );


        drawerMenu.appendChild(button);

    });


    // ========================================
    // LOGOUT BUTTON
    // ========================================

    const logoutButton =
        document.createElement("button");


    logoutButton.type = "button";


    logoutButton.className =
        "drawer-item logout-item";


    logoutButton.innerHTML = `
        <span class="drawer-item-icon">🚪</span>
        <span class="drawer-item-label">लॉगआउट</span>
        <span class="drawer-item-arrow">›</span>
    `;


    logoutButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            handleLogout();

        }
    );


    drawerMenu.appendChild(logoutButton);

}





// ========================================
// OPEN THREE DOT / MENU DRAWER
// ========================================

function openMenu() {

    const overlay =
        document.getElementById("menuOverlay");


    const drawer =
        document.getElementById("sideDrawer");


    if (!overlay || !drawer) {

        return;

    }


    overlay.hidden = false;

    overlay.style.display = "block";

    drawer.style.display = "block";


    // Force drawer to LEFT side

    drawer.style.left = "0";

    drawer.style.right = "auto";

    drawer.style.transform =
        "translateX(0)";


    document.body.style.overflow =
        "hidden";


    requestAnimationFrame(function () {

        overlay.classList.add(
            "menu-visible"
        );

        drawer.classList.add(
            "drawer-visible"
        );

    });

}


// ========================================
// CLOSE MENU DRAWER
// ========================================

function closeMenu() {

    const overlay =
        document.getElementById("menuOverlay");


    const drawer =
        document.getElementById("sideDrawer");


    if (!overlay || !drawer) {

        return;

    }


    drawer.classList.remove(
        "drawer-visible"
    );


    overlay.classList.remove(
        "menu-visible"
    );


    setTimeout(function () {

        overlay.style.display = "none";

        overlay.hidden = true;

        drawer.style.display = "";

        drawer.style.transform = "";

        document.body.style.overflow = "";

    }, 200);

}


// ========================================
// MENU ITEM CLICK
// ========================================

function handleMenuClick(id) {

    activeTab = id;


    // Update active menu

    createDrawerMenu();


    // Close drawer

    closeMenu();


    // ========================================
    // HOME
    // ========================================

    if (id === "home") {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

        return;

    }


    // ========================================
    // PROFILE
    // ========================================

    if (id === "profile") {

        const popup =
            document.getElementById(
                "profilePopup"
            );


        if (popup) {

            popup.hidden = false;

            popup.style.display =
                "block";

        }

        return;

    }


    // ========================================
    // CROP INFORMATION
    // ========================================

    if (id === "crops") {

        window.location.href =
            "../crop_information/crop-information.html";

        return;

    }


    // ========================================
    // SLOT BOOKING
    // ========================================

    if (id === "slotBooking" || id === "booking") {

        window.location.href =
            "../slot_booking/slot-booking.html";

        return;

    }


    // ========================================
    // MY BOOKING
    // ========================================

    if (id === "myBooking") {

        window.location.href =
            "../my_booking/my-booking.html";

        return;

    }


    // ========================================
    // LIVE QUEUE
    // ========================================

    if (id === "liveQueue") {

        window.location.href =
            "../live_queue/live-queue.html";

        return;

    }


    // ========================================
    // PURCHASE / PROCUREMENT STATUS
    // ========================================

    if (id === "purchase") {

        window.location.href =
            "../procurement_status/procurement-status.html";

        return;

    }


    // ========================================
    // PAYMENT STATUS
    // ========================================

    if (id === "payment") {

        window.location.href =
            "../payment_status/payment-status.html";

        return;

    }


    // ========================================
    // NOTIFICATIONS
    // ========================================

    if (id === "notification") {

        window.location.href =
            "../notifications/notifications.html";

        return;

    }


    // ========================================
    // COMPLAINT / FEEDBACK
    // ========================================

    if (id === "complaint") {

        window.location.href =
            "./complaints/complaint.html";

        return;

    }


    // ========================================
    // HELP / CONTACT
    // ========================================

    if (id === "help") {

        window.location.href =
            "../help/help.html";

        return;

    }


    // ========================================
    // OTHER TABS
    // ========================================

    const selected =
        menuItems.find(
            function (item) {

                return item.id === id;

            }
        );


    if (selected) {

        alert(
            selected.label +
            " विभाग लवकरच उपलब्ध होईल."
        );

    }

}


// ========================================
// LOGOUT
// ========================================

function handleLogout() {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("kisanSetuUser");
    localStorage.removeItem("kisanSetuLoggedIn");
    window.location.replace("../Login/login.html");
}


// ========================================
// OPEN MENU BUTTON
// ========================================

const menuButton =
    document.getElementById("menuBtn");


if (menuButton) {

    menuButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            openMenu();

        }
    );

}


// ========================================
// CLOSE DRAWER BUTTON
// ========================================

const drawerClose =
    document.getElementById("drawerClose");


if (drawerClose) {

    drawerClose.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            closeMenu();

        }
    );

}


// ========================================
// CLICK OUTSIDE DRAWER
// ========================================

const menuOverlay =
    document.getElementById("menuOverlay");


if (menuOverlay) {

    menuOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                menuOverlay
            ) {

                closeMenu();

            }

        }
    );

}


// ========================================
// PROFILE BUTTON
// ========================================

const profileButton =
    document.getElementById("profileBtn");


if (profileButton) {

    profileButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();


            const popup =
                document.getElementById(
                    "profilePopup"
                );


            if (!popup) {

                return;

            }


            if (popup.hidden) {

                popup.hidden = false;

                popup.style.display =
                    "block";

            } else {

                popup.hidden = true;

                popup.style.display =
                    "none";

            }

        }
    );

}


// ========================================
// CLOSE PROFILE
// ========================================

const profileClose =
    document.getElementById(
        "profileClose"
    );


if (profileClose) {

    profileClose.addEventListener(
        "click",
        function () {

            const popup =
                document.getElementById(
                    "profilePopup"
                );


            if (popup) {

                popup.hidden = true;

                popup.style.display =
                    "none";

            }

        }
    );

}


// ========================================
// NOTIFICATION
// ========================================

const notificationButton =
    document.getElementById(
        "notificationBtn"
    );


if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        function () {

            handleMenuClick(
                "notification"
            );

        }
    );

}


// ========================================
// VIEW PROFILE
// ========================================

const viewProfileButton =
    document.getElementById(
        "viewProfileBtn"
    );


if (viewProfileButton) {

    viewProfileButton.addEventListener(
        "click",
        function () {

            const popup =
                document.getElementById(
                    "profilePopup"
                );


            if (popup) {

                popup.hidden = true;

                popup.style.display =
                    "none";

            }


            handleMenuClick(
                "profile"
            );

        }
    );

}


// ========================================
// HOME SERVICE CARDS
// ========================================

document.querySelectorAll(
    "[data-tab]"
).forEach(function (button) {

    button.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            const tab =
                button.getAttribute(
                    "data-tab"
                );


            if (tab) {

                handleMenuClick(tab);

            }

        }
    );

});


// ========================================
// ESCAPE KEY
// ========================================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeMenu();


            const popup =
                document.getElementById(
                    "profilePopup"
                );


            if (popup) {

                popup.hidden = true;

                popup.style.display =
                    "none";

            }

        }

    }
);


// ========================================
// INITIALIZE
// ========================================

updateUserUI();

createDrawerMenu();


// Listen for storage changes if updated in another tab/page
window.addEventListener("storage", function () {
    updateUserUI();
});