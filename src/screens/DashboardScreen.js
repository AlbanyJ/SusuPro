// ============================================================
// FILE 17: src/screens/DashboardScreen.js
// WHAT:   The home screen after login.
//         Shows total savings, today's activity, recent transactions.
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp, loadAppData } from '../store/AppContext';
import { useTheme } from '../store/ThemeContext';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import { Typography, Spacing, Radius } from '../constants/theme';

// Format numbers as GHS currency
function fmt(n) {
  return `GHS ${Number(n).toLocaleString('en-GH')}`;
}

// Today's date as YYYY-MM-DD string
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function DashboardScreen() {
  const { state, dispatch } = useApp();
  const { currentUser, customers, transactions, isOnline, dataLoading } = state;
  const insets = useSafeAreaInsets();
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  // Helper: find customer by ID
  const getCustomer = (id) => customers.find(c => c.id === id);

  return (
    <ScrollView
      style={styles.screen}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={dataLoading} onRefresh={() => loadAppData(dispatch)} colors={[colors.green600]} />
      }
    >

      {/* ── Hero Header ─────────────────────────────────────── */}
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greetSub}>Good morning,</Text>
            <Text style={styles.greetName}>{currentUser?.name?.split(' ')[0]}</Text>
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
      </LinearGradient>

      {/* ── Stat Cards ──────────────────────────────────────── */}
      <View style={styles.content}>
        <View style={styles.statRow}>
          <StatCard
            label="Today's Collections"
            value={fmt(todayCollections)}
            sub={`${todayTxns.filter(t => t.type === 'contribution').length} transactions`}
            icon="cash-outline"
            accent
          />
          <StatCard
            label="Withdrawals"
            value={fmt(todayWithdrawals)}
            sub="Today"
            icon="arrow-up-circle-outline"
          />
        </View>

        <View style={styles.statRow}>
          <StatCard label="Active Members" value={activeCount} sub={`${customers.length} total`} icon="people-outline" />
          <StatCard label="Net Today" value={fmt(todayCollections - todayWithdrawals)} sub="In minus out" icon="stats-chart-outline" />
        </View>

        {/* ── Offline warning ─── */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={20} color={colors.amber} />
            <View>
              <Text style={styles.offlineTitle}>Offline Mode Active</Text>
              <Text style={styles.offlineBody}>Transactions will sync when connected.</Text>
            </View>
          </View>
        )}

        {/* ── Recent Transactions ─────────────────────────── */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {dataLoading && recentTxns.length === 0 && (
          <Text style={styles.emptyNote}>Loading activity…</Text>
        )}
        {!dataLoading && recentTxns.length === 0 && (
          <Text style={styles.emptyNote}>No transactions yet.</Text>
        )}

        {recentTxns.map(t => {
          const cust = getCustomer(t.customerId);
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
                    {t.date} · {t.time} · by {t.collectorName?.split(' ')[0] || '—'}
                  </Text>
                </View>
                <View style={styles.txnRight}>
                  <Text style={[styles.txnAmount, { color: isContrib ? colors.green600 : colors.red }]}>
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

function makeStyles(colors) {
  return StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.offWhite },

    // Hero
    hero:       { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 48 },
    heroTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    greetSub:   { fontFamily: Typography.medium, fontSize: 13, color: 'rgba(255,255,255,0.65)' },
    greetName:  { fontFamily: Typography.display, fontSize: 22, color: colors.white },
    onlinePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
    offlinePill:{ backgroundColor: 'rgba(217,119,6,0.25)' },
    onlineDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
    offlineDot: { backgroundColor: colors.amber },
    onlineText: { fontFamily: Typography.semiBold, fontSize: 11, color: 'rgba(255,255,255,0.85)' },
    offlineText:{ color: colors.amber },

    heroTotal:  { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.md, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    heroLabel:  { fontFamily: Typography.bold, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6 },
    heroAmount: { fontFamily: Typography.display, fontSize: Typography.size.hero, letterSpacing: -0.5, color: colors.white },
    heroSub:    { fontFamily: Typography.body, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 },

    // Content
    content:    { padding: Spacing.lg, marginTop: -12 },
    statRow:    { flexDirection: 'row', gap: 10, marginBottom: 10 },
    sectionTitle: { fontFamily: Typography.display, fontSize: 17, color: colors.gray900, marginBottom: 12, marginTop: 8 },
    emptyNote:  { textAlign: 'center', fontFamily: Typography.body, fontSize: 13, color: colors.gray400, padding: 24 },

    // Offline banner
    offlineBanner: { backgroundColor: colors.amberLight, borderRadius: Radius.sm, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: colors.amber },
    offlineTitle:  { fontFamily: Typography.bold, fontSize: 13, color: colors.amber },
    offlineBody:   { fontFamily: Typography.body, fontSize: 12, color: colors.gray500 },

    // Transactions
    txnCard:   { marginBottom: 8, padding: 14 },
    txnRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
    txnInfo:   { flex: 1 },
    txnName:   { fontFamily: Typography.bold, fontSize: 14, color: colors.gray900 },
    txnMeta:   { fontFamily: Typography.body, fontSize: 12, color: colors.gray400 },
    txnRight:  { alignItems: 'flex-end', gap: 4 },
    txnAmount: { fontFamily: Typography.bold, fontSize: 15 },
  });
}
