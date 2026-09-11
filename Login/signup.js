/* =========================================================
   KISANSETU - FARMER REGISTRATION
   FASTAPI + POSTGRESQL
   ========================================================= */

const API_BASE_URL = "https://hackathon-2026-0gus.onrender.com";

let currentStep = 1;
const totalSteps = 4;

const message = document.getElementById("message");
const registerForm = document.getElementById("registerForm");
const submitBtn = document.getElementById("submitBtn");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");


/* =========================================================
   STEP NAVIGATION
   ========================================================= */

function nextStep() {

    if (!validateStep(currentStep)) {
        return;
    }

    if (currentStep < totalSteps) {
        currentStep++;
        updateStepUI();
    }
}


function previousStep() {

    if (currentStep > 1) {
        currentStep--;
        updateStepUI();
    }
}


function handleBackAction() {

    if (currentStep === 1) {

        const confirmCancel = confirm(
            "नोंदणी प्रक्रिया रद्द करून लॉगिन पृष्ठावर जायचे आहे का?"
        );

        if (confirmCancel) {
            window.location.href = "login.html";
        }

    } else {

        previousStep();
    }
}


function updateStepUI() {

    for (let i = 1; i <= totalSteps; i++) {

        const formStep =
            document.getElementById("formStep" + i);

        const indicator =
            document.getElementById("stepIndicator" + i);


        if (formStep) {
            formStep.classList.remove("active");

            if (i === currentStep) {
                formStep.classList.add("active");
            }
        }


        if (indicator) {

            indicator.classList.remove(
                "active",
                "completed"
            );

            if (i === currentStep) {
                indicator.classList.add("active");
            }

            if (i < currentStep) {
                indicator.classList.add("completed");
            }
        }
    }


    if (backBtn) {

        backBtn.style.display = "inline-flex";

        backBtn.innerHTML =
            currentStep === 1
                ? "रद्द करा"
                : "← मागे";
    }


    if (nextBtn) {

        nextBtn.style.display =
            currentStep === totalSteps
                ? "none"
                : "inline-flex";
    }


    if (submitBtn) {

        submitBtn.style.display =
            currentStep === totalSteps
                ? "inline-flex"
                : "none";
    }


    clearMessage();


    if (currentStep === 4) {
        updateReview();
    }
}


window.nextStep = nextStep;
window.previousStep = previousStep;
window.handleBackAction = handleBackAction;


/* =========================================================
   VALIDATION
   ========================================================= */

function validateStep(step) {

    clearMessage();


    /* STEP 1 */

    if (step === 1) {

        const fullName =
            document.getElementById("fullName").value.trim();

        const fatherSpouseName =
            document.getElementById("fatherSpouseName").value.trim();

        const mobile =
            document.getElementById("mobile").value.trim();

        const dob =
            document.getElementById("dob").value;

        const gender =
            document.querySelector(
                'input[name="gender"]:checked'
            );


        if (fullName.length < 3) {

            showMessage(
                "कृपया आपले पूर्ण नाव प्रविष्ट करा.",
                "error"
            );

            return false;
        }


        if (fatherSpouseName.length < 2) {

            showMessage(
                "कृपया वडिलांचे किंवा पतीचे नाव प्रविष्ट करा.",
                "error"
            );

            return false;
        }


        if (!/^[6-9][0-9]{9}$/.test(mobile)) {

            showMessage(
                "कृपया योग्य 10 अंकी मोबाईल क्रमांक प्रविष्ट करा.",
                "error"
            );

            return false;
        }


        if (!dob) {

            showMessage(
                "कृपया जन्मतारीख निवडा.",
                "error"
            );

            return false;
        }


        if (!gender) {

            showMessage(
                "कृपया लिंग निवडा.",
                "error"
            );

            return false;
        }
    }


    /* STEP 2 */

    if (step === 2) {

        const address =
            document.getElementById("address").value.trim();

        const district =
            document.getElementById("district").value;

        const taluka =
            document.getElementById("taluka").value.trim();

        const village =
            document.getElementById("village").value.trim();

        const pincode =
            document.getElementById("pincode").value.trim();


        if (!address) {

            showMessage(
                "कृपया पूर्ण पत्ता प्रविष्ट करा.",
                "error"
            );

            return false;
        }


        if (!district) {

            showMessage(
                "कृपया जिल्हा निवडा.",
                "error"
            );

            return false;
        }


        if (!taluka) {

            showMessage(
                "कृपया तालुका प्रविष्ट करा.",
                "error"
            );

            return false;
        }


        if (!village) {

            showMessage(
                "कृपया गावाचे नाव प्रविष्ट करा.",
                "error"
            );

            return false;
        }


        if (!/^[0-9]{6}$/.test(pincode)) {

            showMessage(
                "कृपया योग्य 6 अंकी पिन कोड प्रविष्ट करा.",
                "error"
            );

            return false;
        }
    }


    /* STEP 3 */

    if (step === 3) {

        const crop =
            document.getElementById("crop").value;

        const farmArea =
            document.getElementById("farmArea").value;

        const quantity =
            document.getElementById("quantity").value;


        if (!crop) {

            showMessage(
                "कृपया मुख्य पीक निवडा.",
                "error"
            );

            return false;
        }


        if (
            farmArea &&
            Number(farmArea) <= 0
        ) {

            showMessage(
                "कृपया योग्य शेती क्षेत्र प्रविष्ट करा.",
                "error"
            );

            return false;
        }


        if (
            quantity &&
            Number(quantity) < 0
        ) {

            showMessage(
                "कृपया योग्य अंदाजित उत्पादन प्रविष्ट करा.",
                "error"
            );

            return false;
        }
    }


    return true;
}


/* =========================================================
   REVIEW
   ========================================================= */

function updateReview() {

    const gender =
        document.querySelector(
            'input[name="gender"]:checked'
        );

    const farmArea =
        document.getElementById("farmArea").value;

    const areaUnit =
        document.getElementById("areaUnit").value;

    const quantity =
        document.getElementById("quantity").value;


    const values = [

        [
            "पूर्ण नाव",
            document.getElementById("fullName").value
        ],

        [
            "वडिलांचे / पतीचे नाव",
            document.getElementById("fatherSpouseName").value
        ],

        [
            "मोबाईल क्रमांक",
            document.getElementById("mobile").value
        ],

        [
            "जन्मतारीख",
            document.getElementById("dob").value
        ],

        [
            "ईमेल",
            document.getElementById("email").value || "-"
        ],

        [
            "लिंग",
            gender ? gender.value : "-"
        ],

        [
            "पत्ता",
            document.getElementById("address").value
        ],

        [
            "जिल्हा",
            document.getElementById("district").value
        ],

        [
            "तालुका",
            document.getElementById("taluka").value
        ],

        [
            "गाव",
            document.getElementById("village").value
        ],

        [
            "पिन कोड",
            document.getElementById("pincode").value
        ],

        [
            "शेती क्षेत्र",
            farmArea
                ? farmArea + " " + areaUnit
                : "-"
        ],

        [
            "मुख्य पीक",
            document.getElementById("crop").value
        ],

        [
            "अंदाजित उत्पादन",
            quantity
                ? quantity + " क्विंटल"
                : "-"
        ],

        [
            "पसंतीचे खरेदी केंद्र",
            document.getElementById("centre").value || "-"
        ]
    ];


    let html = "";


    values.forEach(function (item) {

        html += `
            <div class="review-row">
                <strong>${item[0]}</strong>
                <span>${item[1] || "-"}</span>
            </div>
        `;
    });


    const reviewBox =
        document.getElementById("reviewBox");

    if (reviewBox) {
        reviewBox.innerHTML = html;
    }
}


/* =========================================================
   REGISTRATION
   ========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearMessage();


            const password =
                document.getElementById("password").value;

            const confirmPassword =
                document.getElementById("confirmPassword").value;

            const terms =
                document.getElementById("terms").checked;


            if (password.length < 6) {

                showMessage(
                    "पासवर्ड किमान 6 अक्षरांचा असावा.",
                    "error"
                );

                return;
            }


            if (password !== confirmPassword) {

                showMessage(
                    "दोन्ही पासवर्ड समान नाहीत.",
                    "error"
                );

                return;
            }


            if (!terms) {

                showMessage(
                    "कृपया नियम व अटी स्वीकारा.",
                    "error"
                );

                return;
            }


            const gender =
                document.querySelector(
                    'input[name="gender"]:checked'
                );


            if (!gender) {

                showMessage(
                    "कृपया लिंग निवडा.",
                    "error"
                );

                return;
            }


            const farmerData = {

                full_name:
                    document
                        .getElementById("fullName")
                        .value
                        .trim(),

                father_spouse_name:
                    document
                        .getElementById("fatherSpouseName")
                        .value
                        .trim(),

                mobile_number:
                    document
                        .getElementById("mobile")
                        .value
                        .trim(),

                date_of_birth:
                    document
                        .getElementById("dob")
                        .value,

                email:
                    document
                        .getElementById("email")
                        .value
                        .trim() || null,

                gender:
                    gender.value,


                full_address:
                    document
                        .getElementById("address")
                        .value
                        .trim(),

                district:
                    document
                        .getElementById("district")
                        .value,

                taluka:
                    document
                        .getElementById("taluka")
                        .value
                        .trim(),

                village:
                    document
                        .getElementById("village")
                        .value
                        .trim(),

                pincode:
                    document
                        .getElementById("pincode")
                        .value
                        .trim(),


                land_area_acres:
                    Number(
                        document
                            .getElementById("farmArea")
                            .value || 0
                    ),

                primary_crop:
                    document
                        .getElementById("crop")
                        .value,

                password:
                    password
            };


            const originalBtnText =
                submitBtn.innerHTML;


            submitBtn.disabled = true;

            submitBtn.innerHTML =
                "नोंदणी प्रक्रिया सुरू आहे...";


            showMessage(
                "कृपया प्रतीक्षा करा...",
                "success"
            );


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/api/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    farmerData
                                )
                        }
                    );


                let result = {};


                try {

                    result =
                        await response.json();

                } catch (jsonError) {

                    result = {};
                }


                if (!response.ok) {

                    throw new Error(
                        result.detail ||
                        "नोंदणी पूर्ण करता आली नाही."
                    );
                }


                if (!result.success) {

                    throw new Error(
                        "नोंदणी पूर्ण करता आली नाही."
                    );
                }


                showMessage(
                    "नोंदणी यशस्वी झाली! आता आपण लॉगिन करू शकता.",
                    "success"
                );


                registerForm.reset();


                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "Registration Error:",
                    error
                );


                let errorMessage =
                    "नोंदणी पूर्ण करता आली नाही. कृपया पुन्हा प्रयत्न करा.";


                if (
                    error instanceof TypeError ||
                    error.message === "Failed to fetch"
                ) {

                    errorMessage =
                        "सेवेशी संपर्क साधता आला नाही. कृपया काही वेळाने पुन्हा प्रयत्न करा.";

                } else if (error.message) {

                    errorMessage =
                        error.message;
                }


                showMessage(
                    errorMessage,
                    "error"
                );


                submitBtn.disabled = false;

                submitBtn.innerHTML =
                    originalBtnText;
            }
        }
    );
}


/* =========================================================
   MESSAGE FUNCTIONS
   ========================================================= */

function showMessage(text, type) {

    if (!message) {
        return;
    }

    message.innerText = text;

    message.className =
        "alert-message " + type;
}


function clearMessage() {

    if (!message) {
        return;
    }

    message.innerText = "";

    message.className =
        "alert-message";
}


/* =========================================================
   INPUT RESTRICTIONS
   ========================================================= */

const mobileInput =
    document.getElementById("mobile");

const pincodeInput =
    document.getElementById("pincode");


if (mobileInput) {

    mobileInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value
                    .replace(/\D/g, "")
                    .slice(0, 10);
        }
    );
}


if (pincodeInput) {

    pincodeInput.addEventListener(
        "input",
        function () {

            this.value =
                this.value
                    .replace(/\D/g, "")
                    .slice(0, 6);
        }
    );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

updateStepUI();