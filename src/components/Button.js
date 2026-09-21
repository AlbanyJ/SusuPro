// ============================================================
// FILE 11: src/components/Button.js
// WHAT:   The main button used everywhere in the app.
// ============================================================
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Radius } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

export default function Button({
  label, onPress, variant = 'primary',
  size = 'md', fullWidth = false,
  disabled = false, loading = false, style,
}) {
  const { colors, gradients, shadows } = useTheme();

  const variants = {
    primary:   { gradient: gradients.primary, color: colors.white, shadow: shadows.glow },
    secondary: { bg: colors.gray100,  color: colors.gray700 },
    ghost:     { bg: 'transparent',   color: colors.gray700 },
    danger:    { gradient: gradients.red, color: colors.white, shadow: shadows.md },
  };

  const v = variants[variant] || variants.primary;
  const padding = size === 'lg' ? 17 : size === 'sm' ? 9 : 13;
  const fontSize = size === 'lg' ? 16 : size === 'sm' ? 13 : 15;

  const content = loading
    ? <ActivityIndicator color={v.color} size="small" />
    : <Text style={[styles.label, { color: v.color, fontSize }]}>{label}</Text>;

  if (v.gradient) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.gradientWrap,
          fullWidth && styles.fullWidth,
          !disabled && !loading && v.shadow,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={v.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, { paddingVertical: padding }]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.btn,
        { backgroundColor: v.bg, paddingVertical: padding },
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn:          { borderRadius: Radius.sm, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  gradientWrap: { borderRadius: Radius.sm },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.5 },
  label:     { fontFamily: Typography.bold, letterSpacing: 0.2 },
});
