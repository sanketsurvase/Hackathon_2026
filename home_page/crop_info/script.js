const cropForm = document.getElementById("cropForm");
const success = document.getElementById("success");

// Load logged in farmer info
(function updateFarmerName() {
    const farmerNameEl = document.getElementById("farmerName");
    if (!farmerNameEl) return;
    try {
        const loggedIn = JSON.parse(localStorage.getItem("loggedInUser") || "{}");
        const kisanUser = JSON.parse(localStorage.getItem("kisanSetuUser") || "{}");
        const name = loggedIn.name && loggedIn.name !== "संकट पाटील" 
            ? loggedIn.name 
            : (kisanUser.full_name || kisanUser.name || loggedIn.name || "शेतकरी मित्र");
        farmerNameEl.textContent = name;
    } catch (e) {
        farmerNameEl.textContent = "शेतकरी मित्र";
    }
})();


// ========================================
// FORM SUBMIT
// ========================================

if (cropForm) {

    cropForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const cropType =
            document.getElementById("cropType").value;

        const variety =
            document.getElementById("variety").value;

        const quantity =
            document.getElementById("quantity").value;

        const purchaseDate =
            document.getElementById("purchaseDate").value;

        const additionalInfo =
            document.getElementById("additionalInfo").value;


        // Check required fields

        if (!cropType || !quantity || !purchaseDate) {

            alert("कृपया सर्व आवश्यक माहिती भरा.");

            return;

        }


        // Save crop information

        const cropData = {

            cropType: cropType,

            variety: variety,

            quantity: quantity,

            purchaseDate: purchaseDate,

            additionalInfo: additionalInfo,

            userId: "KS10245",

            savedAt: new Date().toISOString()

        };


        localStorage.setItem(
            "cropInformation",
            JSON.stringify(cropData)
        );


        // Show success message

        if (success) {

            success.style.display = "flex";

        }


        // Scroll to success message

        if (success) {

            success.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }

    });

}