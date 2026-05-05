import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBXZeuVGVPVK7lXvIva5_w1wxd7bjkJ9hQ",
  authDomain: "my-tasks-fe357.firebaseapp.com",
  projectId: "my-tasks-fe357",
  storageBucket: "my-tasks-fe357.firebasestorage.app",
  messagingSenderId: "554618649476",
  appId: "1:554618649476:web:bafb8b03789dcf8788fbd1",
  measurementId: "G-ZEHK11V7WQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
