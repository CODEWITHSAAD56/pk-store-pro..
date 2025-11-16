// Firebase Configuration for PK INTERNATIONAL STORE
const firebaseConfig = {
    apiKey: "AIzaSyDrhmIcWcS8AhP-41q2OCzGrHteKJCDkUQ",
    authDomain: "store-12-92c5f.firebaseapp.com",
    databaseURL: "https://store-12-92c5f-default-rtdb.firebaseio.com",
    projectId: "store-12-92c5f",
    storageBucket: "store-12-92c5f.appspot.com",
    messagingSenderId: "338136504463",
    appId: "1:338136504463:web:7f2c217c23d7f6afb7b8fa"
};

// Initialize Firebase
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global database reference
if (typeof firebase !== 'undefined') {
    window.db = firebase.database();
    window.auth = firebase.auth();
    
    // Storage initialize karein agar available hai toh
    if (firebase.storage) {
        window.storage = firebase.storage();
    }
}

console.log("Firebase initialized successfully!");