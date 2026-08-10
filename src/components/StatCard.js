// ============================================================
// FILE 14: src/components/StatCard.js
// WHAT:   The summary boxes on the Dashboard (Total, Active, etc.)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Shadows } from '../constants/theme';

export default function StatCard({ label, value, sub, icon, accent = false }) {
  return (
    <View style={[styles.card, accent && styles.accent]}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
          <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
          {sub && <Text style={[styles.sub, accent && styles.subAccent]}>{sub}</Text>}
        </View>
        <View style={[styles.iconWrap, accent && styles.iconWrapAccent]}>
          <Ionicons name={icon} size={18} color={accent ? Colors.white : Colors.green600} />
        </View>
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  card:        { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md, padding: 16, ...Shadows.sm },
  accent:      { backgroundColor: Colors.green500 },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label:       { fontFamily: Typography.bold, fontSize: 10, color: Colors.gray400, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  labelAccent: { color: 'rgba(255,255,255,0.7)' },
  value:       { fontFamily: Typography.bold, fontSize: 20, color: Colors.gray900 },
  valueAccent: { color: Colors.white },
  sub:         { fontFamily: Typography.body, fontSize: 11, color: Colors.gray400, marginTop: 2 },
  subAccent:   { color: 'rgba(255,255,255,0.6)' },
  iconWrap:      { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.green50, alignItems: 'center', justifyContent: 'center' },
  iconWrapAccent:{ backgroundColor: 'rgba(255,255,255,0.15)' },
});