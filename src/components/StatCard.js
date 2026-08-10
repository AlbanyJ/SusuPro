// ============================================================
// FILE 14: src/components/StatCard.js
// WHAT:   The summary boxes on the Dashboard (Total, Active, etc.)
//         accent=true renders a premium dark gradient card, used
//         for the single most important stat in a row.
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Shadows, Gradients } from '../constants/theme';

export default function StatCard({ label, value, sub, icon, accent = false }) {
  const content = (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
        <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
        {sub && <Text style={[styles.sub, accent && styles.subAccent]}>{sub}</Text>}
      </View>
      <View style={[styles.iconWrap, accent && styles.iconWrapAccent]}>
        <Ionicons name={icon} size={18} color={accent ? Colors.green300 : Colors.green600} />
      </View>
    </View>
  );

  if (accent) {
    return (
      <LinearGradient
        colors={Gradients.ink}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.accentCard]}
      >
        {content}
      </LinearGradient>
    );
  }

  return <View style={[styles.card, styles.lightCard]}>{content}</View>;
}

const styles = StyleSheet.create({
  card:        { flex: 1, borderRadius: Radius.md, padding: 16 },
  lightCard:   { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.gray50, ...Shadows.sm },
  accentCard:  { ...Shadows.md },
  row:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label:       { fontFamily: Typography.bold, fontSize: 10, color: Colors.gray400, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  labelAccent: { color: 'rgba(255,255,255,0.55)' },
  value:       { fontFamily: Typography.display, fontSize: 20, color: Colors.gray900 },
  valueAccent: { color: Colors.white },
  sub:         { fontFamily: Typography.body, fontSize: 11, color: Colors.gray400, marginTop: 2 },
  subAccent:   { color: 'rgba(255,255,255,0.5)' },
  iconWrap:      { width: 32, height: 32, borderRadius: Radius.sm, backgroundColor: Colors.green50, alignItems: 'center', justifyContent: 'center' },
  iconWrapAccent:{ backgroundColor: 'rgba(255,255,255,0.08)' },
});
