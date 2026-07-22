// ============================================================
// FILE 15: src/components/Toast.js
// WHAT:   The popup notification ("Saved!", "Error!", etc.)
// ============================================================
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Radius, Shadows } from '../constants/theme';
 
export default function Toast({ message, type = 'success', onHide }) {
  const opacity = new Animated.Value(0);
 
  useEffect(() => {
    // Fade in
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    // Fade out after 3 seconds
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(onHide);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
 
  const bgMap = {
    success: Colors.green600,
    error:   Colors.red,
    info:    Colors.green500,
  };
 
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
 
  return (
    <Animated.View style={[styles.toast, { backgroundColor: bgMap[type], opacity }]}>
      <Text style={styles.icon}>{icons[type]}</Text>
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}
 
const styles = StyleSheet.create({
  toast: {
    position: 'absolute', top: 60, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: Radius.sm, paddingHorizontal: 20, paddingVertical: 12,
    maxWidth: '90%', zIndex: 9999, ...Shadows.lg,
  },
  icon:    { color: Colors.white, fontFamily: Typography.bold, fontSize: 16 },
  message: { color: Colors.white, fontFamily: Typography.medium, fontSize: 14, flexShrink: 1 },
});
 