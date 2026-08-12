// ============================================================
// FILE 19: src/screens/TransactionsScreen.js
// WHAT:   Record new contributions and withdrawals.
//         Lists all past transactions with filters.
//         Collectors can only flag a withdrawal for admin
//         approval — see withdrawalService.requestWithdrawal.
//         Admins process withdrawals directly, same as before.
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, Platform,
  TouchableOpacity, Modal, ScrollView, Alert, RefreshControl, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ACTIONS, loadAppData } from '../store/AppContext';
import { recordTransaction } from '../services/transactionService';
import { requestWithdrawal } from '../services/withdrawalService';
import { addToOfflineQueue } from '../database/sqlite';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import PaymentPill from '../components/PaymentPill';
import { Typography, Spacing, Radius } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

function fmt(n) { return `GHS ${Number(n).toLocaleString('en-GH')}`; }
function uid()  { return Math.random().toString(36).substr(2, 9); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function timeNow()  { return new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' }); }

const FILTERS = [
  { key: 'all',          label: 'All' },
  { key: 'contribution', label: 'Savings' },
  { key: 'withdrawal',   label: 'Withdrawals' },
];

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: 'cash-outline' },
  { key: 'momo', label: 'MoMo', icon: 'phone-portrait-outline' },
  { key: 'bank', label: 'Bank', icon: 'business-outline' },
];

const NETWORKS = ['MTN', 'Vodafone', 'AirtelTigo'];

export default function TransactionsScreen() {
  const { state, dispatch } = useApp();
  const { transactions, customers, currentUser, isOnline, dataLoading } = state;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isAdmin = currentUser?.role === 'admin';

  const [filter,    setFilter]    = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [loading,   setLoading]   = useState(false);

  // Form state
  const [txType,  setTxType]  = useState('contribution');
  const [custId,  setCustId]  = useState('');
  const [amount,  setAmount]  = useState('');
  const [notes,   setNotes]   = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [network,       setNetwork]       = useState('MTN');

  // Collectors only ever see their own customers/transactions;
  // admins see everything.
  const myCustomers = useMemo(
    () => isAdmin ? customers : customers.filter(c => c.collectorId === currentUser?.id),
    [customers, isAdmin, currentUser]
  );
  const myTransactions = useMemo(
    () => isAdmin ? transactions : transactions.filter(t => t.collectorId === currentUser?.id),
    [transactions, isAdmin, currentUser]
  );

  // A collector's withdrawal can't be processed directly — it has to
  // go through admin approval first.
  const needsApproval = txType === 'withdrawal' && !isAdmin;

  // Filtered + sorted transactions
  const displayed = useMemo(() => {
    const sorted = [...myTransactions].sort((a, b) =>
      (b.date + b.time).localeCompare(a.date + a.time)
    );
    return filter === 'all' ? sorted : sorted.filter(t => t.type === filter);
  }, [myTransactions, filter]);

  const getCustomer  = (id) => customers.find(c => c.id === id);
  const selectedCust = customers.find(c => c.id === custId);
  const activeCustomers = myCustomers.filter(c => c.active);

  function resetForm() {
    setCustId(''); setAmount(''); setNotes('');
    setTxType('contribution'); setPaymentMethod('cash'); setNetwork('MTN');
  }

  // ── Record transaction ─────────────────────────────────────
  async function handleRecord() {
    const amt = parseFloat(amount);

    if (!custId) { Alert.alert('Error', 'Please select a customer.'); return; }
    if (!amt || amt <= 0) { Alert.alert('Error', 'Please enter a valid amount.'); return; }
    if (txType === 'withdrawal' && amt > (selectedCust?.balance || 0)) {
      Alert.alert('Error', `Insufficient balance. Available: ${fmt(selectedCust?.balance || 0)}`);
      return;
    }

    // ── Collector withdrawal: flag for approval, no balance change ──
    if (needsApproval) {
      if (!isOnline) {
        Alert.alert('Offline', 'Withdrawal requests need an internet connection to submit for approval.');
        return;
      }
      setLoading(true);
      const result = await requestWithdrawal({
        customerId: custId,
        amount: amt,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name,
        notes,
        paymentMethod,
        network,
      });
      setLoading(false);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Could not submit withdrawal request.');
        return;
      }

      Alert.alert('Submitted', 'Your withdrawal request has been sent to an admin for approval.');
      resetForm();
      setShowModal(false);
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
        paymentMethod,
        network,
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
            notes, paymentMethod, network, status: 'completed',
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
        paymentMethod, network,
        status:        'pending_sync',
      };
      await addToOfflineQueue(transaction);
      dispatch({ type: ACTIONS.ADD_TRANSACTION, payload: { transaction, balanceChange } });
      dispatch({ type: ACTIONS.ADD_TO_QUEUE,    payload: transaction });
    }

    resetForm();
    setShowModal(false);
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>

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
              accessibilityRole="tab"
              accessibilityState={{ selected: filter === f.key }}
              accessibilityLabel={`Filter: ${f.label}`}
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
          <RefreshControl refreshing={dataLoading} onRefresh={() => loadAppData(dispatch, currentUser)} colors={[colors.green600]} />
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
                <View style={styles.txnIconBox}>
                  <Ionicons
                    name={isContrib ? 'arrow-down' : 'arrow-up'}
                    size={18}
                    color={colors.gray700}
                  />
                </View>
                <View style={styles.txnInfo}>
                  <Text style={styles.txnName}>{cust?.name || 'Unknown'}</Text>
                  <Text style={styles.txnMeta}>
                    {t.date} · {t.time}{t.notes ? ` · ${t.notes}` : ''}
                  </Text>
                  <View style={styles.txnPillRow}>
                    <PaymentPill method={t.paymentMethod || 'cash'} network={t.network} />
                  </View>
                </View>
                <View style={styles.txnRight}>
                  <Text style={[styles.txnAmount, { color: isContrib ? colors.green600 : colors.red }]}>
                    {isContrib ? '+' : '−'}{fmt(t.amount)}
                  </Text>
                  <Badge
                    label={pending ? 'Pending Sync' : (isContrib ? 'Saved' : 'Withdrawn')}
                    type={pending ? 'warning' : 'neutral'}
                  />
                </View>
              </View>
            </Card>
          );
        }}
      />

      {/* ── Record Transaction Modal ── */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Record Transaction</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={16} color={colors.gray500} />
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
                    accessibilityRole="radio"
                    accessibilityState={{ checked: txType === t }}
                    accessibilityLabel={t === 'contribution' ? 'Contribution' : 'Withdrawal'}
                  >
                    <Ionicons
                      name={t === 'contribution' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
                      size={16}
                      color={txType === t ? colors.white : colors.gray500}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.typeBtnLabel, txType === t && styles.typeBtnLabelActive]}>
                      {t === 'contribution' ? 'Contribution' : 'Withdrawal'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {needsApproval && (
                <View style={styles.approvalNote}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.gray700} />
                  <Text style={styles.approvalNoteText}>
                    Withdrawals need admin approval — this will be sent as a request, not processed immediately.
                  </Text>
                </View>
              )}

              {/* Customer selector */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>CUSTOMER <Text style={{ color: colors.red }}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.custScroll}>
                {activeCustomers.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCustId(c.id)}
                    style={[styles.custChip, custId === c.id && styles.custChipActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: custId === c.id }}
                    accessibilityLabel={`${c.name}, balance ${fmt(c.balance)}`}
                  >
                    <Text style={[styles.custChipText, custId === c.id && styles.custChipTextActive]}>
                      {c.name.split(' ')[0]}
                    </Text>
                    <Text style={[styles.custChipBal, custId === c.id && { color: 'rgba(255,255,255,0.75)' }]}>
                      {fmt(c.balance)}
                    </Text>
                  </TouchableOpacity>
                ))}
                {activeCustomers.length === 0 && (
                  <Text style={styles.noCustomers}>No active customers assigned to you yet.</Text>
                )}
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
                  <Ionicons name="alert-circle-outline" size={16} color={colors.amber} />
                  <Text style={styles.warnText}>Available balance: {fmt(selectedCust?.balance || 0)}</Text>
                </View>
              )}

              {/* Payment method */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>PAYMENT METHOD</Text>
              <View style={styles.methodRow}>
                {PAYMENT_METHODS.map(m => (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setPaymentMethod(m.key)}
                    style={[styles.methodBtn, paymentMethod === m.key && styles.methodBtnActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: paymentMethod === m.key }}
                    accessibilityLabel={m.label}
                  >
                    <Ionicons name={m.icon} size={16} color={paymentMethod === m.key ? colors.white : colors.gray500} />
                    <Text style={[styles.methodBtnLabel, paymentMethod === m.key && styles.methodBtnLabelActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {paymentMethod === 'momo' && (
                <View style={styles.networkRow}>
                  {NETWORKS.map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setNetwork(n)}
                      style={[styles.networkChip, network === n && styles.networkChipActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: network === n }}
                      accessibilityLabel={n}
                    >
                      <Text style={[styles.networkChipText, network === n && styles.networkChipTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
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
                  label={needsApproval ? 'Flag for Approval' : (txType === 'contribution' ? 'Save Contribution' : 'Process Withdrawal')}
                  onPress={handleRecord}
                  loading={loading}
                  variant={txType === 'withdrawal' ? 'danger' : 'primary'}
                  style={{ flex: 1 }}
                />
              </View>

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
  screen:       { flex: 1, backgroundColor: colors.offWhite },
  header:       { backgroundColor: colors.surface, padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title:        { fontFamily: Typography.display, fontSize: 22, color: colors.gray900 },
  filterRow:    { flexDirection: 'row', gap: 8 },
  filterBtn:    { borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.gray100 },
  filterBtnActive: { backgroundColor: colors.green600 },
  filterLabel:  { fontFamily: Typography.bold, fontSize: 13, color: colors.gray500 },
  filterLabelActive: { color: colors.white },

  list:         { padding: Spacing.lg, gap: 8, paddingBottom: 80 },
  empty:        { textAlign: 'center', fontFamily: Typography.body, fontSize: 14, color: colors.gray400, padding: 40 },

  txnCard:      { padding: 14 },
  txnRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txnIconBox:   { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray100 },
  txnInfo:      { flex: 1 },
  txnName:      { fontFamily: Typography.bold, fontSize: 14, color: colors.gray900 },
  txnMeta:      { fontFamily: Typography.body, fontSize: 12, color: colors.gray400 },
  txnPillRow:   { flexDirection: 'row', marginTop: 4 },
  txnRight:     { alignItems: 'flex-end', gap: 4 },
  txnAmount:    { fontFamily: Typography.bold, fontSize: 15 },

  overlay:      { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, maxHeight: '90%' },
  modalHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  modalTitle:   { fontFamily: Typography.display, fontSize: 18, color: colors.gray900 },
  closeBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  modalBody:    { padding: 20 },
  fieldLabel:   { fontFamily: Typography.bold, fontSize: 11, color: colors.gray500, letterSpacing: 1, marginBottom: 8 },

  typeRow:      { flexDirection: 'row', borderRadius: Radius.sm, overflow: 'hidden', borderWidth: 1.5, borderColor: colors.gray200 },
  typeBtn:      { flex: 1, flexDirection: 'row', paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  typeBtnContrib:  { backgroundColor: colors.green600 },
  typeBtnWithdraw: { backgroundColor: colors.red },
  typeBtnLabel:    { fontFamily: Typography.bold, fontSize: 13, color: colors.gray500 },
  typeBtnLabelActive: { color: colors.white },

  approvalNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.gray50, borderRadius: Radius.sm, padding: 10, marginTop: 10 },
  approvalNoteText: { flex: 1, fontFamily: Typography.body, fontSize: 12, color: colors.gray700, lineHeight: 17 },

  custScroll:   { marginBottom: 4 },
  custChip:     { borderRadius: Radius.sm, padding: 10, backgroundColor: colors.gray100, marginRight: 8, minWidth: 90, alignItems: 'center' },
  custChipActive: { backgroundColor: colors.green500 },
  custChipText:   { fontFamily: Typography.bold, fontSize: 13, color: colors.gray700 },
  custChipTextActive: { color: colors.white },
  custChipBal:    { fontFamily: Typography.body, fontSize: 11, color: colors.gray400, marginTop: 2 },
  noCustomers:    { fontFamily: Typography.body, fontSize: 12, color: colors.gray400, paddingVertical: 12 },

  warnBox:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.amberLight, borderRadius: Radius.sm, padding: 10, marginTop: 10 },
  warnText:     { fontFamily: Typography.medium, fontSize: 13, color: colors.amber },

  methodRow:    { flexDirection: 'row', gap: 8 },
  methodBtn:    { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, backgroundColor: colors.gray100 },
  methodBtnActive: { backgroundColor: colors.green600 },
  methodBtnLabel:  { fontFamily: Typography.bold, fontSize: 12, color: colors.gray500 },
  methodBtnLabelActive: { color: colors.white },

  networkRow:   { flexDirection: 'row', gap: 8, marginTop: 8 },
  networkChip:  { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm, borderWidth: 1.5, borderColor: colors.gray200 },
  networkChipActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  networkChipText:   { fontFamily: Typography.semiBold, fontSize: 12, color: colors.gray700 },
  networkChipTextActive: { color: colors.white },

  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 20 },
});
}
