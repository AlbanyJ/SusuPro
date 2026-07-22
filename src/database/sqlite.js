// ============================================================
// FILE 8: src/database/sqlite.js
// WHAT:   Local database stored ON the phone.
//         Works with zero internet connection.
//         When offline: transactions go here.
//         When online: syncService.js sends them to Firebase.
//
// INSTALL: npx expo install expo-sqlite
// ============================================================

import * as SQLite from 'expo-sqlite';

// Open (or create) the local database file on the phone
const db = SQLite.openDatabase('susupro.db');

// ── SETUP ─────────────────────────────────────────────────────
// Creates the tables if they don't exist yet.
// Call this once when the app starts (in App.js).
export function initDatabase() {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {

      // Table: offline_queue
      // Stores transactions that couldn't reach Firebase yet
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS offline_queue (
          id          INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId  TEXT    NOT NULL,
          type        TEXT    NOT NULL,   -- 'contribution' or 'withdrawal'
          amount      REAL    NOT NULL,
          collectorId TEXT    NOT NULL,
          notes       TEXT,
          createdAt   TEXT    NOT NULL
        );
      `);

      // Table: audit_log
      // Every action ever taken — who, what, when
      tx.executeSql(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          action    TEXT NOT NULL,
          userId    TEXT NOT NULL,
          targetId  TEXT,
          detail    TEXT,
          createdAt TEXT NOT NULL
        );
      `);

    },
    (error) => reject(error),
    () => resolve()
    );
  });
}

// ── ADD TO OFFLINE QUEUE ──────────────────────────────────────
// Save a transaction locally when there's no internet.
export function addToOfflineQueue(transaction) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO offline_queue
           (customerId, type, amount, collectorId, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?);`,
        [
          transaction.customerId,
          transaction.type,
          transaction.amount,
          transaction.collectorId,
          transaction.notes || '',
          new Date().toISOString(),
        ],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
}

// ── GET OFFLINE QUEUE ─────────────────────────────────────────
// Read all pending transactions from local storage.
export function getOfflineQueue() {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM offline_queue ORDER BY createdAt ASC;',
        [],
        (_, { rows }) => resolve(rows._array),
        (_, error) => reject(error)
      );
    });
  });
}

// ── CLEAR OFFLINE QUEUE ───────────────────────────────────────
// After successful sync, remove everything from local queue.
export function clearOfflineQueue() {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM offline_queue;',
        [],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
}

// ── LOG AN AUDIT ACTION ───────────────────────────────────────
// Records who did what and when. Never deleted.
export function logAuditAction({ action, userId, targetId, detail }) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO audit_log (action, userId, targetId, detail, createdAt)
         VALUES (?, ?, ?, ?, ?);`,
        [action, userId, targetId || '', detail || '', new Date().toISOString()],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
}