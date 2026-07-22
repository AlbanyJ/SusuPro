// ============================================================
// FILE 11: src/components/Button.js
// WHAT:   The main button used everywhere in the app.
// ============================================================
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, Radius } from '../constants/theme';
 
const variants = {
  primary:   { bg: Colors.green500, color: Colors.white },
  secondary: { bg: Colors.green50,  color: Colors.green600 },
  ghost:     { bg: 'transparent',   color: Colors.gray700 },
  danger:    { bg: Colors.redLight,  color: Colors.red },
};
 
export default function Button({
  label, onPress, variant = 'primary',
  size = 'md', fullWidth = false,
  disabled = false, loading = false, style,
}) {
  const v = variants[variant] || variants.primary;
  const padding = size === 'lg' ? 16 : size === 'sm' ? 8 : 13;
  const fontSize = size === 'lg' ? 16 : size === 'sm' ? 13 : 15;
 
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
      {loading
        ? <ActivityIndicator color={v.color} size="small" />
        : <Text style={[styles.label, { color: v.color, fontSize }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}
 
const styles = StyleSheet.create({
  btn:       { borderRadius: Radius.sm, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  fullWidth: { width: '100%' },
  disabled:  { opacity: 0.55 },
  label:     { fontFamily: Typography.bold, letterSpacing: 0.2 },
});