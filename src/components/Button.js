// ============================================================
// FILE 11: src/components/Button.js
// WHAT:   The main button used everywhere in the app.
// ============================================================
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Shadows, Gradients } from '../constants/theme';

const variants = {
  primary:   { gradient: Gradients.primary, color: Colors.white, shadow: Shadows.glow },
  secondary: { bg: Colors.green50,  color: Colors.green600 },
  ghost:     { bg: 'transparent',   color: Colors.gray700 },
  danger:    { gradient: Gradients.red, color: Colors.white, shadow: Shadows.md },
};

export default function Button({
  label, onPress, variant = 'primary',
  size = 'md', fullWidth = false,
  disabled = false, loading = false, style,
}) {
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
