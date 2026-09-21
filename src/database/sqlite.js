// ============================================================
// FILE 8: src/database/sqlite.js
// WHAT:   Local database stored ON the phone.
//         Works with zero internet connection.
//         When offline: transactions go here.
//         When online: syncService.js sends them to Firebase.
//
// Uses the modern async expo-sqlite API (openDatabaseAsync /
// runAsync / getAllAsync) — the old callback-based
// SQLite.openDatabase()/db.transaction() API was removed.
// ============================================================

import * as SQLite from 'expo-sqlite';

let dbPromise = null;

// Lazily open (or create) the local database file on the phone.
// Cached so every caller shares the same connection.
function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('susupro.db');
  }
  return dbPromise;
}

// ── SETUP ─────────────────────────────────────────────────────
// Creates the tables if they don't exist yet.
// Call this once when the app starts (in App.js).
export async function initDatabase() {
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS offline_queue (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      localId       TEXT    NOT NULL,
      customerId    TEXT    NOT NULL,
      type          TEXT    NOT NULL,
      amount        REAL    NOT NULL,
      collectorId   TEXT    NOT NULL,
      collectorName TEXT,
      notes         TEXT,
      createdAt     TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      action    TEXT NOT NULL,
      userId    TEXT NOT NULL,
      targetId  TEXT,
      detail    TEXT,
      createdAt TEXT NOT NULL
    );
  `);
}

// ── ADD TO OFFLINE QUEUE ──────────────────────────────────────
// Save a transaction locally when there's no internet.
// `localId` lets the UI reconcile this row with the optimistic
// transaction already shown on screen once it syncs.
export async function addToOfflineQueue(transaction) {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO offline_queue
       (localId, customerId, type, amount, collectorId, collectorName, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      transaction.id,
      transaction.customerId,
      transaction.type,
      transaction.amount,
      transaction.collectorId,
      transaction.collectorName || '',
      transaction.notes || '',
      new Date().toISOString(),
    ]
  );
  return result;
}

// ── GET OFFLINE QUEUE ─────────────────────────────────────────
// Read all pending transactions from local storage.
export async function getOfflineQueue() {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM offline_queue ORDER BY createdAt ASC;');
}

// ── REMOVE ONE ITEM FROM THE QUEUE ────────────────────────────
// Called after a single queued transaction syncs successfully.
export async function removeFromOfflineQueue(id) {
  const db = await getDb();
  await db.runAsync('DELETE FROM offline_queue WHERE id = ?;', [id]);
}

// ── CLEAR OFFLINE QUEUE ───────────────────────────────────────
// After successful sync, remove everything from local queue.
export async function clearOfflineQueue() {
  const db = await getDb();
  await db.runAsync('DELETE FROM offline_queue;');
}

// ── LOG AN AUDIT ACTION ───────────────────────────────────────
// Records who did what and when. Never deleted.
export async function logAuditAction({ action, userId, targetId, detail }) {
  const db = await getDb();
  return db.runAsync(
    `INSERT INTO audit_log (action, userId, targetId, detail, createdAt)
     VALUES (?, ?, ?, ?, ?);`,
    [action, userId, targetId || '', detail || '', new Date().toISOString()]
  );
}
