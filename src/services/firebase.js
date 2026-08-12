// ============================================================
// FILE 3: src/services/firebase.js
// WHAT:   Connects the app to your Firebase project.
//         Firebase handles: Auth, Database, File Storage.
//
// SETUP STEPS:
//   1. Go to https://console.firebase.google.com
//   2. Create a project (e.g. "SusuPro")
//   3. Click "Add app" → choose Web
//   4. Copy .env.example to .env and paste your config values in
//   5. Enable "Email/Password" under Authentication → Sign-in methods
//   6. Create a Firestore database, then deploy firestore.rules
//      and firestore.indexes.json (see README.md)
//
// Config comes from environment variables (EXPO_PUBLIC_* are
// inlined by Expo at build time) so real credentials never need
// to be hardcoded or committed to source control.
// ============================================================

import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Customer photos are hosted on Cloudinary (see storageService.js) rather
// than Firebase Storage, since Storage now requires the paid Blaze plan
// just to switch on — Cloudinary's free tier covers this app's needs
// without asking for a card.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    '[Firebase] Missing configuration — copy .env.example to .env and fill in ' +
    'your Firebase project credentials, then restart the Expo dev server.'
  );
}

const app = initializeApp(firebaseConfig);

// React Native has no browser storage, so Auth needs to be told
// explicitly to persist the session in AsyncStorage — otherwise
// users get logged out every time the app restarts.
export const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

export const db = getFirestore(app);

// ── SECONDARY APP INSTANCE ────────────────────────────────────
// Used only when an admin creates a new team member from inside
// the app. Firebase's client SDK signs you in as whichever user
// you just created, which would kick the admin out of their own
// session — so account creation happens on a throwaway second
// app instance instead, and is signed out immediately after.
export function getSecondaryAuth() {
  const secondaryApp = getApps().some(a => a.name === 'Secondary')
    ? getApp('Secondary')
    : initializeApp(firebaseConfig, 'Secondary');
  return getAuth(secondaryApp);
}

export default app;
