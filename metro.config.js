// ============================================================
// metro.config.js
// WHAT:   Metro bundler config.
//
// Firebase JS SDK's package.json "exports" map isn't fully
// compatible with Metro's package-exports resolution — when it's
// enabled, Metro grabs the wrong build of firebase/auth and Auth
// silently falls back to memory-only persistence (see Expo's
// "Using Firebase" guide: https://docs.expo.dev/guides/using-firebase/).
// Disabling it here makes Metro fall back to Firebase's legacy
// "react-native" package.json field, which resolves correctly and
// lets AsyncStorage-backed session persistence actually work.
// ============================================================

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
