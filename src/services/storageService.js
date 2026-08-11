// ============================================================
// src/services/storageService.js
// WHAT:   Uploads customer profile photos to Firebase Storage
//         and returns a public download URL to save on the
//         customer's Firestore document.
// ============================================================

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// ── UPLOAD CUSTOMER PHOTO ─────────────────────────────────────
// localUri comes straight from expo-image-picker (a file:// URI
// on-device). customerId scopes the storage path so photos don't
// collide and storage.rules can key access off it.
export async function uploadCustomerPhoto(localUri, customerId) {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();

    const path = `customers/${customerId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, path);

    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);

    return { success: true, url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
