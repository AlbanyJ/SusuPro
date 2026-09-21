// ============================================================
// FILE 12: src/components/Card.js
// WHAT:   The white rounded box that wraps content.
//         variant="dark" renders a deep ink gradient card for
//         premium/high-emphasis content (e.g. a hero stat).
// ============================================================
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

export default function Card({ children, style, variant = 'light' }) {
  const { colors, gradients, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(colors, shadows), [colors, shadows]);

  if (variant === 'dark') {
    return (
      <LinearGradient
        colors={gradients.ink}
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

function makeStyles(colors, shadows) {
  return StyleSheet.create({
    card: {
      borderRadius: Radius.md,
      padding: 18,
    },
    light: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.gray50,
      ...shadows.sm,
    },
    dark: {
      ...shadows.md,
    },
  });
}
