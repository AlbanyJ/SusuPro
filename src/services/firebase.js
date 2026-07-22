// ============================================================
// FILE 3: src/services/firebase.js
// WHAT:   Connects the app to your Firebase project.
//         Firebase handles: Auth, Database, File Storage.
//
// SETUP STEPS:
//   1. Go to https://console.firebase.google.com
//   2. Create a project called "SusuPro"
//   3. Click "Add app" → choose Web
//   4. Copy your config and paste it below
//   5. Enable "Email/Password" under Authentication → Sign-in methods
//   6. Create a Firestore database (start in test mode)
// ============================================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ── PASTE YOUR FIREBASE CONFIG HERE ──────────────────────────
// Get this from: Firebase Console → Project Settings → Your apps
const firebaseConfig = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId:             'YOUR_APP_ID',
};
// ─────────────────────────────────────────────────────────────

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the services you'll use in other files
export const auth      = getAuth(app);       // For login/logout
export const db        = getFirestore(app);  // For storing data
export const storage   = getStorage(app);    // For photos

export default app;