// ============================================================
// FILE 9: src/components/Avatar.js
// WHAT:  The circular initial-letter icon beside every name.
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

export default function Avatar({ initials = '?', size = 40, variant = 'green', style }) {
  const { colors, gradients } = useTheme();

  const bgMap = {
    dark:  colors.ink,
    gray:  colors.gray200,
    red:   colors.red,
  };
  const colorMap = {
    dark:  colors.white,
    gray:  colors.gray500,
    red:   colors.white,
  };

  const circleStyle = {
    width: size, height: size, borderRadius: size / 2,
  };
  const textStyle = [styles.initials, { fontSize: size * 0.36, color: colorMap[variant] || colors.white }];

  if (variant === 'green' || !bgMap[variant]) {
    return (
      <LinearGradient
        colors={gradients.primary}
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
