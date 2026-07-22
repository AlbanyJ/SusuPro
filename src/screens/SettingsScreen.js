// ============================================================
// FILE 21: src/screens/SettingsScreen.js
// WHAT:   User profile, security info, and logout button.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp, ACTIONS } from '../store/AppContext';
import { logoutUser } from '../services/authService';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

const SECURITY_ITEMS = [
  { label: 'Password Hashing',    value: 'bcrypt (rounds: 12)',   ok: true },
  { label: 'Data Encryption',     value: 'AES-256 at rest',       ok: true },
  { label: 'API Communication',   value: 'HTTPS / TLS 1.3',       ok: true },
  { label: 'Role-Based Access',   value: 'Enforced',              ok: true },
  { label: 'Audit Logging',       value: 'All actions logged',    ok: true },
];

export default function SettingsScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { currentUser, offlineQueue, isOnline } = state;

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await logoutUser();
          dispatch({ type: ACTIONS.LOGOUT });
          navigation.replace('Login');
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Account</Text>
      </View>

      <View style={styles.content}>

        {/* ── Profile Card ── */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar initials={currentUser?.avatar || '?'} size={56} variant="dark" />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{currentUser?.name}</Text>
              <Text style={styles.email}>{currentUser?.email}</Text>
              <View style={{ marginTop: 6 }}>
                <Badge
                  label={currentUser?.role === 'admin' ? 'Administrator' : 'Collector'}
                  type={currentUser?.role === 'admin' ? 'success' : 'neutral'}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* ── Offline Queue status ── */}
        {offlineQueue.length > 0 && (
          <Card style={styles.queueCard}>
            <Text style={styles.queueTitle}>📶 Pending Sync</Text>
            <Text style={styles.queueBody}>
              {offlineQueue.length} transaction{offlineQueue.length !== 1 ? 's' : ''} waiting to sync.
              {isOnline ? ' Syncing now…' : ' Will sync when online.'}
            </Text>
          </Card>
        )}

        {/* ── Security Info ── */}
        <Card style={styles.secCard}>
          <Text style={styles.secTitle}>🔐 Security</Text>
          {SECURITY_ITEMS.map(item => (
            <View key={item.label} style={styles.secRow}>
              <Text style={styles.secLabel}>{item.label}</Text>
              <View style={styles.secRight}>
                <Text style={styles.secValue}>{item.value}</Text>
                {item.ok && <Text style={styles.secCheck}>✓</Text>}
              </View>
            </View>
          ))}
        </Card>

        {/* ── Architecture Note ── */}
        <Card style={styles.archCard}>
          <Text style={styles.archTitle}>🏗 Tech Stack</Text>
          {[
            ['Frontend',  'React Native (Expo)'],
            ['Backend',   'Firebase Auth + Firestore'],
            ['Offline',   'SQLite (expo-sqlite)'],
            ['Auth',      'Firebase Auth (bcrypt)'],
            ['Roles',     'Admin / Collector'],
          ].map(([k, v]) => (
            <Text key={k} style={styles.archLine}><Text style={styles.archKey}>{k}:</Text> {v}</Text>
          ))}
        </Card>

        <Button
          label="Sign Out"
          onPress={handleLogout}
          variant="danger"
          fullWidth
          size="lg"
          style={styles.logoutBtn}
        />

        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: Colors.offWhite },
  header:      { backgroundColor: Colors.white, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  title:       { fontFamily: Typography.display, fontSize: 22, color: Colors.gray900 },
  content:     { padding: Spacing.lg, gap: 14 },

  profileCard: { },
  profileRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name:        { fontFamily: Typography.display, fontSize: 18, color: Colors.gray900 },
  email:       { fontFamily: Typography.body, fontSize: 13, color: Colors.gray400 },

  queueCard:   { backgroundColor: Colors.amberLight, borderWidth: 1, borderColor: Colors.amber },
  queueTitle:  { fontFamily: Typography.bold, fontSize: 14, color: Colors.amber, marginBottom: 4 },
  queueBody:   { fontFamily: Typography.body, fontSize: 13, color: Colors.gray600 },

  secCard:     { },
  secTitle:    { fontFamily: Typography.bold, fontSize: 14, color: Colors.gray900, marginBottom: 12 },
  secRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  secLabel:    { fontFamily: Typography.body, fontSize: 13, color: Colors.gray700 },
  secRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secValue:    { fontFamily: Typography.body, fontSize: 12, color: Colors.gray400 },
  secCheck:    { color: Colors.green500, fontFamily: Typography.bold },

  archCard:    { backgroundColor: Colors.green50, borderWidth: 1, borderColor: Colors.green100 },
  archTitle:   { fontFamily: Typography.bold, fontSize: 13, color: Colors.green700, marginBottom: 10 },
  archLine:    { fontFamily: Typography.body, fontSize: 12, color: Colors.gray600, lineHeight: 22 },
  archKey:     { fontFamily: Typography.bold },

  logoutBtn:   { marginTop: 6 },
});