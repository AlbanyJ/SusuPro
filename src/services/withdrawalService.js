// ============================================================
// src/services/withdrawalService.js
// WHAT:   Withdrawal approval workflow. Collectors can only
//         request a withdrawal; only an admin can approve
//         (which actually moves the money) or reject it.
//         Admins skip this entirely and withdraw directly via
//         transactionService.recordTransaction.
// ============================================================

import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { recordTransaction } from './transactionService';
import { logAction } from './auditService';

const COLLECTION = 'pendingWithdrawals';
const CUSTOMER_COLLECTION = 'customers';

// ── REQUEST A WITHDRAWAL ──────────────────────────────────────
// Called by a collector. Does NOT touch the customer's balance —
// it just files a request an admin has to act on.
export async function requestWithdrawal({ customerId, amount, requestedBy, requestedByName, notes, paymentMethod, network }) {
  try {
    if (!customerId) throw new Error('Customer is required.');
    if (!amount || amount <= 0) throw new Error('Amount must be greater than 0.');

    // Check against the customer's current balance so collectors get
    // immediate feedback instead of filing a request that can never
    // be approved.
    const customerSnap = await getDoc(doc(db, CUSTOMER_COLLECTION, customerId));
    if (!customerSnap.exists()) throw new Error('Customer not found.');
    const balance = customerSnap.data().balance;
    if (amount > balance) {
      throw new Error(`Insufficient balance. Available: GHS ${balance.toLocaleString()}`);
    }

    const docRef = await addDoc(collection(db, COLLECTION), {
      customerId,
      amount,
      requestedBy,
      requestedByName: requestedByName || '',
      notes:           notes || '',
      paymentMethod:   paymentMethod || 'cash',
      network:         paymentMethod === 'momo' ? (network || null) : null,
      status:          'pending',
      approvedBy:      null,
      approvedAt:      null,
      requestedAt:     serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── FETCH PENDING WITHDRAWALS ─────────────────────────────────
// Admins get every request (the Dashboard's approval queue);
// collectors only get their own — matching firestore.rules, which
// rejects an unscoped query from a non-admin.
export async function fetchPendingWithdrawals(currentUser) {
  try {
    const isAdmin = currentUser?.role === 'admin';
    const q = isAdmin
      ? query(collection(db, COLLECTION), orderBy('requestedAt', 'desc'))
      : query(
          collection(db, COLLECTION),
          where('requestedBy', '==', currentUser?.id || '__none__'),
          orderBy('requestedAt', 'desc')
        );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── APPROVE A WITHDRAWAL ──────────────────────────────────────
// This is the moment the money actually moves: records the real
// transaction (atomic balance update, via transactionService) and
// marks the request approved. The transaction is attributed to the
// collector who requested it, with approvedBy recording the admin.
export async function approveWithdrawal(withdrawalId, admin) {
  try {
    const ref = doc(db, COLLECTION, withdrawalId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Withdrawal request not found.');
    const w = snap.data();
    if (w.status !== 'pending') throw new Error('This request has already been reviewed.');

    const result = await recordTransaction({
      customerId:    w.customerId,
      type:          'withdrawal',
      amount:        w.amount,
      collectorId:   w.requestedBy,
      collectorName: w.requestedByName,
      notes:         w.notes,
      paymentMethod: w.paymentMethod,
      network:       w.network,
      approvedBy:    admin.id,
    });

    if (!result.success) throw new Error(result.error);

    await updateDoc(ref, {
      status:     'approved',
      approvedBy: admin.id,
      approvedAt: serverTimestamp(),
    });

    await logAction({
      action:   'withdrawal_approved',
      userId:   admin.id,
      targetId: withdrawalId,
      detail:   `Approved GHS ${w.amount.toLocaleString()} withdrawal requested by ${w.requestedByName || w.requestedBy}`,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── REJECT A WITHDRAWAL ───────────────────────────────────────
// No balance change — just closes out the request.
export async function rejectWithdrawal(withdrawalId, admin) {
  try {
    await updateDoc(doc(db, COLLECTION, withdrawalId), {
      status:     'rejected',
      approvedBy: admin.id,
      approvedAt: serverTimestamp(),
    });

    await logAction({
      action:   'withdrawal_rejected',
      userId:   admin.id,
      targetId: withdrawalId,
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
