// ============================================================
// FILE 7: src/services/syncService.js
// WHAT:   Offline-first sync logic.
//         When the phone has no internet, transactions are
//         saved locally (SQLite). When internet returns,
//         this service pushes them all to Firebase.
// ============================================================

import NetInfo from '@react-native-community/netinfo';
import { recordTransaction } from './transactionService';
import { getOfflineQueue, clearOfflineQueue } from '../database/sqlite';

// ── WATCH NETWORK STATUS ──────────────────────────────────────
// Call this once in App.js. It runs in the background forever.
// When internet comes back, it automatically syncs.
export function startNetworkWatcher(dispatch, ACTIONS) {
  const unsubscribe = NetInfo.addEventListener(async (state) => {
    const isOnline = state.isConnected && state.isInternetReachable;

    // Update global state with network status
    dispatch({ type: ACTIONS.SET_ONLINE, payload: isOnline });

    // If just came back online, sync the queue
    if (isOnline) {
      await syncOfflineQueue();
    }
  });

  // Return the unsubscribe function so App.js can clean up
  return unsubscribe;
}

// ── SYNC OFFLINE QUEUE ────────────────────────────────────────
// Reads all pending transactions from SQLite
// and sends them to Firebase one by one.
export async function syncOfflineQueue() {
  try {
    const queue = await getOfflineQueue();

    if (!queue || queue.length === 0) return; // Nothing to sync

    console.log(`[Sync] Found ${queue.length} offline transactions to sync.`);

    const results = await Promise.allSettled(
      queue.map(item => recordTransaction(item))
    );

    const failed = results.filter(r => r.status === 'rejected');

    if (failed.length === 0) {
      // All succeeded — clear the local queue
      await clearOfflineQueue();
      console.log('[Sync] All transactions synced successfully.');
    } else {
      console.warn(`[Sync] ${failed.length} transactions failed to sync.`);
    }
  } catch (error) {
    console.error('[Sync] Error during sync:', error.message);
  }
}