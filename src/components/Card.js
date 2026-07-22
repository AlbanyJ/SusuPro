// ============================================================
// FILE 12: src/components/Card.js
// WHAT:   The white rounded box that wraps content.
// ============================================================
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Radius, Shadows } from '../constants/theme';
 
export default function Card({ children, style }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}
 
const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: 18,
    ...Shadows.sm,
  },
});