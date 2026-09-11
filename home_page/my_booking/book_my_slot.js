const homeBtn = document.getElementById("homeBtn");

const newBookingBtn = document.getElementById("newBookingBtn");
const bookingForm = document.getElementById("bookingForm");
const closeFormBtn = document.getElementById("closeFormBtn");
const bookSlotBtn = document.getElementById("bookSlotBtn");

const refreshBtn = document.getElementById("refreshBtn");
const cancelBtn = document.getElementById("cancelBtn");

const cropInput = document.getElementById("cropInput");
const centreInput = document.getElementById("centreInput");
const dateInput = document.getElementById("dateInput");
const timeInput = document.getElementById("timeInput");

const toast = document.getElementById("toast");


/* HOME BUTTON */

homeBtn.addEventListener("click", () => {

    window.location.href = "../home.html";

});


/* TOAST */

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);

}


/* OPEN NEW BOOKING FORM */

newBookingBtn.addEventListener("click", () => {

    bookingForm.hidden = false;

    bookingForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

});


/* CLOSE FORM */

closeFormBtn.addEventListener("click", () => {

    bookingForm.hidden = true;

});


/* BOOK NEW SLOT */

bookSlotBtn.addEventListener("click", () => {

    if (!dateInput.value) {

        showToast("कृपया स्लॉट तारीख निवडा.");

        return;
    }


    const booking = {

        id: "BK" + Date.now().toString().slice(-8),

        bookingDate: new Date().toISOString().split("T")[0],

        crop: cropInput.value,

        centre: centreInput.value,

        date: dateInput.value,

        time: timeInput.value,

        status: "बुकिंग निश्चित",

        queue: 25,

        estimatedTime: 60,

        payment: 0

    };


    localStorage.setItem(
        "kisansevaBooking",
        JSON.stringify(booking)
    );


    loadBooking();


    bookingForm.hidden = true;


    showToast("स्लॉट यशस्वीरित्या बुक झाला.");

});


/* REFRESH LIVE QUEUE */

refreshBtn.addEventListener("click", () => {

    const booking = JSON.parse(
        localStorage.getItem("kisansevaBooking")
    );


    if (!booking) {

        showToast("सध्या कोणतीही बुकिंग उपलब्ध नाही.");

        return;
    }


    if (booking.status === "बुकिंग रद्द") {

        showToast("ही बुकिंग रद्द करण्यात आली आहे.");

        return;
    }


    let currentQueue = Number(booking.queue);


    if (currentQueue > 1) {

        const decrease = Math.floor(
            Math.random() * 4
        ) + 1;

        currentQueue = Math.max(
            1,
            currentQueue - decrease
        );

    }


    booking.queue = currentQueue;

    booking.estimatedTime =
        currentQueue * 2;


    localStorage.setItem(
        "kisansevaBooking",
        JSON.stringify(booking)
    );


    loadBooking();


    showToast("लाईव्ह रांग अपडेट झाली.");

});


/* CANCEL BOOKING */

cancelBtn.addEventListener("click", () => {

    const booking = JSON.parse(
        localStorage.getItem("kisansevaBooking")
    );


    if (!booking) {

        showToast(
            "रद्द करण्यासाठी बुकिंग उपलब्ध नाही."
        );

        return;
    }


    if (booking.status === "बुकिंग रद्द") {

        showToast("बुकिंग आधीच रद्द केली आहे.");

        return;
    }


    const confirmCancel = confirm(
        "तुम्हाला ही बुकिंग रद्द करायची आहे का?"
    );


    if (!confirmCancel) {

        return;
    }


    booking.status = "बुकिंग रद्द";

    booking.queue = 0;

    booking.estimatedTime = 0;


    localStorage.setItem(
        "kisansevaBooking",
        JSON.stringify(booking)
    );


    loadBooking();


    showToast(
        "बुकिंग रद्द करण्यात आली."
    );

});


/* FORMAT DATE */

function formatDate(date) {

    if (!date) {

        return "-";
    }


    const parts = date.split("-");


    if (parts.length !== 3) {

        return date;
    }


    return `${parts[2]}-${parts[1]}-${parts[0]}`;

}


/* LOAD BOOKING */

function loadBooking() {

    let booking = JSON.parse(
        localStorage.getItem("kisansevaBooking")
    );


    /* DEMO BOOKING */

    if (!booking) {

        booking = {

            id: "BK20261015",

            bookingDate: "2026-09-10",

            crop: "ज्वारी",

            centre: "कृषी उत्पन्न बाजार समिती",

            date: "2026-10-15",

            time: "10:00 AM - 12:00 PM",

            status: "बुकिंग निश्चित",

            queue: 25,

            estimatedTime: 60,

            payment: 0

        };

    }


    /* BOOKING ID */

    document.getElementById(
        "bookingId"
    ).textContent = booking.id;


    /* STATUS */

    const statusElement =
        document.getElementById("bookingStatus");


    statusElement.textContent =
        booking.status;


    /* BOOKING DATE */

    document.getElementById(
        "bookingDate"
    ).textContent =
        formatDate(booking.bookingDate);


    /* SLOT DATE */

    document.getElementById(
        "slotDate"
    ).textContent =
        formatDate(booking.date);


    /* SLOT TIME */

    document.getElementById(
        "slotTime"
    ).textContent =
        booking.time;


    /* CENTRE */

    document.getElementById(
        "centreName"
    ).textContent =
        booking.centre;


    /* CROP */

    document.getElementById(
        "cropName"
    ).textContent =
        booking.crop;


    /* QUEUE */

    document.getElementById(
        "queuePosition"
    ).textContent =
        booking.queue;


    /* ESTIMATED WAITING TIME */

    document.getElementById(
        "estimatedTime"
    ).textContent =
        booking.estimatedTime;


    /* QUEUE MESSAGE */

    if (booking.status === "बुकिंग रद्द") {

        document.getElementById(
            "queueMessage"
        ).textContent =
            "रांग उपलब्ध नाही";

    }

    else if (Number(booking.queue) <= 1) {

        document.getElementById(
            "queueMessage"
        ).textContent =
            "आपला नंबर पुढे आहे";

    }

    else {

        document.getElementById(
            "queueMessage"
        ).textContent =
            `आपल्या आधी ${booking.queue - 1} शेतकरी`;

    }


    /* PROGRESS */

    let progress = 0;


    if (booking.status !== "बुकिंग रद्द") {

        progress =
            Math.max(
                5,
                Math.min(
                    95,
                    100 - Number(booking.queue)
                )
            );

    }


    document.getElementById(
        "progressFill"
    ).style.width =
        progress + "%";


    document.getElementById(
        "progressText"
    ).textContent =
        progress + "%";


    /* PAYMENT */

    document.getElementById(
        "paymentAmount"
    ).textContent =
        "₹ " + Number(booking.payment || 0);


    /* STATUS CONDITIONS */

    if (booking.status === "बुकिंग रद्द") {

        statusElement.style.background =
            "#fde8e6";

        statusElement.style.color =
            "#b43d31";


        document.getElementById(
            "notificationText"
        ).textContent =
            "ही बुकिंग रद्द करण्यात आली आहे.";


        document.getElementById(
            "procurementStatus"
        ).textContent =
            "बुकिंग रद्द";


        document.getElementById(
            "paymentStatus"
        ).textContent =
            "लागू नाही";


        document.getElementById(
            "paymentText"
        ).textContent =
            "रद्द केलेल्या बुकिंगसाठी देयक उपलब्ध नाही.";

    }

    else {

        statusElement.style.background =
            "#e2f4e8";

        statusElement.style.color =
            "#087a43";


        document.getElementById(
            "notificationText"
        ).textContent =
            "आपला स्लॉट निश्चित आहे. स्लॉटच्या वेळेपूर्वी खरेदी केंद्रावर पोहोचा.";


        document.getElementById(
            "procurementStatus"
        ).textContent =
            "खरेदीसाठी प्रतीक्षा";


        document.getElementById(
            "paymentStatus"
        ).textContent =
            "प्रलंबित";


        document.getElementById(
            "paymentText"
        ).textContent =
            "खरेदी पूर्ण झाल्यानंतर रक्कम अपडेट होईल.";

    }

}


/* DEFAULT DATE */

function setMinimumDate() {

    const today =
        new Date().toISOString().split("T")[0];


    dateInput.min = today;

}


/* INITIALIZE */

setMinimumDate();

loadBooking();