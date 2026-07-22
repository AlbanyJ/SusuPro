// ============================================================
// FILE 16: src/screens/LoginScreen.js
// WHAT:   The first screen users see. Email + password form.
//         On success → navigates to the main app tabs.
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { useApp, ACTIONS } from '../store/AppContext';
import { loginUser } from '../services/authService';
import Input from '../components/Input';
import Button from '../components/Button';
import { Colors, Typography, Radius, Shadows, Spacing } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const { dispatch } = useApp();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password);
    setLoading(false);

    if (result.success) {
      dispatch({ type: ACTIONS.LOGIN, payload: result.user });
      navigation.replace('MainTabs'); // Go to the main app
    } else {
      setError(result.error);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.bg}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.wrap}>

          {/* ── Logo ── */}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoEmoji}>🌿</Text>
            </View>
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
                  <Text style={styles.errorText}>⚠ {error}</Text>
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

            {/* Demo account hints */}
            <View style={styles.demoBox}>
              <Text style={styles.demoLabel}>DEMO ACCOUNTS</Text>
              <TouchableOpacity onPress={() => { setEmail('admin@susu.gh'); setPassword('admin123'); }}>
                <Text style={styles.demoItem}>👤 Admin: admin@susu.gh / admin123</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setEmail('ama@susu.gh'); setPassword('collector1'); }}>
                <Text style={styles.demoItem}>👤 Collector: ama@susu.gh / collector1</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.foot}>🔒 All data encrypted and secured</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg:          { flex: 1, backgroundColor: Colors.green700 },
  scroll:      { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  wrap:        { width: '100%', maxWidth: 400, alignSelf: 'center' },

  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', marginBottom: 8 },
  logoIcon:    { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.green400, alignItems: 'center', justifyContent: 'center', ...Shadows.md },
  logoEmoji:   { fontSize: 26 },
  brandName:   { fontFamily: Typography.display, fontSize: 28, color: Colors.white },
  brandSub:    { fontFamily: Typography.body, fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: 1.2 },
  tagline:     { fontFamily: Typography.body, fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 32 },

  card:        { backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 28, ...Shadows.lg },
  heading:     { fontFamily: Typography.display, fontSize: 22, color: Colors.gray900, marginBottom: 4 },
  subHeading:  { fontFamily: Typography.body, fontSize: 14, color: Colors.gray400, marginBottom: 24 },
  form:        { gap: 14 },
  loginBtn:    { marginTop: 8 },

  errorBox:    { backgroundColor: Colors.redLight, borderRadius: Radius.sm, padding: 12 },
  errorText:   { fontFamily: Typography.medium, fontSize: 13, color: Colors.red },

  demoBox:     { marginTop: 20, backgroundColor: Colors.green50, borderRadius: Radius.sm, padding: 14, borderWidth: 1, borderColor: Colors.green100 },
  demoLabel:   { fontFamily: Typography.bold, fontSize: 10, color: Colors.green600, letterSpacing: 1, marginBottom: 8 },
  demoItem:    { fontFamily: Typography.body, fontSize: 12, color: Colors.gray500, lineHeight: 22 },

  foot:        { textAlign: 'center', marginTop: 24, fontFamily: Typography.body, fontSize: 12, color: 'rgba(255,255,255,0.3)' },
});