// ============================================================
// FILE 7: src/services/syncService.js
// WHAT:   Offline-first sync logic.
//         When the phone has no internet, transactions are
//         saved locally (SQLite). When internet returns,
//         this service pushes them all to Firebase.
// ============================================================

import NetInfo from '@react-native-community/netinfo';
import { recordTransaction } from './transactionService';
import { getOfflineQueue, removeFromOfflineQueue } from '../database/sqlite';
import { loadAppData } from '../store/AppContext';

// ── WATCH NETWORK STATUS ──────────────────────────────────────
// Call this once in App.js. It runs in the background forever.
// When internet comes back, it automatically syncs.
export function startNetworkWatcher(dispatch, ACTIONS) {
  const unsubscribe = NetInfo.addEventListener(async (state) => {
    const isOnline = !!(state.isConnected && state.isInternetReachable);

    // Update global state with network status
    dispatch({ type: ACTIONS.SET_ONLINE, payload: isOnline });

    // If just came back online, sync the queue
    if (isOnline) {
      await syncOfflineQueue(dispatch, ACTIONS);
    }
  });

  // Return the unsubscribe function so App.js can clean up
  return unsubscribe;
}

// ── SYNC OFFLINE QUEUE ────────────────────────────────────────
// Reads all pending transactions from SQLite and sends them to
// Firestore one by one. Each row is removed from the local queue
// (and the "pending sync" UI badge) as soon as it lands — a row
// that fails (e.g. balance now insufficient) stays queued for the
// next sync attempt instead of being silently dropped.
export async function syncOfflineQueue(dispatch, ACTIONS) {
  try {
    const queue = await getOfflineQueue();
    if (!queue || queue.length === 0) return;

    console.log(`[Sync] Found ${queue.length} offline transactions to sync.`);

    let syncedCount = 0;

    for (const item of queue) {
      const result = await recordTransaction({
        customerId: item.customerId,
        type: item.type,
        amount: item.amount,
        collectorId: item.collectorId,
        collectorName: item.collectorName,
        notes: item.notes,
      });

      if (result.success) {
        await removeFromOfflineQueue(item.id);
        if (dispatch && ACTIONS) {
          dispatch({ type: ACTIONS.REMOVE_FROM_QUEUE, payload: item.localId });
        }
        syncedCount++;
      } else {
        console.warn(`[Sync] Transaction ${item.localId} failed to sync: ${result.error}`);
      }
    }

    console.log(`[Sync] ${syncedCount}/${queue.length} transactions synced.`);

    // Refresh customers/transactions from Firestore so balances and
    // records reflect what actually landed on the server.
    if (syncedCount > 0 && dispatch) {
      await loadAppData(dispatch);
    }
  } catch (error) {
    console.error('[Sync] Error during sync:', error.message);
  }
}