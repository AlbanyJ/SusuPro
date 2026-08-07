// ============================================================
// FILE 19: src/screens/TransactionsScreen.js
// WHAT:   Record new contributions and withdrawals.
//         Lists all past transactions with filters.
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Modal, ScrollView, Alert, RefreshControl,
} from 'react-native';
import { useApp, ACTIONS, loadAppData } from '../store/AppContext';
import { recordTransaction } from '../services/transactionService';
import { addToOfflineQueue } from '../database/sqlite';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';

function fmt(n) { return `GHS ${Number(n).toLocaleString('en-GH')}`; }
function uid()  { return Math.random().toString(36).substr(2, 9); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function timeNow()  { return new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }); }

const FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'contribution', label: 'Savings' },
  { key: 'withdrawal',   label: 'Withdrawals' },
];

export default function TransactionsScreen() {
  const { state, dispatch } = useApp();
  const { transactions, customers, currentUser, isOnline, dataLoading } = state;

  const [filter,    setFilter]    = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [loading,   setLoading]   = useState(false);

  // Form state
  const [txType,  setTxType]  = useState('contribution');
  const [custId,  setCustId]  = useState('');
  const [amount,  setAmount]  = useState('');
  const [notes,   setNotes]   = useState('');

  // Filtered + sorted transactions
  const displayed = useMemo(() => {
    const sorted = [...transactions].sort((a, b) =>
      (b.date + b.time).localeCompare(a.date + a.time)
    );
    return filter === 'all' ? sorted : sorted.filter(t => t.type === filter);
  }, [transactions, filter]);

  const getCustomer  = (id) => customers.find(c => c.id === id);
  const selectedCust = customers.find(c => c.id === custId);
  const activeCustomers = customers.filter(c => c.active);

  // ── Record transaction ─────────────────────────────────────
  async function handleRecord() {
    const amt = parseFloat(amount);

    if (!custId) { Alert.alert('Error', 'Please select a customer.'); return; }
    if (!amt || amt <= 0) { Alert.alert('Error', 'Please enter a valid amount.'); return; }
    if (txType === 'withdrawal' && amt > (selectedCust?.balance || 0)) {
      Alert.alert('Error', `Insufficient balance. Available: ${fmt(selectedCust?.balance || 0)}`);
      return;
    }

    setLoading(true);

    const balanceChange = txType === 'contribution' ? amt : -amt;

    if (isOnline) {
      // Online: write straight to Firestore (atomic balance update +
      // transaction record — see transactionService.recordTransaction).
      const result = await recordTransaction({
        customerId:    custId,
        type:          txType,
        amount:        amt,
        collectorId:   currentUser.id,
        collectorName: currentUser.name,
        notes,
      });

      if (!result.success) {
        Alert.alert('Error', result.error || 'Could not record transaction.');
        setLoading(false);
        return;
      }

      dispatch({
        type: ACTIONS.ADD_TRANSACTION,
        payload: {
          transaction: {
            id: result.id, customerId: custId, type: txType, amount: amt,
            date: todayStr(), time: timeNow(),
            collectorId: currentUser.id, collectorName: currentUser.name,
            notes, status: 'completed',
          },
          balanceChange,
        },
      });
    } else {
      // Offline: save locally, will sync automatically once back online.
      const transaction = {
        id:            uid(),
        customerId:    custId,
        type:          txType,
        amount:        amt,
        date:          todayStr(),
        time:          timeNow(),
        collectorId:   currentUser.id,
        collectorName: currentUser.name,
        notes,
        status:        'pending_sync',
      };
      await addToOfflineQueue(transaction);
      dispatch({ type: ACTIONS.ADD_TRANSACTION, payload: { transaction, balanceChange } });
      dispatch({ type: ACTIONS.ADD_TO_QUEUE,    payload: transaction });
    }

    // Reset form
    setCustId(''); setAmount(''); setNotes(''); setTxType('contribution');
    setShowModal(false);
    setLoading(false);
  }

  return (
    <View style={styles.screen}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Transactions</Text>
          <Button label="+ Record" onPress={() => setShowModal(true)} size="sm" />
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            >
              <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Transaction List ── */}
      <FlatList
        data={displayed}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={dataLoading} onRefresh={() => loadAppData(dispatch)} colors={[Colors.green600]} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{dataLoading ? 'Loading transactions…' : 'No transactions found.'}</Text>
        }
        renderItem={({ item: t }) => {
          const cust = getCustomer(t.customerId);
          const isContrib = t.type === 'contribution';
          const pending = t.status === 'pending_sync';
          return (
            <Card style={styles.txnCard}>
              <View style={styles.txnRow}>
                <View style={[styles.txnIconBox, { backgroundColor: isContrib ? Colors.green100 : Colors.redLight }]}>
                  <Text style={styles.txnIcon}>{isContrib ? '💰' : '📤'}</Text>
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnName}>{cust?.name || 'Unknown'}</Text>
                  <Text style={styles.txnMeta}>
                    {t.date} · {t.time}{t.notes ? ` · ${t.notes}` : ''}
                  </Text>
                </View>
                <View style={styles.txnRight}>
                  <Text style={[styles.txnAmount, { color: isContrib ? Colors.green600 : Colors.red }]}>
                    {isContrib ? '+' : '−'}{fmt(t.amount)}
                  </Text>
                  <Badge
                    label={pending ? 'Pending Sync' : (isContrib ? 'Saved' : 'Withdrawn')}
                    type={pending ? 'warning' : (isContrib ? 'success' : 'danger')}
                  />
                </View>
              </View>
            </Card>
          );
        }}
      />

      {/* ── Record Transaction Modal ── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Record Transaction</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeBtn}>
                <Text>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">

              {/* Type selector */}
              <Text style={styles.fieldLabel}>TYPE</Text>
              <View style={styles.typeRow}>
                {['contribution', 'withdrawal'].map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTxType(t)}
                    style={[
                      styles.typeBtn,
                      txType === t && (t === 'contribution' ? styles.typeBtnContrib : styles.typeBtnWithdraw),
                    ]}
                  >
                    <Text style={[styles.typeBtnLabel, txType === t && styles.typeBtnLabelActive]}>
                      {t === 'contribution' ? '💰 Contribution' : '📤 Withdrawal'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Customer selector */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CUSTOMER <Text style={{ color: Colors.red }}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.custScroll}>
                {activeCustomers.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCustId(c.id)}
                    style={[styles.custChip, custId === c.id && styles.custChipActive]}
                  >
                    <Text style={[styles.custChipText, custId === c.id && styles.custChipTextActive]}>
                      {c.name.split(' ')[0]}
                    </Text>
                    <Text style={[styles.custChipBal, custId === c.id && { color: 'rgba(255,255,255,0.75)' }]}>
                      {fmt(c.balance)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Amount */}
              <View style={{ marginTop: 14 }}>
                <Input
                  label="Amount (GHS)"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                  prefix="₵"
                  required
                />
              </View>

              {/* Balance warning for withdrawals */}
              {custId && txType === 'withdrawal' && (
                <View style={styles.warnBox}>
                  <Text style={styles.warnText}>⚠ Available balance: {fmt(selectedCust?.balance || 0)}</Text>
                </View>
              )}

              <View style={{ marginTop: 14 }}>
                <Input
                  label="Notes (Optional)"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any notes…"
                />
              </View>

              <View style={styles.modalButtons}>
                <Button label="Cancel" onPress={() => setShowModal(false)} variant="ghost" style={{ flex: 1 }} />
                <Button
                  label={txType === 'contribution' ? 'Save Contribution' : 'Process Withdrawal'}
                  onPress={handleRecord}
                  loading={loading}
                  variant={txType === 'withdrawal' ? 'danger' : 'primary'}
                  style={{ flex: 1 }}
                />
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:       { flex: 1, backgroundColor: Colors.offWhite },
  header:       { backgroundColor: Colors.white, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:        { fontFamily: Typography.display, fontSize: 22, color: Colors.gray900 },
  filterRow:    { flexDirection: 'row', gap: 8 },
  filterBtn:    { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.gray100 },
  filterBtnActive: { backgroundColor: Colors.green600 },
  filterLabel:  { fontFamily: Typography.bold, fontSize: 13, color: Colors.gray500 },
  filterLabelActive: { color: Colors.white },

  list:         { padding: Spacing.lg, gap: 8, paddingBottom: 80 },
  empty:        { textAlign: 'center', fontFamily: Typography.body, fontSize: 14, color: Colors.gray400, padding: 40 },

  txnCard:      { padding: 14 },
  txnRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txnIconBox:   { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txnIcon:      { fontSize: 20 },
  txnInfo:      { flex: 1 },
  txnName:      { fontFamily: Typography.bold, fontSize: 14, color: Colors.gray900 },
  txnMeta:      { fontFamily: Typography.body, fontSize: 12, color: Colors.gray400 },
  txnRight:     { alignItems: 'flex-end', gap: 4 },
  txnAmount:    { fontFamily: Typography.bold, fontSize: 15 },

  overlay:      { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: Colors.white, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, maxHeight: '90%' },
  modalHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle:   { fontFamily: Typography.display, fontSize: 18, color: Colors.gray900 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  modalBody:    { padding: 20 },
  fieldLabel:   { fontFamily: Typography.bold, fontSize: 11, color: Colors.gray500, letterSpacing: 1, marginBottom: 8 },

  typeRow:      { flexDirection: 'row', borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1.5, borderColor: Colors.gray200 },
  typeBtn:      { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: Colors.white },
  typeBtnContrib:  { backgroundColor: Colors.green600 },
  typeBtnWithdraw: { backgroundColor: Colors.red },
  typeBtnLabel:    { fontFamily: Typography.bold, fontSize: 13, color: Colors.gray500 },
  typeBtnLabelActive: { color: Colors.white },

  custScroll:   { marginBottom: 4 },
  custChip:     { borderRadius: Radius.sm, padding: 10, backgroundColor: Colors.gray100, marginRight: 8, minWidth: 90, alignItems: 'center' },
  custChipActive: { backgroundColor: Colors.green500 },
  custChipText:   { fontFamily: Typography.bold, fontSize: 13, color: Colors.gray700 },
  custChipTextActive: { color: Colors.white },
  custChipBal:    { fontFamily: Typography.body, fontSize: 11, color: Colors.gray400, marginTop: 2 },

  warnBox:      { backgroundColor: Colors.amberLight, borderRadius: Radius.sm, padding: 10, marginTop: 10 },
  warnText:     { fontFamily: Typography.medium, fontSize: 13, color: Colors.amber },

  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 20 },
});