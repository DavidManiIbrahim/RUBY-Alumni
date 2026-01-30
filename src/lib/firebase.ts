// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB2F7DDDqjRq8mmlmjU07C0BGsIoRc7k98",
    authDomain: "gauth-dc27e.firebaseapp.com",
    projectId: "gauth-dc27e",
    storageBucket: "gauth-dc27e.firebasestorage.app",
    messagingSenderId: "969367896572",
    appId: "1:969367896572:web:85ee053f9e1f9e8c21b279",
    measurementId: "G-CQ4EHZV384"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
