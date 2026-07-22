// ============================================================
// FILE 10: src/components/Badge.js
// WHAT:   The small colored label (Active, Withdrawn, etc.)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../constants/theme';
 
const config = {
  success: { bg: Colors.green100, color: Colors.green600 },
  danger:  { bg: Colors.redLight,  color: Colors.red },
  warning: { bg: Colors.amberLight, color: Colors.amber },
  neutral: { bg: Colors.gray100,   color: Colors.gray500 },
};
 
export default function Badge({ label, type = 'success' }) {
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