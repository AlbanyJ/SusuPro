// ============================================================
// FILE 17: src/screens/DashboardScreen.js
// WHAT:   The home screen after login.
//         Shows total savings, today's activity, recent transactions.
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { useApp } from '../store/AppContext';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';

// Format numbers as GHS currency
function fmt(n) {
  return `GHS ${Number(n).toLocaleString('en-GH')}`;
}

// Today's date as YYYY-MM-DD string
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DashboardScreen() {
  const { state } = useApp();
  const { currentUser, customers, transactions, isOnline } = state;

  // ── Computed stats ──────────────────────────────────────────
  const today = todayStr();

  const todayTxns = useMemo(
    () => transactions.filter(t => t.date === today),
    [transactions, today]
  );

  const todayCollections = useMemo(
    () => todayTxns.filter(t => t.type === 'contribution').reduce((s, t) => s + t.amount, 0),
    [todayTxns]
  );

  const todayWithdrawals = useMemo(
    () => todayTxns.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0),
    [todayTxns]
  );

  const totalSavings = useMemo(
    () => customers.reduce((s, c) => s + c.balance, 0),
    [customers]
  );

  const activeCount = useMemo(
    () => customers.filter(c => c.active).length,
    [customers]
  );

  const recentTxns = useMemo(
    () => [...transactions]
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .slice(0, 6),
    [transactions]
  );

  // Helper: find customer or user by ID
  const getCustomer = (id) => customers.find(c => c.id === id);
  const getCollector = (id) => state.users.find(u => u.id === id);

  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>

      {/* ── Hero Header ─────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greetSub}>Good morning,</Text>
            <Text style={styles.greetName}>{currentUser?.name?.split(' ')[0]} 👋</Text>
          </View>
          <View style={[styles.onlinePill, !isOnline && styles.offlinePill]}>
            <View style={[styles.onlineDot, !isOnline && styles.offlineDot]} />
            <Text style={[styles.onlineText, !isOnline && styles.offlineText]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Total savings */}
        <View style={styles.heroTotal}>
          <Text style={styles.heroLabel}>Total Savings Under Management</Text>
          <Text style={styles.heroAmount}>{fmt(totalSavings)}</Text>
          <Text style={styles.heroSub}>{activeCount} active members</Text>
        </View>
      </View>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <View style={styles.content}>
        <View style={styles.statRow}>
          <StatCard
            label="Today's Collections"
            value={fmt(todayCollections)}
            sub={`${todayTxns.filter(t => t.type === 'contribution').length} transactions`}
            icon="💰"
            accent
          />
          <StatCard
            label="Withdrawals"
            value={fmt(todayWithdrawals)}
            sub="Today"
            icon="📤"
          />
        </View>

        <View style={styles.statRow}>
          <StatCard label="Active Members" value={activeCount} sub={`${customers.length} total`} icon="👥" />
          <StatCard label="Net Today" value={fmt(todayCollections - todayWithdrawals)} sub="In minus out" icon="📊" />
        </View>

        {/* ── Offline warning ─── */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineIcon}>📶</Text>
            <View>
              <Text style={styles.offlineTitle}>Offline Mode Active</Text>
              <Text style={styles.offlineBody}>Transactions will sync when connected.</Text>
            </View>
          </View>
        )}

        {/* ── Recent Transactions ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {recentTxns.map(t => {
          const cust = getCustomer(t.customerId);
          const collector = getCollector(t.collectorId);
          const isContrib = t.type === 'contribution';

          return (
            <Card key={t.id} style={styles.txnCard}>
              <View style={styles.txnRow}>
                <Avatar
                  initials={cust?.avatar || '?'}
                  size={40}
                  variant={isContrib ? 'green' : 'red'}
                />
                <View style={styles.txnInfo}>
                  <Text style={styles.txnName}>{cust?.name || 'Unknown'}</Text>
                  <Text style={styles.txnMeta}>
                    {t.date} · {t.time} · by {collector?.name?.split(' ')[0] || '—'}
                  </Text>
                </View>
                <View style={styles.txnRight}>
                  <Text style={[styles.txnAmount, { color: isContrib ? Colors.green600 : Colors.red }]}>
                    {isContrib ? '+' : '−'}{fmt(t.amount)}
                  </Text>
                  <Badge label={isContrib ? 'Saved' : 'Withdrawn'} type={isContrib ? 'success' : 'danger'} />
                </View>
              </View>
            </Card>
          );
        })}

        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.offWhite },

  // Hero
  hero:       { backgroundColor: Colors.green500, paddingHorizontal: 20, paddingTop: 28, paddingBottom: 44 },
  heroTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetSub:   { fontFamily: Typography.medium, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  greetName:  { fontFamily: Typography.display, fontSize: 22, color: Colors.white },
  onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  offlinePill:{ backgroundColor: 'rgba(217,119,6,0.25)' },
  onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  offlineDot: { backgroundColor: Colors.amber },
  onlineText: { fontFamily: Typography.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  offlineText:{ color: Colors.amber },

  heroTotal:  { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.md, padding: 18 },
  heroLabel:  { fontFamily: Typography.bold, fontSize: 10, color: 'rgba(255,255,255,0.65)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  heroAmount: { fontFamily: Typography.display, fontSize: 34, color: Colors.white },
  heroSub:    { fontFamily: Typography.body, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  // Content
  content:    { padding: Spacing.lg, marginTop: -12 },
  statRow:    { flexDirection: 'row', gap: 10, marginBottom: 10 },
  sectionTitle: { fontFamily: Typography.display, fontSize: 17, color: Colors.gray900, marginBottom: 12, marginTop: 8 },

  // Offline banner
  offlineBanner: { backgroundColor: Colors.amberLight, borderRadius: Radius.sm, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: Colors.amber },
  offlineIcon:   { fontSize: 22 },
  offlineTitle:  { fontFamily: Typography.bold, fontSize: 13, color: Colors.amber },
  offlineBody:   { fontFamily: Typography.body, fontSize: 12, color: Colors.gray500 },

  // Transactions
  txnCard:   { marginBottom: 8, padding: 14 },
  txnRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txnInfo:   { flex: 1 },
  txnName:   { fontFamily: Typography.bold, fontSize: 14, color: Colors.gray900 },
  txnMeta:   { fontFamily: Typography.body, fontSize: 12, color: Colors.gray400 },
  txnRight:  { alignItems: 'flex-end', gap: 4 },
  txnAmount: { fontFamily: Typography.bold, fontSize: 15 },
});