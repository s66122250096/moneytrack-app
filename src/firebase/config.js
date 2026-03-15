import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔥 ใส่ค่าจาก Firebase Console ของคุณตรงนี้
// Firebase Console → Project Settings → Your Apps → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyAjW8mNtJ-nVesMS2AS5P2zOSbYWyn6xBc",
  authDomain: "moneytrack-c3e3d.firebaseapp.com",
  projectId: "moneytrack-c3e3d",
  storageBucket: "moneytrack-c3e3d.firebasestorage.app",
  messagingSenderId: "80661028250",
  appId: "1:80661028250:web:69c9ba7f7b6203ce226e23",
};

const app = initializeApp(firebaseConfig);

// Auth — ใช้ AsyncStorage เพื่อ persist login
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Firestore database
export const db = getFirestore(app);
