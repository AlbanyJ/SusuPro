// ============================================================
// FILE 23: App.js  ← This is the ROOT of the entire app
// WHAT:   The first file React Native reads.
//         It wraps everything in the global state provider
//         and starts the navigation system.
//         Also initialises the local SQLite database.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';
import { AppProvider, useApp, ACTIONS, loadAppData } from './src/store/AppContext';
import { ThemeProvider, useTheme } from './src/store/ThemeContext';
import { initDatabase }        from './src/database/sqlite';
import { startNetworkWatcher } from './src/services/syncService';
import { onAuthChange, getUserProfile, logoutUser } from './src/services/authService';
import { getBiometricLockEnabled } from './src/services/biometricService';
import { initErrorMonitoring, setErrorMonitoringUser, wrapApp } from './src/services/errorMonitoring';
import AppNavigator             from './src/navigation/AppNavigator';
import LockScreen               from './src/screens/LockScreen';

// Runs once at module load — before any component mounts — so crash
// reporting is live from the very first render, not just after some
// effect gets around to enabling it. All Sentry config lives in
// errorMonitoring.js (DSN comes from EXPO_PUBLIC_SENTRY_DSN in .env,
// not hardcoded) — this is the only place Sentry.init runs.
initErrorMonitoring();

// ── Inner component that has access to global state ───────────
function AppInner() {
  const { state, dispatch } = useApp();
  const { colors, isDark } = useTheme();

  // The network watcher below is set up once (empty deps) but needs
  // the CURRENT user whenever it fires, potentially long after login
  // — a plain closure over state.currentUser would go stale the
  // moment someone logs in or out. A ref sidesteps that.
  const currentUserRef = useRef(state.currentUser);
  useEffect(() => { currentUserRef.current = state.currentUser; }, [state.currentUser]);

  // Biometric app-lock (opt-in, see Settings). Re-checked from
  // AsyncStorage (not cached) at each lock-trigger point so a toggle
  // change in Settings takes effect on the very next lock, not just
  // after a full app restart.
  const [locked, setLocked] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  // On iOS, presenting the Face ID sheet itself briefly flips AppState
  // active→inactive→active (it's a system UI overlay) — indistinguishable
  // from a real background/foreground cycle. Without this guard, the
  // "came back from background" listener below reads that as the user
  // reopening the app and re-locks it the instant Face ID succeeds,
  // which re-shows the prompt — an infinite loop. LockScreen flips this
  // while a biometric check is in flight so the listener ignores it.
  const isAuthenticatingRef = useRef(false);

  const [fontsLoaded] = useFonts({
    'DMSans-Regular':       DMSans_400Regular,
    'DMSans-Medium':        DMSans_500Medium,
    'DMSans-SemiBold':      DMSans_600SemiBold,
    'DMSans-Bold':          DMSans_700Bold,
    'DMSans-ExtraBold':     DMSans_800ExtraBold,
  });

  useEffect(() => {
    // 1. Create SQLite tables on first launch
    initDatabase().catch(console.error);

    // 2. Start watching network — auto-syncs when online
    const unsubscribeNetwork = startNetworkWatcher(dispatch, ACTIONS, currentUserRef);

    // 3. Rehydrate the session on launch, and react to sign in/out
    //    from anywhere (including the secondary-app trick used to
    //    create new team members).
    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            dispatch({ type: ACTIONS.LOGIN, payload: profile });
            setErrorMonitoringUser(profile);
            await loadAppData(dispatch, profile);
            if (await getBiometricLockEnabled()) setLocked(true);
          } else {
            dispatch({ type: ACTIONS.LOGOUT });
          }
        } catch (err) {
          console.error('[Auth] Failed to load user profile:', err.message);
          dispatch({ type: ACTIONS.LOGOUT });
        }
      } else {
        setErrorMonitoringUser(null);
        dispatch({ type: ACTIONS.LOGOUT });
      }
      dispatch({ type: ACTIONS.SET_AUTH_LOADING, payload: false });
    });

    // 4. Re-lock whenever the app comes back from the background —
    //    same moment a banking app would ask you to prove it's you
    //    again. Login itself (step 3) already covers first launch.
    //    IMPORTANT: only 'background' counts as "the user actually
    //    left the app." 'inactive' is a transient iOS-only state that
    //    fires for all sorts of unrelated things — the Face ID sheet
    //    itself, Control Center, a notification banner — and does NOT
    //    mean the app was backgrounded. Treating it as a trigger here
    //    was the actual cause of the Face ID re-lock loop: the sheet
    //    flips active→inactive→active on its own, which kept
    //    re-locking (and re-prompting) the instant a scan succeeded.
    const appStateSub = AppState.addEventListener('change', async (nextState) => {
      const prevState = appStateRef.current;
      appStateRef.current = nextState;
      const cameFromBackground = prevState === 'background' && nextState === 'active';
      if (cameFromBackground && !isAuthenticatingRef.current && currentUserRef.current && (await getBiometricLockEnabled())) {
        setLocked(true);
      }
    });

    // Cleanup when app closes
    return () => {
      unsubscribeNetwork && unsubscribeNetwork();
      unsubscribeAuth && unsubscribeAuth();
      appStateSub.remove();
    };
  }, []);

  if (state.authLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.offWhite }}>
        <ActivityIndicator size="large" color={colors.green500} />
      </View>
    );
  }

  if (locked && state.currentUser) {
    return (
      <LockScreen
        isAuthenticatingRef={isAuthenticatingRef}
        onUnlock={() => setLocked(false)}
        onSignOut={async () => {
          setLocked(false);
          await logoutUser();
          dispatch({ type: ACTIONS.LOGOUT });
        }}
      />
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

// ── Root export — this is what Expo loads ─────────────────────
function App() {
  return (
    // SafeAreaProvider lets every screen (and the tab bar) know how
    // much space the notch/status bar/home indicator take up.
    <SafeAreaProvider>
      <ThemeProvider>
        {/* AppProvider wraps everything so ALL screens share the same data */}
        <AppProvider>
          <AppInner />
        </AppProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// wrapApp adds a top-level Sentry error boundary (so a render crash
// reports instead of just showing a blank white screen) and basic
// navigation/performance tracing. No-ops if no DSN is configured.
export default wrapApp(App);
