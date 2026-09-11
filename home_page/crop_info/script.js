const cropForm = document.getElementById("cropForm");
const success = document.getElementById("success");


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