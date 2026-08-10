// ============================================================
// FILE 23: App.js  ← This is the ROOT of the entire app
// WHAT:   The first file React Native reads.
//         It wraps everything in the global state provider
//         and starts the navigation system.
//         Also initialises the local SQLite database.
// ============================================================

import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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
import { onAuthChange, getUserProfile } from './src/services/authService';
import AppNavigator             from './src/navigation/AppNavigator';

// ── Inner component that has access to global state ───────────
function AppInner() {
  const { state, dispatch } = useApp();
  const { colors, isDark } = useTheme();

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
    const unsubscribeNetwork = startNetworkWatcher(dispatch, ACTIONS);

    // 3. Rehydrate the session on launch, and react to sign in/out
    //    from anywhere (including the secondary-app trick used to
    //    create new team members).
    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          if (profile) {
            dispatch({ type: ACTIONS.LOGIN, payload: profile });
            await loadAppData(dispatch);
          } else {
            dispatch({ type: ACTIONS.LOGOUT });
          }
        } catch (err) {
          console.error('[Auth] Failed to load user profile:', err.message);
          dispatch({ type: ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: ACTIONS.LOGOUT });
      }
      dispatch({ type: ACTIONS.SET_AUTH_LOADING, payload: false });
    });

    // Cleanup when app closes
    return () => {
      unsubscribeNetwork && unsubscribeNetwork();
      unsubscribeAuth && unsubscribeAuth();
    };
  }, []);

  if (state.authLoading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.offWhite }}>
        <ActivityIndicator size="large" color={colors.green500} />
      </View>
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
export default function App() {
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
