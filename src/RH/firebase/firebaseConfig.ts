import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAgCEmahBYIjsrHexZBAfOJ36e5dlsUynw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'baseamm-9c2c7.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app/',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'baseamm-9c2c7',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'baseamm-9c2c7.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '669566780526',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:669566780526:web:58f8d6b9c6b298f0cb0e0b0',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

// Fisorohana ny famoronana app miverina indroa (Duplicate App Error)
let app: FirebaseApp;
let auth: Auth;
let database: Database;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  console.info('[Firebase] Initialisation réussie.');
} catch (error) {
  console.error('[Firebase] Erreur lors de l’initialisation :', error);
  throw error;
}

// Exports rehetra ilaina ao amin'ny projet
export { app, auth, database, database as db };

export function getFirebaseDatabase(): Database {
  return database;
}

export function getFirebaseAuth(): Auth {
  return auth;
}

export function getFirebaseApp(): FirebaseApp {
  return app;
}