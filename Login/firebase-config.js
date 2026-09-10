/* =========================================================
   KISANSETU (किसानसेतू) - FIREBASE CONFIGURATION
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyForOfflineOrDevEnvironmentOnly_12345",
    authDomain: "hackathon-bba6f.firebaseapp.com",
    projectId: "hackathon-bba6f",
    storageBucket: "hackathon-bba6f.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

// Initialize Firebase if library is available
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully for KisanSetu");
    } catch (e) {
        console.warn("Firebase initialization warning (local mode active):", e.message);
    }
}
