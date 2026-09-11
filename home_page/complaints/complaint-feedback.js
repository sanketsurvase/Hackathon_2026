document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("complaintForm");

    const complaintBtn =
        document.getElementById("complaintBtn");

    const feedbackBtn =
        document.getElementById("feedbackBtn");

    const message =
        document.getElementById("message");

    const charCount =
        document.getElementById("charCount");

    const imageUpload =
        document.getElementById("imageUpload");

    const fileName =
        document.getElementById("fileName");

    const messageLabel =
        document.getElementById("messageLabel");

    const submitText =
        document.getElementById("submitText");

    const ratingText =
        document.getElementById("ratingText");

    const stars =
        document.querySelectorAll(".star");

    let selectedType = "complaint";

    let selectedRating = 0;


    /* ================= TYPE ================= */

    window.selectType = function (type) {

        selectedType = type;

        complaintBtn.classList.remove("active");

        feedbackBtn.classList.remove("active");


        if (type === "complaint") {

            complaintBtn.classList.add("active");

            messageLabel.textContent =
                "तक्रारीचे वर्णन";

            submitText.textContent =
                "तक्रार नोंदवा";

        } else {

            feedbackBtn.classList.add("active");

            messageLabel.textContent =
                "आपला अभिप्राय";

            submitText.textContent =
                "अभिप्राय पाठवा";

        }

    };


    /* ================= STAR RATING ================= */

    stars.forEach(function (star) {

        star.addEventListener("click", function () {

            selectedRating =
                Number(this.dataset.rating);

            stars.forEach(function (item) {

                const rating =
                    Number(item.dataset.rating);

                if (rating <= selectedRating) {

                    item.classList.add("selected");

                } else {

                    item.classList.remove("selected");

                }

            });


            const ratingMessages = {

                1: "खूप खराब 😞",

                2: "समाधानकारक नाही 😕",

                3: "ठीक आहे 🙂",

                4: "चांगला अनुभव 😊",

                5: "उत्कृष्ट अनुभव! 🤩"

            };


            ratingText.textContent =
                ratingMessages[selectedRating];

        });

    });


    /* ================= CHARACTER COUNTER ================= */

    message.addEventListener("input", function () {

        charCount.textContent =
            this.value.length;

    });


    /* ================= FILE UPLOAD ================= */

    imageUpload.addEventListener("change", function () {

        if (this.files.length > 0) {

            fileName.textContent =
                "📎 निवडलेली फाइल: " +
                this.files[0].name;

        } else {

            fileName.textContent = "";

        }

    });


    /* ================= MOBILE VALIDATION ================= */

    const mobile =
        document.getElementById("mobile");


    mobile.addEventListener("input", function () {

        this.value =
            this.value.replace(/\D/g, "");

    });


    /* ================= FORM SUBMIT ================= */

    form.addEventListener("submit", function (event) {

        event.preventDefault();


        const name =
            document.getElementById("name").value.trim();

        const mobileNumber =
            mobile.value.trim();

        const category =
            document.getElementById("category").value;

        const messageValue =
            message.value.trim();


        /* NAME CHECK */

        if (name.length < 2) {

            alert("कृपया आपले नाव योग्यरित्या लिहा.");

            return;

        }


        /* MOBILE CHECK */

        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {

            alert(
                "कृपया योग्य 10 अंकी मोबाईल नंबर टाका."
            );

            mobile.focus();

            return;

        }


        /* CATEGORY CHECK */

        if (category === "") {

            alert("कृपया श्रेणी निवडा.");

            return;

        }


        /* MESSAGE CHECK */

        if (messageValue.length < 10) {

            alert(
                "कृपया किमान 10 अक्षरांमध्ये माहिती लिहा."
            );

            message.focus();

            return;

        }


        /* RATING FOR FEEDBACK */

        if (
            selectedType === "feedback" &&
            selectedRating === 0
        ) {

            alert("कृपया आपली रेटिंग निवडा.");

            return;

        }


        /* ================= GENERATE ID ================= */

        const prefix =
            selectedType === "complaint"
                ? "CMP"
                : "FDB";


        const randomNumber =
            Math.floor(
                100000 +
                Math.random() * 900000
            );


        const reference =
            "KS-" +
            prefix +
            "-" +
            randomNumber;


        document.getElementById(
            "referenceId"
        ).textContent = reference;


        /* ================= SUCCESS TITLE ================= */

        if (selectedType === "complaint") {

            document.getElementById(
                "successTitle"
            ).textContent =
                "तक्रार यशस्वीरीत्या नोंदवली!";

        } else {

            document.getElementById(
                "successTitle"
            ).textContent =
                "अभिप्राय यशस्वीरीत्या पाठवला!";

        }


        /* ================= SAVE DATA ================= */

        const submission = {

            type: selectedType,

            name: name,

            mobile: mobileNumber,

            category: category,

            rating: selectedRating,

            message: messageValue,

            referenceId: reference,

            date:
                new Date().toLocaleString("mr-IN")

        };


        localStorage.setItem(
            "lastComplaintFeedback",
            JSON.stringify(submission)
        );


        /* ================= SHOW SUCCESS ================= */

        form.parentElement.hidden = true;

        document.getElementById(
            "successCard"
        ).hidden = false;


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    });


    /* ================= RESET ================= */

    window.resetForm = function () {

        form.reset();

        selectedRating = 0;

        selectedType = "complaint";


        stars.forEach(function (star) {

            star.classList.remove("selected");

        });


        ratingText.textContent =
            "रेटिंग निवडा";


        charCount.textContent = "0";

        fileName.textContent = "";


        complaintBtn.classList.add("active");

        feedbackBtn.classList.remove("active");


        messageLabel.textContent =
            "तक्रारीचे वर्णन";

        submitText.textContent =
            "तक्रार नोंदवा";


        document.getElementById(
            "successCard"
        ).hidden = true;


        form.parentElement.hidden = false;


        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    };


    /* ================= HOME ================= */

    window.goHome = function () {

        window.location.href =
            "index.html";

    };

});