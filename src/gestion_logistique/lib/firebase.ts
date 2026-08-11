import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, ref, onValue, set, type Database } from 'firebase/database';
import { InventoryItem, StockMovement, FinancialTransaction, Supplier, AssociationProfile } from '../types';
import { INITIAL_INVENTORY, INITIAL_MOVEMENTS, INITIAL_TRANSACTIONS, INITIAL_SUPPLIERS, INITIAL_PROFILE } from '../data/initialData';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAgCEmahBYIjsrHexZBAfOJ36e5dlsUynw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'baseamm-9c2c7.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app/',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'baseamm-9c2c7',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'baseamm-9c2c7.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '669566780526',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:669566780526:web:58f8d6b9c6b298f0cb0e0b0',
};

let app: FirebaseApp;
let auth: Auth;
let database: Database;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
} catch (error) {
  console.error('[Firebase] Erreur lors de l’initialisation :', error);
  throw error;
}

export { app, auth, database, database as db };

// Firebase Realtime DB Data Sync Utilities
export const seedDatabaseIfEmpty = async (): Promise<boolean> => {
  try {
    const rootRef = ref(database, 'site_amm');
    await set(rootRef, {
      profile: INITIAL_PROFILE,
      inventory: INITIAL_INVENTORY.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}),
      movements: INITIAL_MOVEMENTS.reduce((acc, mov) => ({ ...acc, [mov.id]: mov }), {}),
      transactions: INITIAL_TRANSACTIONS.reduce((acc, tx) => ({ ...acc, [tx.id]: tx }), {}),
      suppliers: INITIAL_SUPPLIERS.reduce((acc, sup) => ({ ...acc, [sup.id]: sup }), {}),
      lastSync: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.warn('[Firebase] Warning seeding database:', error);
    return false;
  }
};

export const subscribeToRealtimeBranch = <T>(
  path: string,
  onData: (data: T | null) => void,
  onError?: (err: Error) => void
) => {
  try {
    const branchRef = ref(database, `site_amm/${path}`);
    return onValue(
      branchRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.val());
        } else {
          onData(null);
        }
      },
      (error) => {
        console.warn(`[Firebase] Listener error on branch ${path}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.warn(`[Firebase] Exception setting up listener on ${path}:`, err);
    if (onError) onError(err as Error);
    return () => {};
  }
};

export const pushRealtimeBranch = async <T>(path: string, data: T): Promise<boolean> => {
  try {
    const itemRef = ref(database, `site_amm/${path}`);
    await set(itemRef, data);
    return true;
  } catch (err) {
    console.warn(`[Firebase] Failed to write to ${path}:`, err);
    return false;
  }
};
