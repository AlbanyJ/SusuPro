// ============================================================
// FILE 6: src/services/transactionService.js
// WHAT:   Records money going IN (contributions) and
//         money going OUT (withdrawals).
//         Also updates the customer's balance.
//         Uses Firestore transactions for data integrity
//         (either BOTH the transaction AND balance update
//         succeed, or NEITHER does — no half-saves).
// ============================================================

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  runTransaction,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

const TXN_COLLECTION      = 'transactions';
const CUSTOMER_COLLECTION = 'customers';

// ── RECORD A TRANSACTION ──────────────────────────────────────
// This is the most critical function in the app.
// It uses a Firestore "runTransaction" to guarantee that:
//   1. The transaction record is saved
//   2. The customer balance is updated
// Both happen together or not at all.
export async function recordTransaction({
  customerId, type, amount, collectorId, collectorName, notes,
  paymentMethod, network, approvedBy,
}) {
  try {
    // Validate inputs before touching the database
    if (!customerId) throw new Error('Customer is required.');
    if (!amount || amount <= 0) throw new Error('Amount must be greater than 0.');
    if (!['contribution', 'withdrawal'].includes(type)) throw new Error('Invalid transaction type.');

    const customerRef = doc(db, CUSTOMER_COLLECTION, customerId);
    const txnRef = doc(collection(db, TXN_COLLECTION));

    // runTransaction guarantees atomicity (all-or-nothing)
    await runTransaction(db, async (firestoreTransaction) => {
      const customerSnap = await firestoreTransaction.get(customerRef);

      if (!customerSnap.exists()) throw new Error('Customer not found.');

      const currentBalance = customerSnap.data().balance;

      // Prevent withdrawals that exceed balance
      if (type === 'withdrawal' && amount > currentBalance) {
        throw new Error(`Insufficient balance. Available: GHS ${currentBalance.toLocaleString()}`);
      }

      // Calculate new balance
      const newBalance = type === 'contribution'
        ? currentBalance + amount
        : currentBalance - amount;

      // Update customer balance
      firestoreTransaction.update(customerRef, {
        balance:   newBalance,
        updatedAt: serverTimestamp(),
      });

      // Add transaction record to the transactions collection.
      // collectorName is denormalized onto the record so any
      // logged-in user can show "who did this" without needing
      // read access to other users' profiles (firestore.rules
      // only lets a user read their own profile, or an admin
      // read everyone's).
      firestoreTransaction.set(txnRef, {
        customerId,
        type,
        amount,
        collectorId,
        collectorName: collectorName || '',
        notes:         notes || '',
        paymentMethod: paymentMethod || 'cash',
        network:       paymentMethod === 'momo' ? (network || null) : null,
        // Set only when this transaction came from an approved
        // withdrawal request — see withdrawalService.approveWithdrawal.
        approvedBy:    approvedBy || null,
        status:        'completed',
        date:          new Date().toISOString().split('T')[0],
        time:          new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }),
        createdAt:     serverTimestamp(),
      });
    });

    return { success: true, id: txnRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── FETCH ALL TRANSACTIONS ────────────────────────────────────
// Admins get every transaction; collectors only get the ones they
// recorded — matching firestore.rules, which rejects an unscoped
// query from a non-admin.
export async function fetchTransactions(currentUser) {
  try {
    const isAdmin = currentUser?.role === 'admin';
    const q = isAdmin
      ? query(collection(db, TXN_COLLECTION), orderBy('createdAt', 'desc'))
      : query(
          collection(db, TXN_COLLECTION),
          where('collectorId', '==', currentUser?.id || '__none__'),
          orderBy('createdAt', 'desc')
        );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── FETCH TRANSACTIONS FOR ONE CUSTOMER ───────────────────────
export async function fetchCustomerTransactions(customerId) {
  try {
    const q = query(
      collection(db, TXN_COLLECTION),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}