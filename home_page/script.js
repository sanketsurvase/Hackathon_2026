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
    userId: "KS10245",
    name: "संकट पाटील",
    mobile: "9876543210"
};


// ========================================
// GET USER
// ========================================

function getUser() {

    try {

        const savedUser =
            localStorage.getItem("loggedInUser");

        if (savedUser) {

            return {
                ...defaultUser,
                ...JSON.parse(savedUser)
            };

        }

        return defaultUser;

    } catch (error) {

        return defaultUser;

    }

}


const user = getUser();


// ========================================
// UPDATE USER INFORMATION
// ========================================

function updateUserUI() {

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

        profileName.textContent =
            user.name;

    }


    if (profileUserId) {

        profileUserId.textContent =
            user.userId;

    }


    if (profileInfoUserId) {

        profileInfoUserId.textContent =
            user.userId;

    }


    if (profileMobile) {

        profileMobile.textContent =
            user.mobile;

    }


    if (drawerName) {

        drawerName.textContent =
            user.name;

    }


    if (drawerUserId) {

        drawerUserId.textContent =
            user.userId;

    }


    if (welcomeName) {

        welcomeName.textContent =
            user.name;

    }


    if (welcomeUserId) {

        welcomeUserId.textContent =
            user.userId;

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

    const confirmLogout =
        confirm(
            "तुम्हाला खात्री आहे का की तुम्हाला लॉगआउट करायचे आहे?"
        );


    if (!confirmLogout) {

        return;

    }


    localStorage.removeItem(
        "loggedInUser"
    );


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


    alert(
        "आपण यशस्वीरित्या लॉगआउट झाला आहात."
    );


    window.location.reload();

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


// ========================================
// SAVE DEFAULT USER
// ========================================

if (
    !localStorage.getItem(
        "loggedInUser"
    )
) {

    localStorage.setItem(
        "loggedInUser",
        JSON.stringify(defaultUser)
    );

}