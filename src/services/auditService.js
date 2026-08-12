// ============================================================
// src/services/auditService.js
// WHAT:   Writes a permanent record of admin-sensitive actions
//         (withdrawal approvals/rejections, activating/deactivating
//         a customer, reassigning a collector, creating a team
//         member) — so "who did this, and when" always has an
//         answer. Routine transactions already have their own
//         permanent record (the transactions collection is
//         create-only); this is for the governance actions that
//         don't otherwise leave a trail.
// ============================================================

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'audit_log';

// Logging must never block or fail the action it's describing —
// callers fire-and-forget this (or await it and ignore the result).
export async function logAction({ action, userId, targetId, detail }) {
  try {
    await addDoc(collection(db, COLLECTION), {
      action,
      userId,
      targetId:  targetId || null,
      detail:    detail || '',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('[Audit] Failed to log action:', error.message);
  }
}
