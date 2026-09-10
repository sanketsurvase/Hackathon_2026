/* =========================================================
   KISANSETU (किसानसेतू) - HOME PAGE JAVASCRIPT
   Unified with Farmer Login & Sign-Up Portals
   ========================================================= */

const menuItems = [
    { id: "home", icon: "🏠", label: "मुख्यपृष्ठ" },
    { id: "profile", icon: "👤", label: "माझी माहिती" },
    { id: "crops", icon: "🌱", label: "पिकांची माहिती" },
    { id: "booking", icon: "🧾", label: "स्लॉट बुकिंग" },
    { id: "myBooking", icon: "🧺", label: "माझी बुकिंग" },
    { id: "liveQueue", icon: "📄", label: "लाईव्ह रांग" },
    { id: "purchase", icon: "⏱️", label: "खरेदीची स्थिती" },
    { id: "payment", icon: "📍", label: "देयक स्थिती" },
    { id: "notification", icon: "🔔", label: "सरकारी सूचना" },
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
// 1. GET USER INFORMATION FROM SESSION
// ========================================
function getUser() {
    try {
        // First check standard loggedInUser
        const savedUser = localStorage.getItem("loggedInUser");
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed && (parsed.name || parsed.userId)) {
                return { ...defaultUser, ...parsed };
            }
        }

        // Second check KisanSetu session saved by login.js
        const kisanSetuUser = localStorage.getItem("kisanSetuUser");
        if (kisanSetuUser) {
            const parsedKs = JSON.parse(kisanSetuUser);
            if (parsedKs) {
                return {
                    userId: "KS" + (parsedKs.farmer_id || "10245"),
                    name: parsedKs.full_name || defaultUser.name,
                    mobile: parsedKs.mobile_number || defaultUser.mobile
                };
            }
        }

        return defaultUser;
    } catch (error) {
        console.warn("Could not retrieve user session:", error);
        return defaultUser;
    }
}

const user = getUser();

// ========================================
// 2. UPDATE USER INTERFACE
// ========================================
function updateUserUI() {
    const profileName = document.getElementById("profileName");
    const profileUserId = document.getElementById("profileUserId");
    const profileInfoUserId = document.getElementById("profileInfoUserId");
    const profileMobile = document.getElementById("profileMobile");
    const drawerName = document.getElementById("drawerName");
    const drawerUserId = document.getElementById("drawerUserId");
    const welcomeName = document.getElementById("welcomeName");
    const welcomeUserId = document.getElementById("welcomeUserId");
    const navProfileName = document.getElementById("navProfileName");

    if (profileName) profileName.textContent = user.name;
    if (profileUserId) profileUserId.textContent = user.userId;
    if (profileInfoUserId) profileInfoUserId.textContent = user.userId;
    if (profileMobile) profileMobile.textContent = user.mobile;
    if (drawerName) drawerName.textContent = user.name;
    if (drawerUserId) drawerUserId.textContent = user.userId;
    if (welcomeName) welcomeName.textContent = user.name;
    if (welcomeUserId) welcomeUserId.textContent = user.userId;
    if (navProfileName) {
        // Show first name or up to 12 characters
        const firstName = user.name.split(" ")[0] || user.name;
        navProfileName.textContent = firstName;
    }
}

// ========================================
// 3. GENERATE SIDE DRAWER MENU ITEMS
// ========================================
function createDrawerMenu() {
    const drawerMenu = document.getElementById("drawerMenu");
    if (!drawerMenu) return;

    drawerMenu.innerHTML = "";

    menuItems.forEach(function (item) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "drawer-item";

        if (activeTab === item.id) {
            button.classList.add("active");
        }

        button.setAttribute("data-menu-id", item.id);

        const icon = document.createElement("span");
        icon.className = "drawer-item-icon";
        icon.textContent = item.icon;

        const label = document.createElement("span");
        label.className = "drawer-item-label";
        label.textContent = item.label;

        const arrow = document.createElement("span");
        arrow.className = "drawer-item-arrow";
        arrow.textContent = "›";

        button.appendChild(icon);
        button.appendChild(label);
        button.appendChild(arrow);

        button.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            handleMenuClick(item.id);
        });

        drawerMenu.appendChild(button);
    });

    // Logout Button in Drawer
    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.className = "drawer-item logout-item";
    logoutButton.innerHTML = `
        <span class="drawer-item-icon">🚪</span>
        <span class="drawer-item-label">लॉगआउट (Logout)</span>
        <span class="drawer-item-arrow">›</span>
    `;

    logoutButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        handleLogout();
    });

    drawerMenu.appendChild(logoutButton);
}

// ========================================
// 4. DRAWER OPEN / CLOSE
// ========================================
function openMenu() {
    const overlay = document.getElementById("menuOverlay");
    const drawer = document.getElementById("sideDrawer");
    if (!overlay || !drawer) return;

    overlay.hidden = false;
    overlay.style.display = "block";
    drawer.style.display = "flex";

    document.body.style.overflow = "hidden";

    requestAnimationFrame(function () {
        overlay.classList.add("menu-visible");
        drawer.classList.add("drawer-visible");
    });
}

function closeMenu() {
    const overlay = document.getElementById("menuOverlay");
    const drawer = document.getElementById("sideDrawer");
    if (!overlay || !drawer) return;

    drawer.classList.remove("drawer-visible");
    overlay.classList.remove("menu-visible");

    setTimeout(function () {
        overlay.style.display = "none";
        overlay.hidden = true;
        drawer.style.display = "";
        document.body.style.overflow = "";
    }, 250);
}

// ========================================
// 5. PROFILE POPUP MODAL
// ========================================
function toggleProfilePopup() {
    const popup = document.getElementById("profilePopup");
    if (!popup) return;

    if (popup.hidden || popup.style.display === "none") {
        popup.hidden = false;
        popup.style.display = "block";
    } else {
        popup.hidden = true;
        popup.style.display = "none";
    }
}

function closeProfilePopup() {
    const popup = document.getElementById("profilePopup");
    if (popup) {
        popup.hidden = true;
        popup.style.display = "none";
    }
}

// ========================================
// 6. MENU & SERVICE TAB ACTIONS
// ========================================
function handleMenuClick(id) {
    // Standardize slotBooking to booking
    if (id === "slotBooking") {
        id = "booking";
    }

    activeTab = id;
    createDrawerMenu();
    closeMenu();

    if (id === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    if (id === "profile") {
        toggleProfilePopup();
        return;
    }

    if (id === "help") {
        const footer = document.getElementById("footerSection");
        if (footer) {
            footer.scrollIntoView({ behavior: "smooth" });
        }
        return;
    }

    // ========================================
    // PAGE ROUTES
    // ========================================
    const pageRoutes = {
        crops: "../crop_information/crop-information.html",
        slotBooking: "../slot_booking/slot-booking.html",
        booking: "../slot_booking/slot-booking.html",
        myBooking: "../my_booking/my-booking.html",
        liveQueue: "../live_queue/live-queue.html",
        purchase: "../procurement_status/procurement-status.html",
        payment: "../payment_status/payment-status.html",
        notification: "../notifications/notifications.html"
    };

    if (pageRoutes[id]) {
        window.location.href = pageRoutes[id];
        return;
    }

    const selected = menuItems.find(item => item.id === id);
    const serviceName = selected ? selected.label : id;

    // Elegant informational alert matching theme
    alert(`🌿 किसानसेतू: "${serviceName}" विभाग लवकरच कार्यान्वित होईल.`);
}

// ========================================
// 7. LOGOUT FUNCTIONALITY
// ========================================
function handleLogout() {
    const confirmLogout = confirm("तुम्हाला किसानसेतू खात्यातून बाहेर पडायचे (लॉगआउट करायचे) आहे का?");
    if (!confirmLogout) return;

    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("kisanSetuUser");
    localStorage.removeItem("kisanSetuLoggedIn");

    closeMenu();
    closeProfilePopup();

    alert("आपण यशस्वीरित्या लॉगआउट झाला आहात.");

    // Redirect to login page
    window.location.href = "../login/login.html";
}

// ========================================
// 8. EVENT BINDINGS
// ========================================
document.addEventListener("DOMContentLoaded", function () {
    // 1. Initial UI population
    updateUserUI();
    createDrawerMenu();

    // 2. Menu Trigger (Mobile hamburger)
    const menuBtn = document.getElementById("menuBtn");
    if (menuBtn) {
        menuBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            openMenu();
        });
    }

    // 3. Drawer Close Button
    const drawerClose = document.getElementById("drawerClose");
    if (drawerClose) {
        drawerClose.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeMenu();
        });
    }

    // 4. Click outside drawer overlay
    const menuOverlay = document.getElementById("menuOverlay");
    if (menuOverlay) {
        menuOverlay.addEventListener("click", function (e) {
            if (e.target === menuOverlay) {
                closeMenu();
            }
        });
    }

    // 5. Profile Button
    const profileBtn = document.getElementById("profileBtn");
    if (profileBtn) {
        profileBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleProfilePopup();
        });
    }

    // 6. Profile Close Button
    const profileClose = document.getElementById("profileClose");
    if (profileClose) {
        profileClose.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeProfilePopup();
        });
    }

    // 7. View Profile Button
    const viewProfileBtn = document.getElementById("viewProfileBtn");
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            closeProfilePopup();
            handleMenuClick("profile");
        });
    }

    // 8. Notification Button
    const notificationBtn = document.getElementById("notificationBtn");
    if (notificationBtn) {
        notificationBtn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            handleMenuClick("notification");
        });
    }

    // 9. All Service Cards & Secondary buttons with [data-tab]
    document.querySelectorAll("[data-tab]").forEach(function (button) {
        button.addEventListener("click", function (e) {
            e.preventDefault();
            const tab = button.getAttribute("data-tab");
            if (tab) {
                handleMenuClick(tab);
            }
        });
    });

    // 10. Click outside profile popup to close
    document.addEventListener("click", function (e) {
        const popup = document.getElementById("profilePopup");
        const profileBtn = document.getElementById("profileBtn");
        if (popup && !popup.hidden && popup.style.display !== "none") {
            if (!popup.contains(e.target) && !profileBtn.contains(e.target)) {
                closeProfilePopup();
            }
        }
    });

    // 11. Escape key to close any active modal/drawer
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeMenu();
            closeProfilePopup();
        }
    });

    // 12. Set default user in localStorage if not set yet
    if (!localStorage.getItem("loggedInUser") && !localStorage.getItem("kisanSetuUser")) {
        localStorage.setItem("loggedInUser", JSON.stringify(defaultUser));
    }
});