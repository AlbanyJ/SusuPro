// ============================================================
// FILE 12: src/components/Card.js
// WHAT:   The white rounded box that wraps content.
//         variant="dark" renders a deep ink gradient card for
//         premium/high-emphasis content (e.g. a hero stat).
// ============================================================
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadows, Gradients } from '../constants/theme';

export default function Card({ children, style, variant = 'light' }) {
  if (variant === 'dark') {
    return (
      <LinearGradient
        colors={Gradients.ink}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.dark, style]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, styles.light, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    padding: 18,
  },
  light: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gray50,
    ...Shadows.sm,
  },
  dark: {
    ...Shadows.md,
  },
});
