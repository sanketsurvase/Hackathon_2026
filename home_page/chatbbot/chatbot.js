/* =====================================================
   KISAN SAHAYYAK CHATBOT
   Marathi + Hindi + English
   Roman Marathi support
===================================================== */


/* CURRENT LANGUAGE */

let selectedLanguage = "mr";


/* =====================================================
   LANGUAGE CHANGE
===================================================== */

function changeLanguage() {

    selectedLanguage =
        document.getElementById("language").value;


    let message = "";


    if (selectedLanguage === "mr") {

        message =
            "नमस्कार शेतकरी मित्रा! 🌾 आता मी तुम्हाला मराठीत उत्तर देईन.";

    }


    else if (selectedLanguage === "hi") {

        message =
            "नमस्कार किसान मित्र! 🌾 अब मैं आपको हिंदी में उत्तर दूंगा।";

    }


    else {

        message =
            "Hello farmer! 🌾 I will now answer your questions in English.";

    }


    addMessage(message, "bot");
}


/* =====================================================
   SEND MESSAGE
===================================================== */

function sendMessage() {

    const input =
        document.getElementById("userInput");


    const message =
        input.value.trim();


    if (message === "") {

        return;

    }


    /* SHOW USER MESSAGE */

    addMessage(message, "user");


    /* CLEAR INPUT */

    input.value = "";


    /* SHOW TYPING */

    showTyping();


    /* GENERATE RESPONSE */

    setTimeout(() => {

        removeTyping();


        const reply =
            getBotReply(message);


        addMessage(reply, "bot");

    }, 700);

}


/* =====================================================
   QUICK QUESTION
===================================================== */

function askQuestion(question) {

    document.getElementById("userInput").value =
        question;

    sendMessage();
}


/* =====================================================
   ENTER KEY
===================================================== */

function handleEnter(event) {

    if (event.key === "Enter") {

        sendMessage();

    }

}


/* =====================================================
   ADD MESSAGE
===================================================== */

function addMessage(message, type) {

    const chatBody =
        document.getElementById("chatBody");


    const messageDiv =
        document.createElement("div");


    messageDiv.className =
        type + "-message";


    messageDiv.innerHTML =
        message;


    chatBody.appendChild(messageDiv);


    chatBody.scrollTop =
        chatBody.scrollHeight;

}


/* =====================================================
   TYPING INDICATOR
===================================================== */

function showTyping() {

    const chatBody =
        document.getElementById("chatBody");


    const typing =
        document.createElement("div");


    typing.id = "typingIndicator";


    typing.className = "typing";


    typing.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;


    chatBody.appendChild(typing);


    chatBody.scrollTop =
        chatBody.scrollHeight;

}


function removeTyping() {

    const typing =
        document.getElementById("typingIndicator");


    if (typing) {

        typing.remove();

    }

}


/* =====================================================
   NORMALIZE TEXT
===================================================== */

function normalizeText(text) {

    return text
        .toLowerCase()
        .trim();

}


/* =====================================================
   BOT RESPONSE
===================================================== */

function getBotReply(message) {

    message =
        normalizeText(message);


    /* =========================================
       SLOT BOOKING
    ========================================= */

    if (
        message.includes("स्लॉट") ||
        message.includes("बुकिंग") ||
        message.includes("slot") ||
        message.includes("booking") ||
        message.includes("book") ||
        message.includes("slot kasa") ||
        message.includes("slot ksa")
    ) {

        return getAnswer(

            "स्लॉट बुक करण्यासाठी 'स्लॉट बुकिंग' विभागात जा. तुमचे पीक, प्रमाण, तारीख आणि उपलब्ध वेळ निवडा. बुकिंग पूर्ण झाल्यानंतर तुम्हाला डिजिटल टोकन मिळेल.",

            "स्लॉट बुक करने के लिए 'स्लॉट बुकिंग' विभाग में जाएं। अपनी फसल, मात्रा, तारीख और उपलब्ध समय चुनें। बुकिंग के बाद आपको डिजिटल टोकन मिलेगा।",

            "To book a slot, go to the 'Slot Booking' section. Select your crop, quantity, date and available time. After booking, you will receive a digital token."

        );

    }


    /* =========================================
       TOKEN
    ========================================= */

    if (
        message.includes("टोकन") ||
        message.includes("token") ||
        message.includes("tokan")
    ) {

        return getAnswer(

            "तुमचा टोकन क्रमांक पाहण्यासाठी 'माझी बुकिंग' विभागात जा. तेथे तुमचा टोकन क्रमांक, स्लॉटची वेळ आणि रांगेतील स्थिती पाहता येईल.",

            "अपना टोकन नंबर देखने के लिए 'मेरी बुकिंग' विभाग में जाएं। वहां टोकन नंबर, स्लॉट का समय और कतार की स्थिति देख सकते हैं।",

            "To check your token number, go to the 'My Booking' section. You can see your token, slot time and queue status there."

        );

    }


    /* =========================================
       PAYMENT
    ========================================= */

    if (
        message.includes("पेमेंट") ||
        message.includes("पैसे") ||
        message.includes("payment") ||
        message.includes("paisa") ||
        message.includes("paise") ||
        message.includes("payment aala nahi") ||
        message.includes("payment ale nahi")
    ) {

        return getAnswer(

            "तुमचे पेमेंट तपासण्यासाठी 'पेमेंट स्थिती' विभागात जा. पेमेंट प्रलंबित असल्यास 'तक्रार / अभिप्राय' विभागातून तक्रार नोंदवू शकता.",

            "अपना भुगतान देखने के लिए 'पेमेंट स्थिति' विभाग में जाएं। भुगतान लंबित होने पर 'शिकायत / प्रतिक्रिया' विभाग से शिकायत दर्ज कर सकते हैं।",

            "To check your payment, go to the 'Payment Status' section. If the payment is pending, you can submit a complaint through the 'Complaint / Feedback' section."

        );

    }


    /* =========================================
       COMPLAINT
    ========================================= */

    if (
        message.includes("तक्रार") ||
        message.includes("complaint") ||
        message.includes("शिकायत") ||
        message.includes("takrar") ||
        message.includes("takrar")
    ) {

        return getAnswer(

            "तक्रार नोंदवण्यासाठी 'तक्रार / अभिप्राय' विभागात जा. तुमची समस्या लिहा आणि आवश्यक माहिती द्या. तक्रार नोंदवल्यानंतर तुम्हाला तक्रार क्रमांक मिळेल.",

            "शिकायत दर्ज करने के लिए 'शिकायत / प्रतिक्रिया' विभाग में जाएं। अपनी समस्या और आवश्यक जानकारी दर्ज करें। शिकायत के बाद आपको शिकायत नंबर मिलेगा।",

            "To submit a complaint, open the 'Complaint / Feedback' section. Enter your problem and required information. You will receive a complaint number after submission."

        );

    }


    /* =========================================
       YELLOW LEAVES
    ========================================= */

    if (
        message.includes("पिवळी पाने") ||
        message.includes("पाने पिवळी") ||
        message.includes("पिवळ") ||
        message.includes("yellow leaves") ||
        message.includes("pivli") ||
        message.includes("pivale") ||
        message.includes("paan pivli") ||
        message.includes("pane pivli")
    ) {

        return getAnswer(

            `
            🌱 <b>पानांची पाने पिवळी पडण्याची संभाव्य कारणे:</b>

            <br><br>

            • जास्त पाणी किंवा पाण्याचा निचरा न होणे<br>
            • पोषकद्रव्यांची कमतरता<br>
            • काही रोग किंवा किडी

            <br><br>

            💧 जमिनीतील ओलावा तपासा आणि पाणी साचत असल्यास निचरा करा.

            <br><br>

            📷 शक्य असल्यास पिकाचा फोटो अपलोड करा. अधिक अचूक मार्गदर्शनासाठी कृषी तज्ज्ञांचा सल्ला घ्या.
            `,

            `
            🌱 <b>पत्तियों के पीले होने के संभावित कारण:</b>

            <br><br>

            • अधिक पानी या खराब जल निकासी<br>
            • पोषक तत्वों की कमी<br>
            • कुछ रोग या कीट

            <br><br>

            💧 मिट्टी की नमी जांचें और पानी जमा होने पर उचित जल निकासी करें।

            <br><br>

            📷 संभव हो तो फसल की फोटो अपलोड करें। सही जानकारी के लिए कृषि विशेषज्ञ की सलाह लें।
            `,

            `
            🌱 <b>Possible causes of yellow leaves:</b>

            <br><br>

            • Excess water or poor drainage<br>
            • Nutrient deficiency<br>
            • Certain diseases or pests

            <br><br>

            💧 Check soil moisture and ensure proper drainage.

            <br><br>

            📷 If possible, upload a crop photo. Consult an agricultural expert for accurate diagnosis.
            `

        );

    }


    /* =========================================
       LEAF SPOTS
    ========================================= */

    if (
        message.includes("डाग") ||
        message.includes("spots") ||
        message.includes("spot") ||
        message.includes("dag") ||
        message.includes("paanavar dag") ||
        message.includes("panavar dag")
    ) {

        return getAnswer(

            "पानांवर डाग पडण्याची कारणे रोग, बुरशी किंवा किडी असू शकतात. बाधित पाने वेगळी करा आणि पिकावर पाणी साचू देऊ नका. अचूक समस्या समजण्यासाठी पिकाचा फोटो तपासणे उपयुक्त ठरेल.",

            "पत्तियों पर दाग रोग, फंगस या कीट के कारण हो सकते हैं। प्रभावित पत्तियों को अलग करें और खेत में पानी जमा न होने दें। सही पहचान के लिए फसल की फोटो उपयोगी होगी।",

            "Leaf spots may be caused by diseases, fungi or pests. Remove severely affected leaves and avoid excess moisture. A crop photo can help with further assessment."

        );

    }


    /* =========================================
       PEST
    ========================================= */

    if (
        message.includes("किड") ||
        message.includes("कीड") ||
        message.includes("कीड़ा") ||
        message.includes("pest") ||
        message.includes("insect") ||
        message.includes("kida") ||
        message.includes("kidi")
    ) {

        return getAnswer(

            "किडीचा प्रकार आणि पिकाचे नाव सांगितल्यास प्राथमिक मार्गदर्शन करता येईल. शक्य असल्यास किडीचा किंवा पिकाचा स्पष्ट फोटो अपलोड करा. कोणतेही कीटकनाशक वापरण्यापूर्वी लेबलवरील सूचना आणि कृषी तज्ज्ञांचा सल्ला घ्या.",

            "कीट का प्रकार और फसल का नाम बताएं। संभव हो तो कीट या फसल की स्पष्ट फोटो अपलोड करें। किसी भी कीटनाशक का उपयोग करने से पहले लेबल निर्देश और कृषि विशेषज्ञ की सलाह लें।",

            "Tell me the crop name and describe the pest. If possible, upload a clear photo of the pest or crop. Follow product-label instructions and consult an agricultural expert before using pesticides."

        );

    }


    /* =========================================
       WATER
    ========================================= */

    if (
        message.includes("पाणी") ||
        message.includes("water") ||
        message.includes("pani") ||
        message.includes("paani")
    ) {

        return getAnswer(

            "पाण्याची गरज पिकाचा प्रकार, माती, हवामान आणि पिकाच्या वाढीच्या अवस्थेनुसार बदलते. शेतात पाणी साचू देऊ नका आणि जमिनीतील ओलावा तपासा.",

            "पानी की आवश्यकता फसल, मिट्टी, मौसम और फसल की अवस्था पर निर्भर करती है। खेत में पानी जमा न होने दें और मिट्टी की नमी जांचें।",

            "Water requirements depend on the crop, soil, weather and growth stage. Avoid waterlogging and check soil moisture regularly."

        );

    }


    /* =========================================
       CROP REGISTRATION
    ========================================= */

    if (
        message.includes("पीक नोंदणी") ||
        message.includes("crop registration") ||
        message.includes("crop") ||
        message.includes("पिक") ||
        message.includes("pik")
    ) {

        return getAnswer(

            "पीक नोंदणीसाठी 'पिकांची माहिती' विभागात जा. तेथे पिकाचे नाव, वाण, क्षेत्रफळ आणि आवश्यक माहिती भरून नोंदणी पूर्ण करा.",

            "फसल पंजीकरण के लिए 'फसल जानकारी' विभाग में जाएं। फसल का नाम, किस्म, क्षेत्र और आवश्यक जानकारी भरें।",

            "For crop registration, open the 'Crop Information' section and enter the crop name, variety, area and required details."

        );

    }


    /* =========================================
       PROCUREMENT
    ========================================= */

    if (
        message.includes("खरेदी") ||
        message.includes("procurement") ||
        message.includes("शेतमाल") ||
        message.includes("produce")
    ) {

        return getAnswer(

            "शेतमाल खरेदीसाठी प्रथम शेतकरी नोंदणी आणि पीक माहिती पूर्ण करा. त्यानंतर उपलब्ध स्लॉट बुक करा आणि दिलेल्या वेळेनुसार खरेदी केंद्रावर उपस्थित राहा.",

            "कृषि उपज बेचने के लिए पहले किसान पंजीकरण और फसल की जानकारी पूरी करें। फिर उपलब्ध स्लॉट बुक करें और निर्धारित समय पर खरीद केंद्र पर पहुंचें।",

            "For produce procurement, complete farmer registration and crop details first. Then book an available slot and visit the procurement center at the scheduled time."

        );

    }


    /* =========================================
       DOCUMENTS
    ========================================= */

    if (
        message.includes("कागदपत्र") ||
        message.includes("documents") ||
        message.includes("document") ||
        message.includes("कागज")
    ) {

        return getAnswer(

            "आवश्यक कागदपत्रे केंद्र आणि खरेदी प्रक्रियेनुसार बदलू शकतात. सामान्यतः शेतकरी ओळख, नोंदणी आणि जमिनीशी संबंधित माहिती आवश्यक असू शकते. तुमच्या संबंधित खरेदी केंद्राच्या अधिकृत सूचनांची खात्री करा.",

            "आवश्यक दस्तावेज केंद्र और खरीद प्रक्रिया के अनुसार अलग हो सकते हैं। आमतौर पर किसान की पहचान, पंजीकरण और भूमि संबंधी जानकारी की आवश्यकता हो सकती है। संबंधित खरीद केंद्र के नियमों की पुष्टि करें।",

            "Required documents may vary by procurement center and process. Farmer identification, registration and land-related information may commonly be required. Confirm the exact requirements with your procurement center."

        );

    }


    /* =========================================
       HELLO
    ========================================= */

    if (
        message.includes("नमस्कार") ||
        message.includes("हॅलो") ||
        message.includes("hello") ||
        message.includes("hi") ||
        message.includes("नमस्ते") ||
        message.includes("namaskar") ||
        message.includes("namaste")
    ) {

        return getAnswer(

            "नमस्कार शेतकरी मित्रा! 🌾 मी तुमची मदत करण्यासाठी येथे आहे. तुम्ही पीक समस्या, स्लॉट, टोकन, पेमेंट किंवा तक्रारींबद्दल विचारू शकता.",

            "नमस्कार किसान मित्र! 🌾 मैं आपकी सहायता के लिए यहां हूं। आप फसल, स्लॉट, टोकन, भुगतान या शिकायत के बारे में पूछ सकते हैं।",

            "Hello farmer! 🌾 I am here to help. You can ask me about crop problems, slots, tokens, payments or complaints."

        );

    }


    /* =========================================
       THANK YOU
    ========================================= */

    if (
        message.includes("धन्यवाद") ||
        message.includes("thanks") ||
        message.includes("thank you") ||
        message.includes("धन्य") ||
        message.includes("thank")
    ) {

        return getAnswer(

            "तुमचे स्वागत आहे! 😊 शेतीसंबंधी किंवा आमच्या सेवांबद्दल आणखी काही प्रश्न असल्यास नक्की विचारा. 🌾",

            "आपका स्वागत है! 😊 खेती या हमारी सेवाओं से संबंधित कोई और प्रश्न हो तो जरूर पूछें। 🌾",

            "You're welcome! 😊 Feel free to ask any other farming or service-related questions. 🌾"

        );

    }


    /* =========================================
       DEFAULT
    ========================================= */

    return getAnswer(

        `
        मला तुमचा प्रश्न पूर्णपणे समजला नाही. 😊

        तुम्ही मला याबद्दल विचारू शकता:

        🌱 पीक समस्या<br>
        🐛 किडी व रोग<br>
        💧 पाणी व्यवस्थापन<br>
        🧾 स्लॉट बुकिंग<br>
        🎟️ टोकन<br>
        💰 पेमेंट<br>
        📝 तक्रार<br>
        🌾 पीक नोंदणी

        <br><br>

        उदाहरण:
        <br>
        <b>"माझ्या सोयाबीनच्या पानांवर डाग आहेत."</b>
        `,

        `
        मुझे आपका प्रश्न पूरी तरह समझ नहीं आया। 😊

        आप मुझसे इन विषयों के बारे में पूछ सकते हैं:

        🌱 फसल समस्या<br>
        🐛 कीट और रोग<br>
        💧 पानी प्रबंधन<br>
        🧾 स्लॉट बुकिंग<br>
        🎟️ टोकन<br>
        💰 भुगतान<br>
        📝 शिकायत<br>
        🌾 फसल पंजीकरण
        `,

        `
        I could not fully understand your question. 😊

        You can ask me about:

        🌱 Crop problems<br>
        🐛 Pests and diseases<br>
        💧 Water management<br>
        🧾 Slot booking<br>
        🎟️ Token<br>
        💰 Payment<br>
        📝 Complaints<br>
        🌾 Crop registration
        `

    );

}


/* =====================================================
   RETURN ANSWER IN SELECTED LANGUAGE
===================================================== */

function getAnswer(marathi, hindi, english) {

    if (selectedLanguage === "mr") {

        return marathi;

    }

    if (selectedLanguage === "hi") {

        return hindi;

    }

    return english;

}