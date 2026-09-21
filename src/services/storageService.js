// ============================================================
// src/services/storageService.js
// WHAT:   Uploads customer profile photos to Cloudinary and
//         returns a public URL to save on the customer's
//         Firestore document.
//
// WHY CLOUDINARY (not Firebase Storage):
//         Firebase Storage now requires the paid Blaze plan just
//         to enable it. Cloudinary's free tier (25 monthly
//         credits ≈ 25GB of storage/bandwidth) covers customer
//         photos for this app with no card on file.
//
// SETUP STEPS:
//   1. Create a free account at https://cloudinary.com
//   2. Copy your "Cloud name" from the dashboard
//   3. Settings → Upload → Upload presets → Add upload preset
//        - Signing Mode: Unsigned
//        - (optional) Folder: customers
//      Save it and copy the preset name.
//   4. In .env, set:
//        EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
//        EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
//
// An unsigned upload preset is safe to use directly from the app —
// no API secret is ever bundled into the client.
// ============================================================

const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// ── UPLOAD CUSTOMER PHOTO ─────────────────────────────────────
// localUri comes straight from expo-image-picker (a file:// URI
// on-device). customerId tags the upload so photos are easy to
// find/manage in the Cloudinary dashboard.
export async function uploadCustomerPhoto(localUri, customerId) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return {
      success: false,
      error: 'Cloudinary is not configured — set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      type: 'image/jpeg',
      name: `${customerId}-${Date.now()}.jpg`,
    });
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('public_id', `customers/${customerId}-${Date.now()}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Upload failed.' };
    }

    return { success: true, url: data.secure_url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
