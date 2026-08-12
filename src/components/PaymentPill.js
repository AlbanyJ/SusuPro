// ============================================================
// src/components/PaymentPill.js
// WHAT:   Small colored tag showing how a customer pays —
//         Mobile Money (with network), Bank Transfer, or Cash.
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

const LABELS = {
  momo: 'MoMo',
  bank: 'Bank',
  cash: 'Cash',
};

const ICONS = {
  momo: 'phone-portrait-outline',
  bank: 'business-outline',
  cash: 'cash-outline',
};

export default function PaymentPill({ method = 'cash', network }) {
  const { colors } = useTheme();

  const config = {
    momo: { bg: colors.amberLight, color: colors.amber },
    bank: { bg: colors.blueLight,  color: colors.blue },
    cash: { bg: colors.green100,   color: colors.green600 },
  };
  const c = config[method] || config.cash;
  const label = method === 'momo' && network ? `${LABELS.momo} · ${network}` : (LABELS[method] || LABELS.cash);

  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <Ionicons name={ICONS[method] || ICONS.cash} size={11} color={c.color} />
      <Text style={[styles.text, { color: c.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: { fontFamily: Typography.semiBold, fontSize: 11, letterSpacing: 0.2 },
});
