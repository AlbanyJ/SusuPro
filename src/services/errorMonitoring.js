// ============================================================
// src/services/errorMonitoring.js
// WHAT:   Crash/error reporting via Sentry — this is the ONLY way
//         you find out when the app breaks for a real collector in
//         the field. Without it, a crash just looks like "the app
//         stopped working" to them, and you never hear about it.
//
// SETUP STEPS:
//   1. Create a free account at https://sentry.io
//   2. Create a new project → platform: React Native
//   3. Copy the DSN it gives you (looks like https://xxx@xxx.ingest.sentry.io/xxx)
//   4. In .env, set: EXPO_PUBLIC_SENTRY_DSN=your-dsn-here
//
// If the DSN isn't set, this quietly does nothing — the app still
// works, you just won't get crash reports until it's configured.
// ============================================================

import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initErrorMonitoring() {
  if (!DSN) {
    console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN not set — crash reporting is disabled.');
    return;
  }

  Sentry.init({
    dsn: DSN,
    // Expo Go can't symbolicate native crashes anyway (no custom
    // native code runs there) — this still captures JS errors and
    // unhandled promise rejections, which covers most real bugs.
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
  });
}

// Tags crash reports with WHO hit them (never anything sensitive —
// just id/name/role) so a report is actually actionable instead of
// "someone, somewhere, had a crash."
export function setErrorMonitoringUser(user) {
  if (!DSN) return;
  Sentry.setUser(user ? { id: user.id, username: user.name, role: user.role } : null);
}

export function reportError(error, context) {
  if (!DSN) {
    console.error('[Error]', error, context);
    return;
  }
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export const wrapApp = (RootComponent) => (DSN ? Sentry.wrap(RootComponent) : RootComponent);
