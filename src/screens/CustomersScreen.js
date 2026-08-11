// ============================================================
// FILE 18: src/screens/CustomersScreen.js
// WHAT:   Lists all customers. Admin can add/deactivate them,
//         assign them to a collector, and set a photo/payment
//         method. Collectors only see customers assigned to them.
// ============================================================

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Platform, Image,
  TextInput, TouchableOpacity, Modal, ScrollView, Alert, RefreshControl, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ACTIONS, loadAppData } from '../store/AppContext';
import { addCustomer, updateCustomer } from '../services/customerService';
import { uploadCustomerPhoto } from '../services/storageService';
import { fetchUsers } from '../services/userService';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import PaymentPill from '../components/PaymentPill';
import PhotoPicker from '../components/PhotoPicker';
import { Typography, Spacing, Radius } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

function fmt(n) { return `GHS ${Number(n).toLocaleString('en-GH')}`; }

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: 'cash-outline' },
  { key: 'momo', label: 'MoMo', icon: 'phone-portrait-outline' },
  { key: 'bank', label: 'Bank', icon: 'business-outline' },
];
const NETWORKS = ['MTN', 'Vodafone', 'AirtelTigo'];

const EMPTY_FORM = {
  name: '', phone: '', idNo: '', fixedAmount: '',
  paymentMethod: 'cash', network: 'MTN', collectorId: '', photo: null,
};

export default function CustomersScreen() {
  const { state, dispatch } = useApp();
  const { customers, transactions, currentUser, dataLoading } = state;
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isAdmin = currentUser?.role === 'admin';

  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [toggling,  setToggling]  = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [team,      setTeam]      = useState([]);

  // Add form state
  const [form, setForm] = useState(EMPTY_FORM);

  const loadTeam = useCallback(async () => {
    if (!isAdmin) return;
    const result = await fetchUsers();
    if (result.success) setTeam(result.data.filter(u => u.role === 'collector'));
  }, [isAdmin]);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  // Collectors only ever see customers assigned to them; admins see
  // everyone.
  const myCustomers = useMemo(
    () => isAdmin ? customers : customers.filter(c => c.collectorId === currentUser?.id),
    [customers, isAdmin, currentUser]
  );

  // Filter customers by search query
  const filtered = useMemo(() =>
    myCustomers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    ), [myCustomers, search]
  );

  // Get transactions for the selected customer
  const customerTxns = useMemo(() =>
    selected
      ? [...transactions]
          .filter(t => t.customerId === selected.id)
          .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
          .slice(0, 8)
      : [],
    [selected, transactions]
  );

  const assignedCollectorName = (collectorId) => team.find(u => u.id === collectorId)?.name;

  // ── Add new customer ──────────────────────────────────────
  async function handleAdd() {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert('Missing Info', 'Name and phone number are required.');
      return;
    }
    setLoading(true);

    const result = await addCustomer(form, currentUser.id);

    if (!result.success) {
      Alert.alert('Error', result.error || 'Could not add customer.');
      setLoading(false);
      return;
    }

    let newCustomer = result.data;

    // The photo picker only gives us a LOCAL uri — upload it now that
    // we have a real customer id to scope the storage path to.
    if (form.photo) {
      const upload = await uploadCustomerPhoto(form.photo, newCustomer.id);
      if (upload.success) {
        await updateCustomer(newCustomer.id, { photo: upload.url });
        newCustomer = { ...newCustomer, photo: upload.url };
      } else {
        Alert.alert('Photo Upload Failed', 'The customer was saved, but the photo could not be uploaded. You can try again from their profile.');
      }
    }

    dispatch({ type: ACTIONS.ADD_CUSTOMER, payload: newCustomer });
    setForm(EMPTY_FORM);
    setShowAdd(false);
    setLoading(false);
  }

  // ── Toggle active/inactive ────────────────────────────────
  async function handleToggleActive(customer) {
    const newStatus = !customer.active;
    setToggling(true);

    const result = await updateCustomer(customer.id, { active: newStatus });

    if (result.success) {
      dispatch({
        type: ACTIONS.UPDATE_CUSTOMER,
        payload: { id: customer.id, active: newStatus },
      });
      setSelected(prev => prev ? { ...prev, active: newStatus } : null);
    } else {
      Alert.alert('Error', result.error || 'Could not update customer.');
    }

    setToggling(false);
  }

  // ── Change an existing customer's photo (admin only) ──────
  async function handleChangePhoto(localUri) {
    if (!selected) return;
    setPhotoBusy(true);

    const upload = await uploadCustomerPhoto(localUri, selected.id);
    if (!upload.success) {
      Alert.alert('Error', upload.error || 'Could not upload photo.');
      setPhotoBusy(false);
      return;
    }

    const result = await updateCustomer(selected.id, { photo: upload.url });
    if (result.success) {
      dispatch({ type: ACTIONS.UPDATE_CUSTOMER, payload: { id: selected.id, photo: upload.url } });
      setSelected(prev => prev ? { ...prev, photo: upload.url } : null);
    } else {
      Alert.alert('Error', result.error || 'Could not save photo.');
    }
    setPhotoBusy(false);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Customers</Text>
          {isAdmin && (
            <Button label="+ Add" onPress={() => setShowAdd(true)} size="sm" />
          )}
        </View>
        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.gray400} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone…"
            placeholderTextColor={colors.gray400}
            value={search}
            onChangeText={setSearch}
            accessibilityLabel="Search customers by name or phone"
          />
        </View>
      </View>

      {/* ── Customer List ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={dataLoading} onRefresh={() => loadAppData(dispatch)} colors={[colors.green600]} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {dataLoading ? 'Loading customers…' : 'No customers found.'}
          </Text>
        }
        renderItem={({ item: c }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSelected(c)}
            accessibilityRole="button"
            accessibilityLabel={`${c.name}, ${c.active ? 'active' : 'inactive'}, balance ${fmt(c.balance)}`}
            accessibilityHint="Opens customer details"
          >
            <Card style={styles.customerCard}>
              <View style={styles.customerRow}>
                {c.photo ? (
                  <Image source={{ uri: c.photo }} style={styles.customerPhoto} />
                ) : (
                  <Avatar initials={c.avatar} size={44} variant={c.active ? 'green' : 'gray'} />
                )}
                <View style={styles.customerInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.customerName}>{c.name}</Text>
                    <Badge label={c.active ? 'Active' : 'Inactive'} type="neutral" />
                  </View>
                  <Text style={styles.customerMeta}>
                    {c.phone}{c.idNo ? ` · ${c.idNo}` : ''}
                  </Text>
                  <View style={{ marginTop: 4 }}>
                    <PaymentPill method={c.paymentMethod || 'cash'} network={c.network} />
                  </View>
                </View>
                <View style={styles.balanceWrap}>
                  <Text style={styles.balance}>{fmt(c.balance)}</Text>
                  <Text style={styles.balanceLabel}>balance</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />

      {/* ── Customer Detail Modal ── */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Customer Details</Text>
              <TouchableOpacity
                onPress={() => setSelected(null)}
                style={styles.closeBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close customer details"
              >
                <Ionicons name="close" size={16} color={colors.gray500} />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Profile */}
                <View style={styles.profileRow}>
                  {isAdmin ? (
                    <PhotoPicker
                      uri={selected.photo}
                      initials={selected.avatar}
                      size={56}
                      onPick={handleChangePhoto}
                      disabled={photoBusy}
                    />
                  ) : selected.photo ? (
                    <Image source={{ uri: selected.photo }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                  ) : (
                    <Avatar initials={selected.avatar} size={56} variant="green" />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.profileName}>{selected.name}</Text>
                    <Text style={styles.profilePhone}>{selected.phone}</Text>
                    {selected.idNo ? <Text style={styles.profileId}>ID: {selected.idNo}</Text> : null}
                  </View>
                </View>

                {/* Balance summary */}
                <View style={styles.balanceSummary}>
                  <View>
                    <Text style={styles.summaryLabel}>Current Balance</Text>
                    <Text style={styles.summaryAmount}>{fmt(selected.balance)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.summaryLabel}>Member Since</Text>
                    <Text style={styles.summaryDate}>{selected.joinDate}</Text>
                  </View>
                </View>

                {/* Details grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.summaryLabel}>Payment</Text>
                    <PaymentPill method={selected.paymentMethod || 'cash'} network={selected.network} />
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.summaryLabel}>Daily Amount</Text>
                    <Text style={styles.detailValue}>{selected.fixedAmount ? fmt(selected.fixedAmount) : 'Flexible'}</Text>
                  </View>
                  {isAdmin && (
                    <View style={styles.detailItem}>
                      <Text style={styles.summaryLabel}>Collector</Text>
                      <Text style={styles.detailValue}>{assignedCollectorName(selected.collectorId) || 'Unassigned'}</Text>
                    </View>
                  )}
                </View>

                {/* Transaction history */}
                <Text style={styles.historyTitle}>Transaction History</Text>
                {customerTxns.length === 0
                  ? <Text style={styles.empty}>No transactions yet.</Text>
                  : customerTxns.map(t => (
                    <View key={t.id} style={styles.txnItem}>
                      <View>
                        <Text style={styles.txnDate}>{t.date} · {t.time}</Text>
                        {t.notes ? <Text style={styles.txnNote}>{t.notes}</Text> : null}
                      </View>
                      <Text style={[styles.txnAmt, { color: t.type === 'contribution' ? colors.green600 : colors.red }]}>
                        {t.type === 'contribution' ? '+' : '−'}{fmt(t.amount)}
                      </Text>
                    </View>
                  ))
                }

                {/* Admin actions */}
                {isAdmin && (
                  <Button
                    label={selected.active ? 'Deactivate Customer' : 'Activate Customer'}
                    onPress={() => handleToggleActive(selected)}
                    loading={toggling}
                    disabled={toggling}
                    variant={selected.active ? 'danger' : 'secondary'}
                    fullWidth
                    style={styles.actionBtn}
                  />
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Add Customer Modal ── */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
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
              <View style={styles.photoRow}>
                <PhotoPicker
                  uri={form.photo}
                  initials={form.name ? form.name.trim().split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : '?'}
                  size={64}
                  onPick={uri => setForm(f => ({ ...f, photo: uri }))}
                />
              </View>

              <Input label="Full Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Akosua Mensah" required />
              <Input label="Phone Number" value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="e.g. 0244123456" keyboardType="phone-pad" required />
              <Input label="ID Number (Optional)" value={form.idNo} onChangeText={v => setForm(f => ({ ...f, idNo: v }))} placeholder="e.g. GHA-2341" />
              <Input label="Fixed Daily Amount (Optional)" value={form.fixedAmount} onChangeText={v => setForm(f => ({ ...f, fixedAmount: v }))} placeholder="Leave blank if flexible" keyboardType="numeric" prefix="₵" />

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>PAYMENT METHOD</Text>
              <View style={styles.methodRow}>
                {PAYMENT_METHODS.map(m => (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setForm(f => ({ ...f, paymentMethod: m.key }))}
                    style={[styles.methodBtn, form.paymentMethod === m.key && styles.methodBtnActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: form.paymentMethod === m.key }}
                    accessibilityLabel={m.label}
                  >
                    <Ionicons name={m.icon} size={16} color={form.paymentMethod === m.key ? colors.white : colors.gray500} />
                    <Text style={[styles.methodBtnLabel, form.paymentMethod === m.key && styles.methodBtnLabelActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.paymentMethod === 'momo' && (
                <View style={styles.networkRow}>
                  {NETWORKS.map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setForm(f => ({ ...f, network: n }))}
                      style={[styles.networkChip, form.network === n && styles.networkChipActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: form.network === n }}
                      accessibilityLabel={n}
                    >
                      <Text style={[styles.networkChipText, form.network === n && styles.networkChipTextActive]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>ASSIGN TO COLLECTOR</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {team.length === 0 && (
                  <Text style={styles.noCollectors}>No collectors yet — add one from Settings first.</Text>
                )}
                {team.map(u => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setForm(f => ({ ...f, collectorId: f.collectorId === u.id ? '' : u.id }))}
                    style={[styles.collectorChip, form.collectorId === u.id && styles.collectorChipActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: form.collectorId === u.id }}
                    accessibilityLabel={u.name}
                  >
                    <Text style={[styles.collectorChipText, form.collectorId === u.id && styles.collectorChipTextActive]}>
                      {u.name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <Button label="Cancel" onPress={() => setShowAdd(false)} variant="ghost" style={{ flex: 1 }} />
                <Button label="Add Customer" onPress={handleAdd} loading={loading} style={{ flex: 1 }} />
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
  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray50, borderRadius: Radius.sm, paddingHorizontal: 12, borderWidth: 1.5, borderColor: colors.gray200 },
  searchIcon:   { fontSize: 16, marginRight: 8 },
  searchInput:  { flex: 1, paddingVertical: 12, fontFamily: Typography.body, fontSize: 15, color: colors.gray900 },
  list:         { padding: Spacing.lg, gap: 8, paddingBottom: 80 },
  empty:        { textAlign: 'center', fontFamily: Typography.body, fontSize: 14, color: colors.gray400, padding: 40 },

  customerCard: { padding: 14 },
  customerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerPhoto:{ width: 44, height: 44, borderRadius: 22 },
  customerInfo: { flex: 1 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
  customerName: { fontFamily: Typography.bold, fontSize: 15, color: colors.gray900 },
  customerMeta: { fontFamily: Typography.body, fontSize: 12, color: colors.gray400 },
  balanceWrap:  { alignItems: 'flex-end' },
  balance:      { fontFamily: Typography.bold, fontSize: 16, color: colors.green600 },
  balanceLabel: { fontFamily: Typography.body, fontSize: 11, color: colors.gray400 },

  overlay:      { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: colors.surface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, maxHeight: '90%' },
  modalHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  modalTitle:   { fontFamily: Typography.display, fontSize: 18, color: colors.gray900 },
  closeBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, alignItems: 'center', justifyContent: 'center' },
  modalBody:    { padding: 20, gap: 14 },

  photoRow:     { alignItems: 'center', marginBottom: 4 },

  profileRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  profileName:      { fontFamily: Typography.display, fontSize: 20, color: colors.gray900 },
  profilePhone:     { fontFamily: Typography.body, fontSize: 13, color: colors.gray400 },
  profileId:        { fontFamily: Typography.body, fontSize: 12, color: colors.gray400 },

  balanceSummary:   { backgroundColor: colors.gray50, borderRadius: Radius.sm, padding: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel:     { fontFamily: Typography.bold, fontSize: 10, color: colors.gray400, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  summaryAmount:    { fontFamily: Typography.display, fontSize: 26, color: colors.green600 },
  summaryDate:      { fontFamily: Typography.bold, fontSize: 14, color: colors.gray700 },

  detailsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 16 },
  detailItem:       { minWidth: '30%', gap: 4 },
  detailValue:      { fontFamily: Typography.semiBold, fontSize: 13, color: colors.gray900 },

  historyTitle:     { fontFamily: Typography.bold, fontSize: 12, color: colors.gray500, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  txnItem:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray50 },
  txnDate:          { fontFamily: Typography.semiBold, fontSize: 13, color: colors.gray700 },
  txnNote:          { fontFamily: Typography.body, fontSize: 11, color: colors.gray400 },
  txnAmt:           { fontFamily: Typography.bold, fontSize: 15 },

  actionBtn:        { marginTop: 16, marginBottom: 8 },
  modalButtons:     { flexDirection: 'row', gap: 10, marginTop: 8 },

  fieldLabel:   { fontFamily: Typography.bold, fontSize: 11, color: colors.gray500, letterSpacing: 1, marginBottom: 8 },
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

  collectorChip:     { borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: colors.gray100, marginRight: 8, alignItems: 'center' },
  collectorChipActive: { backgroundColor: colors.green600 },
  collectorChipText:   { fontFamily: Typography.bold, fontSize: 13, color: colors.gray700 },
  collectorChipTextActive: { color: colors.white },
  noCollectors:        { fontFamily: Typography.body, fontSize: 12, color: colors.gray400, paddingVertical: 10 },
});
}
