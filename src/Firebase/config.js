// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAuszvG6DUL33SwPuJoPfNMmDI4D00WH-k",
  authDomain: "hulkfitnessgymmanagement.firebaseapp.com",
  projectId: "hulkfitnessgymmanagement",
  storageBucket: "hulkfitnessgymmanagement.firebasestorage.app",
  messagingSenderId: "484855420700",
  appId: "1:484855420700:web:ebad97fa2fa1df1aec8cd9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {db, auth};