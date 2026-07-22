// ============================================================
// FILE 23: App.js  ← This is the ROOT of the entire app
// WHAT:   The first file React Native reads.
//         It wraps everything in the global state provider
//         and starts the navigation system.
//         Also initialises the local SQLite database.
// ============================================================

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp, ACTIONS } from './src/store/AppContext';
import { initDatabase }        from './src/database/sqlite';
import { startNetworkWatcher } from './src/services/syncService';
import AppNavigator            from './src/navigation/AppNavigator';

// ── Inner component that has access to global state ───────────
function AppInner() {
  const { dispatch } = useApp();

  useEffect(() => {
    // 1. Create SQLite tables on first launch
    initDatabase().catch(console.error);

    // 2. Start watching network — auto-syncs when online
    const unsubscribe = startNetworkWatcher(dispatch, ACTIONS);

    // Cleanup when app closes
    return () => unsubscribe && unsubscribe();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

// ── Root export — this is what Expo loads ─────────────────────
export default function App() {
  return (
    // AppProvider wraps everything so ALL screens share the same data
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}