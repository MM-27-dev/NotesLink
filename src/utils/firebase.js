// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWXxFRNtIVOnY8Sze4Mfwd6Y_uTjkKVO4",
  authDomain: "voiceagentai-9364f.firebaseapp.com",
  projectId: "voiceagentai-9364f",
  storageBucket: "voiceagentai-9364f.firebasestorage.app",
  messagingSenderId: "670354926055",
  appId: "1:670354926055:web:a434f80ac23bf5e3f43542",
  measurementId: "G-16NX1SHT8D",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// eslint-disable-next-line no-unused-vars
const analytics = getAnalytics(app);
export const auth = getAuth();