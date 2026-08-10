// ============================================================
// FILE 10: src/components/Badge.js
// WHAT:   The small colored label (Active, Withdrawn, etc.)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

export default function Badge({ label, type = 'success' }) {
  const { colors } = useTheme();

  const config = {
    success: { bg: colors.green100, color: colors.green600 },
    danger:  { bg: colors.redLight,  color: colors.red },
    warning: { bg: colors.amberLight, color: colors.amber },
    neutral: { bg: colors.gray100,   color: colors.gray500 },
  };
  const c = config[type] || config.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3 },
  text:  { fontFamily: Typography.semiBold, fontSize: 11, letterSpacing: 0.4 },
});
