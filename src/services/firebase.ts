import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getDatabase, Database } from 'firebase/database';

// Environment variables or default RTDB configuration provided for AMM
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "baseamm-9c2c7.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "baseamm-9c2c7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "baseamm-9c2c7.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Database | null = null;

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_API_KEY !== ""
);

try {
  if (isFirebaseConfigured) {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    database = getDatabase(app, firebaseConfig.databaseURL);
  }
} catch (error) {
  console.warn('[Firebase] SDK initialization deferred or missing API key:', error);
}

export { app, auth, database };

