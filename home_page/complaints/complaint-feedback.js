document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("complaintForm");
    const complaintBtn = document.getElementById("complaintBtn");
    const feedbackBtn = document.getElementById("feedbackBtn");
    const message = document.getElementById("message");
    const charCount = document.getElementById("charCount");
    const imageUpload = document.getElementById("imageUpload");
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");
    const filePreviewWrap = document.getElementById("filePreviewWrap");
    const imageThumbnail = document.getElementById("imageThumbnail");
    const messageLabel = document.getElementById("messageLabel");
    const submitText = document.getElementById("submitText");
    const ratingText = document.getElementById("ratingText");
    const stars = document.querySelectorAll(".star");
    const mobile = document.getElementById("mobile");
    const nameInput = document.getElementById("name");
    const categorySelect = document.getElementById("category");
    const stepTwoTitle = document.getElementById("stepTwoTitle");
    const copyRefBtn = document.getElementById("copyRefBtn");
    const autofillNameBadge = document.getElementById("autofillNameBadge");
    const autofillPhoneBadge = document.getElementById("autofillPhoneBadge");

    let selectedType = "complaint";
    let selectedRating = 0;

    /* ================= AUTO-FILL FROM LOGGED-IN FARMER ================= */
    function autoFillFarmerInfo() {
        try {
            const loggedIn = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
            const kisanUser = JSON.parse(localStorage.getItem("kisanSetuUser") || "{}");

            const farmerName = loggedIn.full_name || loggedIn.name || kisanUser.full_name || kisanUser.name || "";
            const farmerMobile = loggedIn.mobile || loggedIn.phone || kisanUser.mobile || kisanUser.phone || "";

            if (farmerName && !nameInput.value) {
                nameInput.value = farmerName;
                if (autofillNameBadge) autofillNameBadge.style.display = "block";
            }
            if (farmerMobile && !mobile.value) {
                mobile.value = farmerMobile.replace(/\D/g, "").slice(-10);
                if (autofillPhoneBadge) autofillPhoneBadge.style.display = "block";
            }
        } catch (e) {
            console.warn("Could not auto-fill farmer details", e);
        }
    }

    autoFillFarmerInfo();

    /* ================= TYPE SWITCHING ================= */
    window.selectType = function (type) {
        selectedType = type;

        complaintBtn.classList.remove("active");
        feedbackBtn.classList.remove("active");

        if (type === "complaint") {
            complaintBtn.classList.add("active");
            if (stepTwoTitle) stepTwoTitle.textContent = "तक्रार तपशील";
            if (messageLabel) messageLabel.textContent = "तक्रारीचे सविस्तर वर्णन";
            if (submitText) submitText.textContent = "तक्रार नोंदवा";
            message.placeholder = "येथे आपली समस्या, खरेदी केंद्र, पावती क्रमांक इत्यादी सविस्तर लिहा...";
        } else {
            feedbackBtn.classList.add("active");
            if (stepTwoTitle) stepTwoTitle.textContent = "अभिप्राय तपशील";
            if (messageLabel) messageLabel.textContent = "आपला अभिप्राय व सूचना";
            if (submitText) submitText.textContent = "अभिप्राय पाठवा";
            message.placeholder = "आपल्या अनुभवाचे वर्णन करा, काय आवडले किंवा काय सुधारावे असे वाटते...";
        }
    };

    /* ================= STAR RATING ================= */
    const ratingMessages = {
        1: "खूप खराब 😞",
        2: "समाधानकारक नाही 😕",
        3: "ठीक आहे 🙂",
        4: "चांगला अनुभव 😊",
        5: "उत्कृष्ट अनुभव! 🤩"
    };

    stars.forEach(function (star) {
        star.addEventListener("click", function () {
            selectedRating = Number(this.dataset.rating);
            updateStarDisplay(selectedRating);
        });

        star.addEventListener("mouseenter", function () {
            const hoverVal = Number(this.dataset.rating);
            highlightStars(hoverVal);
            if (ratingMessages[hoverVal]) {
                ratingText.textContent = ratingMessages[hoverVal];
            }
        });
    });

    const starsContainer = document.querySelector(".stars");
    if (starsContainer) {
        starsContainer.addEventListener("mouseleave", function () {
            updateStarDisplay(selectedRating);
        });
    }

    function highlightStars(val) {
        stars.forEach(function (item) {
            const rating = Number(item.dataset.rating);
            if (rating <= val) {
                item.classList.add("selected");
            } else {
                item.classList.remove("selected");
            }
        });
    }

    function updateStarDisplay(val) {
        highlightStars(val);
        if (val > 0 && ratingMessages[val]) {
            ratingText.textContent = ratingMessages[val];
        } else {
            ratingText.textContent = "रेटिंग निवडा";
        }
    }

    /* ================= CHARACTER COUNTER ================= */
    message.addEventListener("input", function () {
        const count = this.value.length;
        charCount.textContent = count;
        if (count >= 450) {
            charCount.parentElement.classList.add("warning");
        } else {
            charCount.parentElement.classList.remove("warning");
        }
    });

    /* ================= FILE UPLOAD & PREVIEW ================= */
    imageUpload.addEventListener("change", function () {
        if (this.files && this.files.length > 0) {
            const file = this.files[0];

            if (file.size > 5 * 1024 * 1024) {
                alert("कृपया ५ MB पेक्षा लहान फाइल निवडा.");
                this.value = "";
                hidePreview();
                return;
            }

            if (fileName) fileName.textContent = file.name;
            if (fileSize) {
                const sizeKb = Math.round(file.size / 1024);
                fileSize.textContent = sizeKb > 1024 ? (sizeKb / 1024).toFixed(1) + " MB" : sizeKb + " KB";
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                if (imageThumbnail) {
                    imageThumbnail.src = e.target.result;
                }
                if (filePreviewWrap) {
                    filePreviewWrap.classList.add("show");
                }
            };
            reader.readAsDataURL(file);
        } else {
            hidePreview();
        }
    });

    window.removeSelectedFile = function () {
        imageUpload.value = "";
        hidePreview();
    };

    function hidePreview() {
        if (filePreviewWrap) filePreviewWrap.classList.remove("show");
        if (imageThumbnail) imageThumbnail.src = "";
        if (fileName) fileName.textContent = "";
        if (fileSize) fileSize.textContent = "";
    }

    /* ================= MOBILE VALIDATION ================= */
    mobile.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "");
    });

    /* ================= FORM SUBMISSION ================= */
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = nameInput.value.trim();
        const mobileNumber = mobile.value.trim();
        const category = categorySelect.value;
        const messageValue = message.value.trim();

        /* NAME CHECK */
        if (name.length < 2) {
            alert("कृपया आपले पूर्ण नाव योग्यरित्या लिहा.");
            nameInput.focus();
            return;
        }

        /* MOBILE CHECK */
        if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
            alert("कृपया योग्य १० अंकी मोबाईल नंबर टाका.");
            mobile.focus();
            return;
        }

        /* CATEGORY CHECK */
        if (category === "") {
            alert("कृपया श्रेणी निवडा.");
            categorySelect.focus();
            return;
        }

        /* MESSAGE CHECK */
        if (messageValue.length < 10) {
            alert("कृपया किमान १० अक्षरांमध्ये आपली समस्या किंवा अभिप्राय लिहा.");
            message.focus();
            return;
        }

        /* RATING FOR FEEDBACK */
        if (selectedType === "feedback" && selectedRating === 0) {
            alert("कृपया आपला अनुभव व्यक्त करणारी स्टार रेटिंग निवडा.");
            return;
        }

        /* GENERATE REFERENCE ID */
        const prefix = selectedType === "complaint" ? "CMP" : "FDB";
        const randomNumber = Math.floor(100000 + Math.random() * 900000);
        const reference = "KS-" + prefix + "-" + randomNumber;

        document.getElementById("referenceId").textContent = reference;

        /* UPDATE SUCCESS CARD TEXT */
        const successTitle = document.getElementById("successTitle");
        if (successTitle) {
            successTitle.textContent = selectedType === "complaint"
                ? "तक्रार यशस्वीरीत्या नोंदवली!"
                : "अभिप्राय यशस्वीरीत्या पाठवला!";
        }

        /* SAVE DATA */
        const categoryNames = {
            slot: "स्लॉट बुकिंग",
            purchase: "खरेदी संबंधित",
            payment: "देयक संबंधित",
            queue: "लाईव्ह रांग",
            crop: "पिकांची माहिती",
            website: "तांत्रिक अडचण",
            other: "इतर"
        };

        const submission = {
            type: selectedType,
            name: name,
            mobile: mobileNumber,
            category: category,
            categoryLabel: categoryNames[category] || category,
            rating: selectedRating,
            message: messageValue,
            referenceId: reference,
            date: new Date().toLocaleDateString("mr-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            }),
            status: "प्रक्रियेत आहे"
        };

        // Save last record
        localStorage.setItem("lastComplaintFeedback", JSON.stringify(submission));

        // Save to records array
        try {
            const records = JSON.parse(localStorage.getItem("kisansetu_complaints") || "[]");
            records.unshift(submission);
            if (records.length > 10) records.pop(); // Keep last 10
            localStorage.setItem("kisansetu_complaints", JSON.stringify(records));
        } catch (e) {
            console.error(e);
        }

        // Show Success
        const formCard = document.getElementById("formCard");
        if (formCard) formCard.hidden = true;
        document.getElementById("successCard").hidden = false;

        renderRecentRecords();

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

        updateStarDisplay(0);
        hidePreview();

        charCount.textContent = "0";
        if (charCount.parentElement) {
            charCount.parentElement.classList.remove("warning");
        }

        selectType("complaint");
        autoFillFarmerInfo();

        document.getElementById("successCard").hidden = true;
        const formCard = document.getElementById("formCard");
        if (formCard) formCard.hidden = false;

        if (copyRefBtn) {
            copyRefBtn.innerHTML = "📋 कॉपी करा";
        }

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    /* ================= HOME NAVIGATION ================= */
    window.goHome = function () {
        window.location.href = "../home.html";
    };

    /* ================= COPY REFERENCE ID ================= */
    window.copyReferenceId = function () {
        const refId = document.getElementById("referenceId").textContent;
        if (!refId) return;

        navigator.clipboard.writeText(refId).then(function () {
            if (copyRefBtn) {
                copyRefBtn.innerHTML = "✅ कॉपी झाले!";
                setTimeout(function () {
                    copyRefBtn.innerHTML = "📋 कॉपी करा";
                }, 2500);
            }
        }).catch(function () {
            // Fallback
            alert("संदर्भ क्रमांक: " + refId);
        });
    };

    /* ================= RENDER RECENT RECORDS ================= */
    function renderRecentRecords() {
        const container = document.getElementById("recentRecordsList");
        const countBadge = document.getElementById("recordCountBadge");
        if (!container) return;

        let records = [];
        try {
            records = JSON.parse(localStorage.getItem("kisansetu_complaints") || "[]");
            // Also check single legacy record
            if (records.length === 0) {
                const legacy = JSON.parse(localStorage.getItem("lastComplaintFeedback") || "null");
                if (legacy) records = [legacy];
            }
        } catch (e) {
            records = [];
        }

        if (countBadge) {
            countBadge.textContent = records.length + " नोंदी";
        }

        if (records.length === 0) {
            container.innerHTML = `
                <div class="empty-records-placeholder">
                    अद्याप कोणतीही नोंद केलेली नाही. नवीन तक्रार किंवा अभिप्राय येथे दिसेल.
                </div>
            `;
            return;
        }

        container.innerHTML = records.map(function (item) {
            const isComplaint = item.type === "complaint";
            const icon = isComplaint ? "⚠️" : "⭐";
            const typeLabel = isComplaint ? "तक्रार" : "अभिप्राय";
            const catLabel = item.categoryLabel || item.category || "इतर";

            return `
                <div class="record-item">
                    <div class="record-meta">
                        <strong>${icon} ${typeLabel}: ${catLabel}</strong>
                        <span>संदर्भ क्रमांक: <b>${item.referenceId || "KS-CMP-000000"}</b> • दिनांक: ${item.date || "आज"}</span>
                    </div>
                    <div>
                        <span class="record-status-pill">
                            ⏳ ${item.status || "प्रक्रियेत आहे"}
                        </span>
                    </div>
                </div>
            `;
        }).join("");
    }

    renderRecentRecords();

});