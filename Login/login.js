/* =========================================================
   KISANSETU - FARMER LOGIN
   FASTAPI + POSTGRESQL
   ========================================================= */

const loginForm = document.getElementById("loginForm");
const loginIdentifier = document.getElementById("loginIdentifier");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const message = document.getElementById("message");
const togglePasswordBtn = document.getElementById("togglePasswordBtn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
const rememberMe = document.getElementById("rememberMe");

const API_BASE_URL = "https://hackathon-2026-0gus.onrender.com";
const LOGIN_API = `${API_BASE_URL}/api/login`;


/* =========================================================
   LOAD REMEMBERED USER
   ========================================================= */

window.addEventListener("DOMContentLoaded", function () {

    const isLoggedIn = localStorage.getItem("kisanSetuLoggedIn") === "true";
    if (isLoggedIn) {
        window.location.replace("../home_page/home.html");
        return;
    }

    const savedIdentifier =
        localStorage.getItem("kisanSetuRememberedIdentifier");

    if (savedIdentifier && loginIdentifier) {
        loginIdentifier.value = savedIdentifier;

        if (rememberMe) {
            rememberMe.checked = true;
        }
    }

});


/* =========================================================
   PASSWORD SHOW / HIDE
   ========================================================= */

if (togglePasswordBtn && loginPassword) {

    togglePasswordBtn.addEventListener("click", function (event) {

        event.preventDefault();

        if (loginPassword.type === "password") {
            loginPassword.type = "text";
        } else {
            loginPassword.type = "password";
        }

    });

}


/* =========================================================
   LOGIN FORM
   ========================================================= */

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        clearMessage();

        const identifier = loginIdentifier.value.trim();
        const password = loginPassword.value;


        /* =========================
           VALIDATION
           ========================= */

        if (!identifier) {

            showMessage(
                "कृपया मोबाईल क्रमांक किंवा ईमेल आयडी प्रविष्ट करा.",
                "error"
            );

            loginIdentifier.focus();

            return;
        }


        if (!password) {

            showMessage(
                "कृपया पासवर्ड प्रविष्ट करा.",
                "error"
            );

            loginPassword.focus();

            return;
        }


        /* =========================
           LOADING
           ========================= */

        const originalBtnText = loginBtn.innerHTML;

        loginBtn.disabled = true;

        loginBtn.innerHTML =
            "लॉगिन प्रक्रिया सुरू आहे...";

        showMessage(
            "कृपया प्रतीक्षा करा...",
            "success"
        );


        try {

            let farmer = null;

            try {
                const response = await fetch(LOGIN_API, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier: identifier, password: password })
                });

                let result = {};
                try { result = await response.json(); } catch (jErr) {}

                if (response.ok && result.success && result.farmer) {
                    farmer = result.farmer;
                }
            } catch (fetchErr) {
                console.warn("API login note:", fetchErr);
            }

            // Local fallback check
            if (!farmer) {
                let localFarmers = [];
                try {
                    localFarmers = JSON.parse(localStorage.getItem("kisanSetuRegisteredFarmers") || "[]");
                } catch (e) { localFarmers = []; }

                const matched = localFarmers.find(f =>
                    (f.mobile_number === identifier || f.email === identifier) && f.password === password
                );

                if (matched) {
                    farmer = {
                        farmer_id: matched.farmer_id,
                        full_name: matched.full_name,
                        mobile_number: matched.mobile_number,
                        email: matched.email || ""
                    };
                }
            }

            if (!farmer) {
                throw new Error("मोबाईल क्रमांक, ईमेल किंवा पासवर्ड चुकीचा आहे. कृपया पुन्हा प्रयत्न करा.");
            }


            /* =========================
               REMEMBER ME
               ========================= */

            if (rememberMe && rememberMe.checked) {

                localStorage.setItem(
                    "kisanSetuRememberedIdentifier",
                    identifier
                );

            } else {

                localStorage.removeItem(
                    "kisanSetuRememberedIdentifier"
                );
            }


            /* =========================
               SAVE LOGIN SESSION
               ========================= */

            const activeSession = {

                farmer_id:
                    farmer.farmer_id,

                full_name:
                    farmer.full_name || "",

                mobile_number:
                    farmer.mobile_number || "",

                email:
                    farmer.email || "",

                login_time:
                    new Date().toISOString()

            };


            localStorage.setItem(
                "kisanSetuUser",
                JSON.stringify(activeSession)
            );


            localStorage.setItem(
                "loggedInUser",
                JSON.stringify({
                    userId: "KS" + (farmer.farmer_id || "1001"),
                    name: farmer.full_name || "शेतकरी मित्र",
                    mobile: farmer.mobile_number || ""
                })
            );


            localStorage.setItem(
                "kisanSetuLoggedIn",
                "true"
            );


            /* =========================
               SUCCESS
               ========================= */

            showMessage(
                "लॉगिन यशस्वी झाले. स्वागत आहे!",
                "success"
            );


            loginBtn.innerHTML =
                "लॉगिन यशस्वी ✓";


            console.log(
                "Logged In Farmer:",
                activeSession
            );


            /* =========================
               REDIRECT TO HOME
               ========================= */

            setTimeout(function () {

                window.location.replace(
                    "../home_page/home.html"
                );

            }, 500);


        } catch (error) {

            console.error(
                "Login Error:",
                error
            );


            let errorMessage =
                "लॉगिन करता आले नाही. कृपया पुन्हा प्रयत्न करा.";


            if (
                error instanceof TypeError ||
                error.message === "Failed to fetch"
            ) {

                errorMessage =
                    "सर्व्हरशी संपर्क साधता आला नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.";

            } else if (error.message) {

                errorMessage =
                    error.message;
            }


            showMessage(
                errorMessage,
                "error"
            );


            loginBtn.disabled = false;

            loginBtn.innerHTML =
                originalBtnText;
        }

    });

}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

if (forgotPasswordBtn) {

    forgotPasswordBtn.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            showMessage(
                "पासवर्ड रीसेट सुविधा लवकरच उपलब्ध होईल.",
                "error"
            );

        }
    );

}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showMessage(text, type) {

    if (!message) {
        return;
    }

    message.innerText = text;

    message.className =
        "message " + type;

    message.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================================
   CLEAR MESSAGE
   ========================================================= */

function clearMessage() {

    if (!message) {
        return;
    }

    message.innerText = "";

    message.className = "message";

}