import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración WEB del proyecto (Firebase Console > Configuración del proyecto > General > Tus apps)
const firebaseConfig = {
  apiKey: "AIzaSyBFP1ZYbgq-q5Eh29_x2gQ7ohUHU0Ja1Ig",
  authDomain: "bdnorelacional-4030d.firebaseapp.com",
  projectId: "bdnorelacional-4030d",
  storageBucket: "bdnorelacional-4030d.firebasestorage.app",
  messagingSenderId: "1054405857180",
  appId: "1:1054405857180:web:ff0119f114b443af854259",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
