// ============================================================
// src/services/biometricService.js
// WHAT:   App-open lock using Face ID / fingerprint (or the
//         device's own passcode as an OS-provided fallback).
//         This does NOT replace Firebase Auth — the login session
//         still persists as before. It's a local gate in front of
//         the already-logged-in app, same pattern as a banking app:
//         re-prove it's really you before the screen full of real
//         money data is visible, every time the app is opened.
// ============================================================

import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'susupro:biometricLockEnabled';

// Does this device even support it? (hardware present AND the user
// has actually enrolled a fingerprint/face in their OS settings)
export async function isBiometricAvailable() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return isEnrolled;
}

export async function getBiometricLockEnabled() {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  return saved === 'true';
}

export async function setBiometricLockEnabled(enabled) {
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}

// Prompts Face ID / fingerprint / device passcode. Returns true only
// on a real success — cancelling, failing, or no hardware all return
// false so the caller stays locked.
export async function authenticate(promptMessage = 'Unlock SusuPro') {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      disableDeviceFallback: false, // let the OS fall back to device passcode
      cancelLabel: 'Cancel',
    });
    return !!result.success;
  } catch {
    return false;
  }
}
