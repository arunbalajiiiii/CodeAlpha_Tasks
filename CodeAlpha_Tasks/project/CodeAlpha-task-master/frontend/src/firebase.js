import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { isSupported, getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBIPF5dzQZ0nB_xaMk80uJaHntWZ-OXkow",
  authDomain: "project-management-1239a.firebaseapp.com",
  projectId: "project-management-1239a",
  storageBucket: "project-management-1239a.firebasestorage.app",
  messagingSenderId: "1032112269461",
  appId: "1:1032112269461:web:8d0aabf5e663557468939c",
  measurementId: "G-FZHH18MY3X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only works on HTTPS (not localhost) — initialize safely
export let analytics = null;
isSupported().then((supported) => {
  if (supported) analytics = getAnalytics(app);
});

export default app;
