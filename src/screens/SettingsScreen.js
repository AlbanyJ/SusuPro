// ============================================================
// FILE 21: src/screens/SettingsScreen.js
// WHAT:   User profile, security info, and logout button.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Platform, KeyboardAvoidingView } from 'react-native';
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
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

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
    const result = await createTeamMember(form);
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
                  type={currentUser?.role === 'admin' ? 'success' : 'neutral'}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* ── Offline Queue status ── */}
        {offlineQueue.length > 0 && (
          <Card style={styles.queueCard}>
            <View style={styles.cardHeadRow}>
              <Ionicons name="cloud-upload-outline" size={16} color={Colors.amber} />
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
                <Ionicons name="people-outline" size={16} color={Colors.gray900} />
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
                  <Badge label={u.role === 'admin' ? 'Admin' : 'Collector'} type={u.role === 'admin' ? 'success' : 'neutral'} />
                </View>
              ))
            )}
          </Card>
        )}

        {/* ── Security Info ── */}
        <Card style={styles.secCard}>
          <View style={styles.cardHeadRow}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.gray900} />
            <Text style={styles.secTitle}>Security</Text>
          </View>
          {SECURITY_ITEMS.map(item => (
            <View key={item.label} style={styles.secRow}>
              <Text style={styles.secLabel}>{item.label}</Text>
              <View style={styles.secRight}>
                <Text style={styles.secValue}>{item.value}</Text>
                <Ionicons name="checkmark" size={14} color={Colors.green500} />
              </View>
            </View>
          ))}
        </Card>

        {/* ── Architecture Note ── */}
        <Card style={styles.archCard}>
          <View style={styles.cardHeadRow}>
            <Ionicons name="construct-outline" size={16} color={Colors.green700} />
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
              <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={16} color={Colors.gray500} />
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

  cardHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  secCard:     { },
  secTitle:    { fontFamily: Typography.bold, fontSize: 14, color: Colors.gray900, marginBottom: 12 },
  secRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  secLabel:    { fontFamily: Typography.body, fontSize: 13, color: Colors.gray700 },
  secRight:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secValue:    { fontFamily: Typography.body, fontSize: 12, color: Colors.gray400 },

  teamHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  teamEmpty:   { fontFamily: Typography.body, fontSize: 13, color: Colors.gray400, paddingVertical: 8 },
  teamRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  teamName:    { fontFamily: Typography.bold, fontSize: 13, color: Colors.gray900 },
  teamEmail:   { fontFamily: Typography.body, fontSize: 11, color: Colors.gray400 },

  archCard:    { backgroundColor: Colors.green50, borderWidth: 1, borderColor: Colors.green100 },
  archTitle:   { fontFamily: Typography.bold, fontSize: 13, color: Colors.green700, marginBottom: 10 },
  archLine:    { fontFamily: Typography.body, fontSize: 12, color: Colors.gray600, lineHeight: 22 },
  archKey:     { fontFamily: Typography.bold },

  logoutBtn:   { marginTop: 6 },

  overlay:      { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: Colors.white, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, maxHeight: '90%' },
  modalHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle:   { fontFamily: Typography.display, fontSize: 18, color: Colors.gray900 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  modalBody:    { padding: 20, gap: 14 },
  fieldLabel:   { fontFamily: Typography.bold, fontSize: 11, color: Colors.gray500, letterSpacing: 1 },

  roleRow:      { flexDirection: 'row', borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.gray200 },
  roleBtn:      { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.white },
  roleBtnActive:{ backgroundColor: Colors.green600 },
  roleBtnLabel: { fontFamily: Typography.bold, fontSize: 13, color: Colors.gray500 },
  roleBtnLabelActive: { color: Colors.white },

  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 20 },
});