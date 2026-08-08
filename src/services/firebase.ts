import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

/**
 * Firebase configuration
 *
 * Les valeurs peuvent être fournies via les variables VITE_*
 * du fichier .env.
 *
 * Le projet AMM dispose également de valeurs par défaut.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 
    'AIzaSyAgCEmahBYIjsrHexZBAfOJ36e5dlsUynw',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    'baseamm-9c2c7.firebaseapp.com',

  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app',

  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    'baseamm-9c2c7',

  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'baseamm-9c2c7.appspot.com',

  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',

  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || 
    '1:126755156140:web:1e913077a929fb0b7eaf09',
};

/**
 * Vérifie si Firebase possède une configuration suffisante.
 *
 * L'API Key est le minimum nécessaire pour considérer
 * Firebase comme configuré dans cette application.
 */
export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey);

/**
 * Firebase instances
 */
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Database | null = null;

/**
 * Initialisation Firebase
 */
try {
  if (isFirebaseConfigured) {
    /**
     * Réutilise l'application Firebase existante
     * si elle a déjà été initialisée.
     */
    app = getApps().length > 0
      ? getApp()
      : initializeApp(firebaseConfig);

    /**
     * Firebase Authentication
     */
    auth = getAuth(app);

    /**
     * Firebase Realtime Database
     */
    database = getDatabase(app, firebaseConfig.databaseURL);

    console.info('[Firebase] Initialisation réussie.');
  } else {
    console.warn(
      '[Firebase] Firebase non configuré : VITE_FIREBASE_API_KEY est manquant.'
    );
  }
} catch (error) {
  console.error(
    '[Firebase] Erreur lors de l’initialisation :',
    error
  );

  app = null;
  auth = null;
  database = null;
}

/**
 * Exports
 */
export { app, auth, database };

/**
 * Helper sécurisé pour vérifier que Firebase Database
 * est disponible avant de l'utiliser.
 */
export function getFirebaseDatabase(): Database {
  if (!database) {
    throw new Error(
      '[Firebase] Realtime Database non disponible. ' +
      'Vérifiez votre configuration Firebase et votre fichier .env.'
    );
  }

  return database;
}

/**
 * Helper sécurisé pour Firebase Auth
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    throw new Error(
      '[Firebase] Authentication non disponible. ' +
      'Vérifiez votre configuration Firebase et votre fichier .env.'
    );
  }

  return auth;
}

/**
 * Helper sécurisé pour Firebase App
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    throw new Error(
      '[Firebase] Application Firebase non initialisée.'
    );
  }

  return app;
}

