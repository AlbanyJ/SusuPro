// ============================================================
// FILE 4: src/services/authService.js
// WHAT:   Handles login, logout, and session checking.
//         Uses Firebase Authentication under the hood.
//         Firebase hashes passwords automatically (secure).
// ============================================================

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// ── GET USER PROFILE ──────────────────────────────────────────
// Firebase Auth only knows email/uid — role, name, avatar live in
// the matching Firestore users/{uid} document.
export async function getUserProfile(uid) {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  return { id: uid, ...userDoc.data() };
}

// ── LOGIN ─────────────────────────────────────────────────────
// Called when user taps "Sign In" on the login screen.
// Firebase checks email + password automatically.
export async function loginUser(email, password) {
  try {
    // Step 1: Firebase checks the password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Step 2: Get this user's profile from Firestore
    // (role, name, avatar — stuff Firebase Auth doesn't store)
    const profile = await getUserProfile(uid);

    if (!profile) {
      throw new Error('User profile not found.');
    }

    return { success: true, user: profile };

  } catch (error) {
    // Map Firebase error codes to friendly messages
    const messages = {
      'auth/user-not-found':  'No account found with this email.',
      'auth/wrong-password':  'Incorrect password. Try again.',
      'auth/too-many-requests': 'Too many attempts. Please wait.',
      'auth/invalid-email':   'Please enter a valid email address.',
    };
    const message = messages[error.code] || 'Login failed. Please try again.';
    return { success: false, error: message };
  }
}

// ── LOGOUT ────────────────────────────────────────────────────
// Called when user taps "Sign Out" in Settings.
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── AUTH STATE LISTENER ───────────────────────────────────────
// Watches for login/logout changes automatically.
// Used in App.js to keep user logged in after app restarts.
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}