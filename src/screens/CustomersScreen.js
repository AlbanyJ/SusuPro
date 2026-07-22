// ============================================================
// FILE 18: src/screens/CustomersScreen.js
// WHAT:   Lists all customers. Admin can add/deactivate them.
//         Tap a customer to see their balance and history.
// ============================================================

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TextInput, TouchableOpacity, Modal, ScrollView, Alert,
} from 'react-native';
import { useApp, ACTIONS } from '../store/AppContext';
import { addCustomer, updateCustomer } from '../services/customerService';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/theme';

function fmt(n) { return `GHS ${Number(n).toLocaleString('en-GH')}`; }
function uid()  { return Math.random().toString(36).substr(2, 9); }

export default function CustomersScreen() {
  const { state, dispatch } = useApp();
  const { customers, transactions, currentUser } = state;
  const isAdmin = currentUser?.role === 'admin';

  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(false);

  // Add form state
  const [form, setForm] = useState({ name: '', phone: '', idNo: '' });

  // Filter customers by search query
  const filtered = useMemo(() =>
    customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    ), [customers, search]
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

  // ── Add new customer ──────────────────────────────────────
  async function handleAdd() {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert('Missing Info', 'Name and phone number are required.');
      return;
    }
    setLoading(true);

    // Build avatar initials from name
    const avatar = form.name.trim().split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const newCustomer = {
      id: uid(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      idNo: form.idNo.trim(),
      balance: 0,
      active: true,
      avatar,
      joinDate: new Date().toISOString().split('T')[0],
    };

    // Update global state immediately (optimistic update)
    dispatch({ type: ACTIONS.ADD_CUSTOMER, payload: newCustomer });

    // Also save to Firebase (in production)
    // await addCustomer(form, currentUser.id);

    setForm({ name: '', phone: '', idNo: '' });
    setShowAdd(false);
    setLoading(false);
  }

  // ── Toggle active/inactive ────────────────────────────────
  function handleToggleActive(customer) {
    const newStatus = !customer.active;
    dispatch({
      type: ACTIONS.UPDATE_CUSTOMER,
      payload: { id: customer.id, active: newStatus },
    });
    setSelected(prev => prev ? { ...prev, active: newStatus } : null);
  }

  return (
    <View style={styles.screen}>

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
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone…"
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* ── Customer List ── */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No customers found.</Text>
        }
        renderItem={({ item: c }) => (
          <TouchableOpacity activeOpacity={0.85} onPress={() => setSelected(c)}>
            <Card style={styles.customerCard}>
              <View style={styles.customerRow}>
                <Avatar initials={c.avatar} size={44} variant={c.active ? 'green' : 'gray'} />
                <View style={styles.customerInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.customerName}>{c.name}</Text>
                    <Badge label={c.active ? 'Active' : 'Inactive'} type={c.active ? 'success' : 'neutral'} />
                  </View>
                  <Text style={styles.customerMeta}>
                    {c.phone}{c.idNo ? ` · ${c.idNo}` : ''}
                  </Text>
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
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Profile */}
                <View style={styles.profileRow}>
                  <Avatar initials={selected.avatar} size={56} variant="green" />
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
                      <Text style={[styles.txnAmt, { color: t.type === 'contribution' ? Colors.green600 : Colors.red }]}>
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
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHead}>
              <Text style={styles.modalTitle}>Add New Customer</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Input label="Full Name" value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Akosua Mensah" required />
              <Input label="Phone Number" value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="e.g. 0244123456" keyboardType="phone-pad" required />
              <Input label="ID Number (Optional)" value={form.idNo} onChangeText={v => setForm(f => ({ ...f, idNo: v }))} placeholder="e.g. GHA-2341" />
              <View style={styles.modalButtons}>
                <Button label="Cancel" onPress={() => setShowAdd(false)} variant="ghost" style={{ flex: 1 }} />
                <Button label="Add Customer" onPress={handleAdd} loading={loading} style={{ flex: 1 }} />
              </View>
            </View>
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
  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50, borderRadius: Radius.sm, paddingHorizontal: 12, borderWidth: 1.5, borderColor: Colors.gray200 },
  searchIcon:   { fontSize: 16, marginRight: 8 },
  searchInput:  { flex: 1, paddingVertical: 12, fontFamily: Typography.body, fontSize: 15, color: Colors.gray900 },
  list:         { padding: Spacing.lg, gap: 8, paddingBottom: 80 },
  empty:        { textAlign: 'center', fontFamily: Typography.body, fontSize: 14, color: Colors.gray400, padding: 40 },

  customerCard: { padding: 14 },
  customerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerInfo: { flex: 1 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' },
  customerName: { fontFamily: Typography.bold, fontSize: 15, color: Colors.gray900 },
  customerMeta: { fontFamily: Typography.body, fontSize: 12, color: Colors.gray400 },
  balanceWrap:  { alignItems: 'flex-end' },
  balance:      { fontFamily: Typography.bold, fontSize: 16, color: Colors.green600 },
  balanceLabel: { fontFamily: Typography.body, fontSize: 11, color: Colors.gray400 },

  overlay:      { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)', justifyContent: 'flex-end' },
  modal:        { backgroundColor: Colors.white, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, maxHeight: '90%' },
  modalHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle:   { fontFamily: Typography.display, fontSize: 18, color: Colors.gray900 },
  closeBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  closeIcon:    { fontSize: 16, color: Colors.gray500 },
  modalBody:    { padding: 20, gap: 14 },

  profileRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  profileName:      { fontFamily: Typography.display, fontSize: 20, color: Colors.gray900 },
  profilePhone:     { fontFamily: Typography.body, fontSize: 13, color: Colors.gray400 },
  profileId:        { fontFamily: Typography.body, fontSize: 12, color: Colors.gray400 },

  balanceSummary:   { backgroundColor: Colors.green50, borderRadius: Radius.sm, padding: 16, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel:     { fontFamily: Typography.bold, fontSize: 10, color: Colors.gray400, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  summaryAmount:    { fontFamily: Typography.display, fontSize: 26, color: Colors.green600 },
  summaryDate:      { fontFamily: Typography.bold, fontSize: 14, color: Colors.gray700 },

  historyTitle:     { fontFamily: Typography.bold, fontSize: 12, color: Colors.gray500, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  txnItem:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray50 },
  txnDate:          { fontFamily: Typography.semiBold, fontSize: 13, color: Colors.gray700 },
  txnNote:          { fontFamily: Typography.body, fontSize: 11, color: Colors.gray400 },
  txnAmt:           { fontFamily: Typography.bold, fontSize: 15 },

  actionBtn:        { marginTop: 16, marginBottom: 8 },
  modalButtons:     { flexDirection: 'row', gap: 10, marginTop: 8 },
});