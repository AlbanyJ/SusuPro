// ============================================================
// FILE 9: src/components/Avatar.js
// WHAT:  The circular initial-letter icon beside every name.
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Gradients } from '../constants/theme';

export default function Avatar({ initials = '?', size = 40, variant = 'green', style }) {
  const bgMap = {
    dark:  Colors.ink,
    gray:  Colors.gray200,
    red:   Colors.red,
  };
  const colorMap = {
    dark:  Colors.white,
    gray:  Colors.gray500,
    red:   Colors.white,
  };

  const circleStyle = {
    width: size, height: size, borderRadius: size / 2,
  };
  const textStyle = [styles.initials, { fontSize: size * 0.36, color: colorMap[variant] || Colors.white }];

  if (variant === 'green' || !bgMap[variant]) {
    return (
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.avatar, circleStyle, style]}
      >
        <Text style={textStyle}>{initials}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.avatar, circleStyle, { backgroundColor: bgMap[variant] }, style]}>
      <Text style={textStyle}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar:   { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: Typography.bold, letterSpacing: 0.5 },
});
