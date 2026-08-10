// ============================================================
// src/services/userService.js
// WHAT:   Team member management. Admin-only.
//         Lists team members and provisions new accounts.
// ============================================================

import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  doc, setDoc, getDocs, collection, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { db, getSecondaryAuth } from './firebase';

const COLLECTION = 'users';

// ── LIST TEAM MEMBERS ─────────────────────────────────────────
// Only an admin can read the full users collection — see
// firestore.rules (a non-admin can only read their own profile).
export async function fetchUsers() {
  try {
    const q = query(collection(db, COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── CREATE TEAM MEMBER ────────────────────────────────────────
// Admin-only. Firebase's client SDK signs you in as whichever
// user you just created, which would otherwise kick the admin
// out of their own session — so the new account is created on a
// throwaway secondary app instance (see getSecondaryAuth) and
// that secondary session is discarded immediately after.
export async function createTeamMember({ name, email, password, role }) {
  const secondaryAuth = getSecondaryAuth();
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const uid = credential.user.uid;

    const avatar = name.trim().split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();

    await setDoc(doc(db, COLLECTION, uid), {
      name: name.trim(),
      email: email.trim(),
      role,
      avatar,
      createdAt: serverTimestamp(),
    });

    return { success: true, id: uid };
  } catch (error) {
    const messages = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email':        'Please enter a valid email address.',
      'auth/weak-password':        'Password must be at least 6 characters.',
    };
    return { success: false, error: messages[error.code] || error.message };
  } finally {
    // Always discard the throwaway session, success or failure.
    await signOut(secondaryAuth).catch(() => {});
  }
}
