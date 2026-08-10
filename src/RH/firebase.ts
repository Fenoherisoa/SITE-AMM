import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyATgj1I5gY1NkE7EiXg6ad4iiTZD4V4b2A',
  authDomain: 'baseamm-9c2c7.firebaseapp.com',
  databaseURL: 'https://baseamm-9c2c7-default-rtdb.europe-west1.firebasedatabase.app/',
  projectId: 'baseamm-9c2c7',
  storageBucket: 'baseamm-9c2c7.firebasestorage.app',
  messagingSenderId: '669566780526',
  appId: '1:669566780526:web:58f8d6b9c6b298f0cb0e0b0',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
