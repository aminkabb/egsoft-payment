import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCI49mQ4v0xRO1RsbiAD23VLZEvzqZI3IE",
  authDomain: "myquizapp-f2686.firebaseapp.com",
  projectId: "myquizapp-f2686",
  storageBucket: "myquizapp-f2686.firebasestorage.app",
  messagingSenderId: "351586926960",
  appId: "1:351586926960:web:53182b527996af6fd9cfb5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };