// ============================================================
// FILE 21: src/screens/SettingsScreen.js
// WHAT:   User profile, security info, and logout button.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Platform, KeyboardAvoidingView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ACTIONS } from '../store/AppContext';
import { logoutUser } from '../services/authService';
import { fetchUsers, createTeamMember } from '../services/userService';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { Typography, Spacing, Radius } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

// Only claims we actually enforce in this codebase — see
// firebase.js (Auth), firestore.rules (access control) and
// transactionService.js (atomic runTransaction).
const SECURITY_ITEMS = [
  { label: 'Authentication',        value: 'Firebase Auth (email/password)' },
  { label: 'Data in Transit',       value: 'HTTPS / TLS' },
  { label: 'Access Control',        value: 'Enforced by Firestore rules' },
  { label: 'Transaction Integrity', value: 'Atomic balance updates' },
];

export default function SettingsScreen() {
  const { state, dispatch } = useApp();
  const { currentUser, offlineQueue, isOnline } = state;
  const { colors, mode, toggleMode } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isAdmin = currentUser?.role === 'admin';

  const [team,        setTeam]        = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [showAdd,     setShowAdd]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'collector' });

  const loadTeam = useCallback(async () => {
    if (!isAdmin) return;
    setTeamLoading(true);
    const result = await fetchUsers();
    if (result.success) setTeam(result.data);
    setTeamLoading(false);
  }, [isAdmin]);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  async function handleAddTeamMember() {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      Alert.alert('Missing Info', 'Name, email and password are all required.');
      return;
    }
    if (form.password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    const result = await createTeamMember(form, currentUser.id);
    setSaving(false);

    if (result.success) {
      setForm({ name: '', email: '', password: '', role: 'collector' });
      setShowAdd(false);
      loadTeam();
    } else {
      Alert.alert('Error', result.error || 'Could not create team member.');
    }
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await logoutUser();
          dispatch({ type: ACTIONS.LOGOUT });
          // AppNavigator swaps to the Login screen automatically once
          // currentUser clears — no manual navigation needed (and this
          // screen lives inside the nested tab navigator, so it has no
          // direct route to the root-level "Login" screen anyway).
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
    <ScrollView showsVerticalScrollIndicator={false}>
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
                  type={currentUser?.role === 'admin' ? 'accent' : 'neutral'}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* ── Appearance ── */}
        <Card style={styles.secCard}>
          <View style={styles.appearanceRow}>
            <View style={styles.cardHeadRow}>
              <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={16} color={colors.gray900} />
              <View>
                <Text style={[styles.secTitle, { marginBottom: 2 }]}>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
                <Text style={styles.appearanceSub}>
                  {mode === 'dark' ? 'Deep, bold surfaces' : 'Warm cream background'}
                </Text>
              </View>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleMode}
              trackColor={{ false: colors.gray200, true: colors.green600 }}
              thumbColor={colors.white}
              accessibilityRole="switch"
              accessibilityLabel="Dark mode"
              accessibilityState={{ checked: mode === 'dark' }}
            />
          </View>
        </Card>

        {/* ── Offline Queue status ── */}
        {offlineQueue.length > 0 && (
          <Card style={styles.queueCard}>
            <View style={styles.cardHeadRow}>
              <Ionicons name="cloud-upload-outline" size={16} color={colors.amber} />
              <Text style={styles.queueTitle}>Pending Sync</Text>
            </View>
            <Text style={styles.queueBody}>
              {offlineQueue.length} transaction{offlineQueue.length !== 1 ? 's' : ''} waiting to sync.
              {isOnline ? ' Syncing now…' : ' Will sync when online.'}
            </Text>
          </Card>
        )}

        {/* ── Team Members (admin only) ── */}
        {isAdmin && (
          <Card style={styles.secCard}>
            <View style={styles.teamHead}>
              <View style={styles.cardHeadRow}>
                <Ionicons name="people-outline" size={16} color={colors.gray900} />
                <Text style={styles.secTitle}>Team Members</Text>
              </View>
              <Button label="+ Add" onPress={() => setShowAdd(true)} size="sm" />
            </View>
            {teamLoading && team.length === 0 ? (
              <Text style={styles.teamEmpty}>Loading…</Text>
            ) : team.length === 0 ? (
              <Text style={styles.teamEmpty}>No team members yet.</Text>
            ) : (
              team.map(u => (
                <View key={u.id} style={styles.teamRow}>
                  <Avatar initials={u.avatar || '?'} size={36} variant={u.role === 'admin' ? 'green' : 'gray'} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teamName}>{u.name}</Text>
                    <Text style={styles.teamEmail}>{u.email}</Text>
                  </View>
                  <Badge label={u.role === 'admin' ? 'Admin' : 'Collector'} type={u.role === 'admin' ? 'accent' : 'neutral'} />
                </View>
              ))
            )}
          </Card>
        )}

        {/* ── Security Info ── */}
        <Card style={styles.secCard}>
          <View style={styles.cardHeadRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.gray900} />
            <Text style={styles.secTitle}>Security</Text>
          </View>
          {SECURITY_ITEMS.map(item => (
            <View key={item.label} style={styles.secRow}>
              <Text style={styles.secLabel}>{item.label}</Text>
              <View style={styles.secRight}>
                <Text style={styles.secValue}>{item.value}</Text>
                <Ionicons name="checkmark" size={14} color={colors.gray700} />
              </View>
            </View>
          ))}
        </Card>

        {/* ── Architecture Note ── */}
        <Card style={styles.archCard}>
          <View style={styles.cardHeadRow}>
            <Ionicons name="construct-outline" size={16} color={colors.gray900} />
            <Text style={styles.archTitle}>Tech Stack</Text>
          </View>
          {[
            ['Frontend',  'React Native (Expo)'],
            ['Backend',   'Firebase Auth + Firestore'],
            ['Offline',   'SQLite (expo-sqlite)'],
            ['Auth',      'Firebase Authentication'],
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

      {/* ── Add Team Member Modal ── */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Add Team Member</Text>
              <TouchableOpacity
                onPress={() => setShowAdd(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={16} color={colors.gray500} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Input label="Full Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Ama Boateng" required />
              <Input label="Email Address" value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="name@example.com" keyboardType="email-address" required />
              <Input label="Temporary Password" value={form.password} onChangeText={v => setForm(f => ({ ...f, password: v }))} placeholder="At least 6 characters" secureTextEntry required />

              <Text style={styles.fieldLabel}>ROLE</Text>
              <View style={styles.roleRow}>
                {['collector', 'admin'].map(r => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setForm(f => ({ ...f, role: r }))}
                    style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: form.role === r }}
                    accessibilityLabel={r === 'admin' ? 'Administrator' : 'Collector'}
                  >
                    <Text style={[styles.roleBtnLabel, form.role === r && styles.roleBtnLabelActive]}>
                      {r === 'admin' ? 'Administrator' : 'Collector'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <Button label="Cancel" onPress={() => setShowAdd(false)} variant="ghost" style={{ flex: 1 }} />
                <Button label="Create Account" onPress={handleAddTeamMember} loading={saving} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  screen:      { flex: 1, backgroundColor: colors.offWhite },
  header:      { backgroundColor: colors.surface, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  title:       { fontFamily: Typography.display, fontSize: 22, color: colors.gray900 },
  content:     { padding: Spacing.lg, gap: 14 },

  profileCard: { },
  profileRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name:        { fontFamily: Typography.display, fontSize: 18, color: colors.gray900 },
  email:       { fontFamily: Typography.body, fontSize: 13, color: colors.gray400 },

  queueCard:   { backgroundColor: colors.amberLight, borderWidth: 1, borderColor: colors.amber },
  queueTitle:  { fontFamily: Typography.bold, fontSize: 14, color: colors.amber, marginBottom: 4 },
  queueBody:   { fontFamily: Typography.body, fontSize: 13, color: colors.gray600 },

  cardHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appearanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appearanceSub: { fontFamily: Typography.body, fontSize: 12, color: colors.gray400 },

  secCard:     { },
  secTitle:    { fontFamily: Typography.bold, fontSize: 14, color: colors.gray900, marginBottom: 12 },
  secRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  secLabel:    { fontFamily: Typography.body, fontSize: 13, color: colors.gray700 },
  secRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secValue:    { fontFamily: Typography.body, fontSize: 12, color: colors.gray400 },

  teamHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  teamEmpty:   { fontFamily: Typography.body, fontSize: 13, color: colors.gray400, paddingVertical: 8 },
  teamRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  teamName:    { fontFamily: Typography.bold, fontSize: 13, color: colors.gray900 },
  teamEmail:   { fontFamily: Typography.body, fontSize: 11, color: colors.gray400 },

  archCard:    { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.gray50 },
  archTitle:   { fontFamily: Typography.bold, fontSize: 13, color: colors.gray900, marginBottom: 10 },
  archLine:    { fontFamily: Typography.body, fontSize: 12, color: colors.gray600, lineHeight: 22 },
  archKey:     { fontFamily: Typography.bold },

  logoutBtn:   { marginTop: 6 },

  overlay:      { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, maxHeight: '90%' },
  modalHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  modalTitle:   { fontFamily: Typography.display, fontSize: 18, color: colors.gray900 },
  closeBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  modalBody:    { padding: 20, gap: 14 },
  fieldLabel:   { fontFamily: Typography.bold, fontSize: 11, color: colors.gray500, letterSpacing: 1 },

  roleRow:      { flexDirection: 'row', borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.gray200 },
  roleBtn:      { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface },
  roleBtnActive:{ backgroundColor: colors.green600 },
  roleBtnLabel: { fontFamily: Typography.bold, fontSize: 13, color: colors.gray500 },
  roleBtnLabelActive: { color: colors.white },

  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 20 },
});
}
