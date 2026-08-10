// ============================================================
// FILE 16: src/screens/LoginScreen.js
// WHAT:   The first screen users see. Email + password form.
//         On success → navigates to the main app tabs.
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { loginUser } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import { Typography, Radius, Spacing } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { colors, gradients, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);

  async function handleLogin() {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    // On success, App.js's auth-state listener picks up the new
    // session, loads the user's profile + data, and AppNavigator
    // swaps to the main tabs automatically — no manual navigation
    // needed here.
    const result = await loginUser(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  }

  return (
    <LinearGradient colors={gradients.hero} style={styles.bg}>
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.wrap}>

          {/* ── Logo ── */}
          <View style={styles.logoRow}>
            <LinearGradient colors={gradients.primary} style={styles.logoIcon}>
              <Ionicons name="wallet-outline" size={26} color={colors.white} />
            </LinearGradient>
            <View>
              <Text style={styles.brandName}>SusuPro</Text>
              <Text style={styles.brandSub}>Daily Savings Platform</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Secure · Reliable · Trusted</Text>

          {/* ── Login Card ── */}
          <View style={styles.card}>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subHeading}>Sign in to your account to continue</Text>

            <View style={styles.form}>
              <Input
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                keyboardType="email-address"
                required
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                required
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.red} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button
                label={loading ? 'Signing in…' : 'Sign In'}
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                fullWidth
                size="lg"
                style={styles.loginBtn}
              />
            </View>

            {/* No self-signup: accounts are provisioned by an admin */}
            <View style={styles.demoBox}>
              <Text style={styles.demoItem}>Don't have an account? Ask your administrator to add you as a team member.</Text>
            </View>
          </View>

          <View style={styles.footRow}>
            <Ionicons name="lock-closed-outline" size={12} color="rgba(255,255,255,0.35)" />
            <Text style={styles.foot}>Secured by Firebase Authentication</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
    </LinearGradient>
  );
}

function makeStyles(colors, shadows) {
  return StyleSheet.create({
    bg:          { flex: 1 },
    flex:        { flex: 1 },
    scroll:      { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
    wrap:        { width: '100%', maxWidth: 400, alignSelf: 'center' },

    logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 8 },
    logoIcon:    { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...shadows.md },
    brandName:   { fontFamily: Typography.display, fontSize: 28, color: colors.white },
    brandSub:    { fontFamily: Typography.body, fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2 },
    tagline:     { fontFamily: Typography.body, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 32 },

    card:        { backgroundColor: colors.surface, borderRadius: Radius.lg, padding: 28, ...shadows.lg },
    heading:     { fontFamily: Typography.display, fontSize: 22, color: colors.gray900, marginBottom: 4 },
    subHeading:  { fontFamily: Typography.body, fontSize: 14, color: colors.gray400, marginBottom: 24 },
    form:        { gap: 14 },
    loginBtn:    { marginTop: 8 },

    errorBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.redLight, borderRadius: Radius.sm, padding: 12 },
    errorText:   { flex: 1, fontFamily: Typography.medium, fontSize: 13, color: colors.red },

    demoBox:     { marginTop: 20, backgroundColor: colors.gray50, borderRadius: Radius.sm, padding: 14, borderWidth: 1, borderColor: colors.gray100 },
    demoLabel:   { fontFamily: Typography.bold, fontSize: 10, color: colors.gray700, letterSpacing: 1, marginBottom: 8 },
    demoItem:    { fontFamily: Typography.body, fontSize: 12, color: colors.gray500, lineHeight: 22 },

    footRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
    foot:        { fontFamily: Typography.body, fontSize: 12, color: 'rgba(255,255,255,0.3)' },
  });
}
