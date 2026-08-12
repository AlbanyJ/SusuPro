// ============================================================
// src/screens/LockScreen.js
// WHAT:   Shown whenever the app is opened/foregrounded and the
//         user has biometric app-lock turned on (Settings). Sits
//         in front of the already-logged-in app — Firebase's own
//         session is untouched underneath; this just gates the
//         screen until Face ID / fingerprint / device passcode
//         succeeds.
// ============================================================

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authenticate } from '../services/biometricService';
import Button from '../components/Button';
import { Typography, Spacing, Radius } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

export default function LockScreen({ onUnlock, onSignOut }) {
  const { colors, gradients, shadows } = useTheme();
  const styles = makeStyles(colors, shadows);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  async function tryUnlock() {
    setChecking(true);
    setFailed(false);
    const ok = await authenticate();
    setChecking(false);
    if (ok) {
      onUnlock();
    } else {
      setFailed(true);
    }
  }

  // Prompt automatically as soon as the lock screen appears, so the
  // collector doesn't have to tap twice (once to see the screen,
  // once to trigger Face ID).
  useEffect(() => { tryUnlock(); }, []);

  return (
    <LinearGradient colors={gradients.hero} style={styles.bg}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={styles.wrap}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-closed" size={32} color={colors.white} />
          </View>
          <Text style={styles.title}>SusuPro is locked</Text>
          <Text style={styles.sub}>
            {failed ? "That didn't work — try again." : 'Verify it\'s you to continue.'}
          </Text>

          <Button
            label={checking ? 'Verifying…' : 'Unlock'}
            onPress={tryUnlock}
            loading={checking}
            disabled={checking}
            fullWidth
            size="lg"
            style={styles.unlockBtn}
          />

          <Text
            style={styles.signOut}
            onPress={onSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out instead"
          >
            Sign out instead
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function makeStyles(colors, shadows) {
  return StyleSheet.create({
    bg:   { flex: 1 },
    flex: { flex: 1 },
    wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

    iconCircle: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 20, ...shadows.md,
    },
    title: { fontFamily: Typography.display, fontSize: 22, color: colors.white, marginBottom: 6 },
    sub:   { fontFamily: Typography.body, fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32, textAlign: 'center' },

    unlockBtn: { width: '100%', maxWidth: 320 },
    signOut:   { fontFamily: Typography.semiBold, fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 24, textDecorationLine: 'underline' },
  });
}
