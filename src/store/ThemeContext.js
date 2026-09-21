// ============================================================
// src/store/ThemeContext.js
// WHAT:   Light/dark mode switch. Wrap the app in <ThemeProvider>
//         (done in App.js), then in any component:
//           const { colors, gradients, shadows, mode, toggleMode } = useTheme();
//         The chosen mode is remembered across app restarts.
// ============================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palettes, GradientPalettes, ShadowPalettes } from '../constants/theme';

const STORAGE_KEY = 'susupro:themeMode';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(saved => {
        if (saved === 'light' || saved === 'dark') setMode(saved);
      })
      .finally(() => setReady(true));
  }, []);

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    colors: Palettes[mode],
    gradients: GradientPalettes[mode],
    shadows: ShadowPalettes[mode],
    toggleMode,
  }), [mode, toggleMode]);

  // Wait for the saved preference to load before rendering anything
  // themed, so the app doesn't flash the default mode first.
  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
