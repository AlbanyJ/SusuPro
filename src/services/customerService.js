// ============================================================
// FILE 5: src/services/customerService.js
// WHAT:   Everything related to customers.
//         Add, edit, delete, and fetch from Firestore.
// ============================================================

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'customers'; // Firestore collection name

// ── GET ALL CUSTOMERS ─────────────────────────────────────────
export async function fetchCustomers() {
  try {
    const q = query(collection(db, COLLECTION), orderBy('name'));
    const snapshot = await getDocs(q);
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    return { success: true, data: customers };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── ADD NEW CUSTOMER ──────────────────────────────────────────
// Called when admin fills the "Add Customer" form.
export async function addCustomer(customerData, addedBy) {
  try {
    // Build the avatar initials from the customer's name
    const nameParts = customerData.name.trim().split(' ');
    const avatar = nameParts.map(p => p[0]).join('').substring(0, 2).toUpperCase();

    const newCustomer = {
      name:          customerData.name.trim(),
      phone:         customerData.phone.trim(),
      idNo:          customerData.idNo?.trim() || '',
      balance:       0,                   // Always starts at 0
      active:        true,
      avatar,
      joinDate:      new Date().toISOString().split('T')[0],
      // Fixed daily amount (e.g. GHS 20/day), or null for a flexible
      // contribution where the customer pays whatever they bring.
      fixedAmount:   customerData.fixedAmount ? Number(customerData.fixedAmount) : null,
      paymentMethod: customerData.paymentMethod || 'cash',   // 'momo' | 'bank' | 'cash'
      network:       customerData.paymentMethod === 'momo' ? (customerData.network || null) : null,
      collectorId:   customerData.collectorId || null,       // assigned field collector
      photo:         customerData.photo || null,              // Firebase Storage download URL
      createdBy:     addedBy,             // Who added this customer
      createdAt:     serverTimestamp(),   // Firebase server time
    };

    const docRef = await addDoc(collection(db, COLLECTION), newCustomer);
    return { success: true, id: docRef.id, data: { id: docRef.id, ...newCustomer } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── UPDATE CUSTOMER ───────────────────────────────────────────
// Called when editing customer info or toggling active/inactive.
export async function updateCustomer(customerId, updates) {
  try {
    const ref = doc(db, COLLECTION, customerId);
    await updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ── DELETE CUSTOMER ───────────────────────────────────────────
// Admin only. Permanently removes the customer.
export async function deleteCustomer(customerId) {
  try {
    await deleteDoc(doc(db, COLLECTION, customerId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}