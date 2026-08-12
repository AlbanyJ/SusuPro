// ============================================================
// FILE 20: src/screens/ReportsScreen.js
// WHAT:   Admin-only. Shows summaries, top savers, daily breakdown.
// ============================================================

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp, loadAppData } from '../store/AppContext';
import { filterByPeriod, exportReportPdf } from '../services/reportService';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { Typography, Spacing, Radius } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

function fmt(n) { return `GHS ${Number(n).toLocaleString('en-GH')}`; }

const PERIODS = [
  { key: '7', label: '7 Days' },
  { key: '30', label: '30 Days' },
  { key: 'all', label: 'All Time' },
];

export default function ReportsScreen() {
  const { state, dispatch } = useApp();
  const { transactions, customers, dataLoading } = state;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const todayStr = new Date().toISOString().split('T')[0];

  const [period, setPeriod] = useState('30');
  const [exporting, setExporting] = useState(false);

  const periodTxns = useMemo(() => filterByPeriod(transactions, period), [transactions, period]);

  const totalCollected = useMemo(
    () => periodTxns.filter(t => t.type === 'contribution').reduce((s, t) => s + t.amount, 0),
    [periodTxns]
  );
  const totalWithdrawn = useMemo(
    () => periodTxns.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0),
    [periodTxns]
  );

  async function handleExport() {
    setExporting(true);
    const result = await exportReportPdf({ customers, transactions, period });
    setExporting(false);
    if (!result.success) {
      Alert.alert('Export Failed', result.error || 'Could not generate the PDF report.');
    }
  }

  const topCustomers = useMemo(
    () => [...customers].sort((a, b) => b.balance - a.balance).slice(0, 5),
    [customers]
  );

  // Group transactions by date
  const byDate = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (!map[t.date]) map[t.date] = { contrib: 0, withdraw: 0, count: 0 };
      if (t.type === 'contribution') map[t.date].contrib += t.amount;
      else map[t.date].withdraw += t.amount;
      map[t.date].count++;
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);
  }, [transactions]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={dataLoading} onRefresh={() => loadAppData(dispatch)} colors={[colors.green600]} />
        }
      >
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.sub}>Financial overview & analytics</Text>
      </View>

      <View style={styles.content}>
        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={[styles.periodChip, period === p.key && styles.periodChipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: period === p.key }}
              accessibilityLabel={p.label}
            >
              <Text style={[styles.periodChipText, period === p.key && styles.periodChipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.statRow}>
          <StatCard label="Total Collected" value={fmt(totalCollected)} sub={PERIODS.find(p => p.key === period)?.label} icon="trending-up-outline" accent />
          <StatCard label="Total Paid Out"  value={fmt(totalWithdrawn)} sub={PERIODS.find(p => p.key === period)?.label} icon="trending-down-outline" />
        </View>

        <Button
          label="Export PDF Report"
          onPress={handleExport}
          loading={exporting}
          disabled={exporting}
          variant="secondary"
          fullWidth
          style={{ marginBottom: 20 }}
        />

        {/* Top Savers */}
        <Text style={styles.sectionTitle}>Top Savers</Text>
        {topCustomers.map((c, i) => (
          <Card key={c.id} style={styles.saverCard}>
            <View style={styles.saverRow}>
              <View style={[styles.rankBadge, i === 0 && styles.rankGold, i === 1 && styles.rankSilver]}>
                <Text style={[styles.rankText, (i === 0 || i === 1) && { color: colors.white }]}>{i + 1}</Text>
              </View>
              <Avatar initials={c.avatar} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.saverName}>{c.name}</Text>
                <Text style={styles.saverPhone}>{c.phone}</Text>
              </View>
              <Text style={styles.saverBalance}>{fmt(c.balance)}</Text>
            </View>
          </Card>
        ))}

        {/* Daily Breakdown */}
        <Text style={styles.sectionTitle}>Daily Summary (Last 7 Days)</Text>
        {byDate.map(([date, data]) => {
          const net = data.contrib - data.withdraw;
          return (
            <Card key={date} style={styles.dayCard}>
              <View style={styles.dayTop}>
                <View>
                  <Text style={styles.dayDate}>{date === todayStr ? 'Today' : date}</Text>
                  <Text style={styles.dayCount}>{data.count} transaction{data.count !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={[styles.dayNet, { color: net >= 0 ? colors.green600 : colors.red }]}>
                  Net: {fmt(net)}
                </Text>
              </View>
              <View style={styles.barRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.barLabel}>Collected: {fmt(data.contrib)}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { backgroundColor: colors.green400 }]} />
                  </View>
                </View>
                {data.withdraw > 0 && (
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.barLabel}>Withdrawn: {fmt(data.withdraw)}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { backgroundColor: colors.red }]} />
                    </View>
                  </View>
                )}
              </View>
            </Card>
          );
        })}

        <View style={{ height: 20 }} />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.offWhite },
  header:       { backgroundColor: colors.surface, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  title:        { fontFamily: Typography.display, fontSize: 22, color: colors.gray900 },
  sub:          { fontFamily: Typography.body, fontSize: 13, color: colors.gray400 },
  content:      { padding: Spacing.lg },

  periodRow:        { flexDirection: 'row', gap: 8, marginBottom: 16 },
  periodChip:        { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.sm, backgroundColor: colors.gray100 },
  periodChipActive:  { backgroundColor: colors.green600 },
  periodChipText:       { fontFamily: Typography.semiBold, fontSize: 12, color: colors.gray700 },
  periodChipTextActive: { color: colors.white },

  statRow:      { flexDirection: 'row', gap: 10, marginBottom: 20 },
  sectionTitle: { fontFamily: Typography.display, fontSize: 17, color: colors.gray900, marginBottom: 12, marginTop: 4 },

  saverCard:    { marginBottom: 8, padding: 14 },
  saverRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBadge:    { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  rankGold:     { backgroundColor: '#f59e0b' },
  rankSilver:   { backgroundColor: colors.gray400 },
  rankText:     { fontFamily: Typography.bold, fontSize: 13, color: colors.gray600 },
  saverName:    { fontFamily: Typography.bold, fontSize: 14, color: colors.gray900 },
  saverPhone:   { fontFamily: Typography.body, fontSize: 11, color: colors.gray400 },
  saverBalance: { fontFamily: Typography.bold, fontSize: 16, color: colors.green600 },

  dayCard:      { marginBottom: 8 },
  dayTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayDate:      { fontFamily: Typography.bold, fontSize: 14, color: colors.gray900 },
  dayCount:     { fontFamily: Typography.body, fontSize: 12, color: colors.gray400 },
  dayNet:       { fontFamily: Typography.bold, fontSize: 14 },
  barRow:       { flexDirection: 'row' },
  barLabel:     { fontFamily: Typography.body, fontSize: 11, color: colors.gray400, marginBottom: 4 },
  barTrack:     { height: 6, backgroundColor: colors.gray100, borderRadius: 99, overflow: 'hidden' },
  barFill:      { height: '100%', width: '100%', borderRadius: 99 },
});
}
