// ============================================================
// FILE 9: src/components/Avatar.js
// WHAT:  The circular initial-letter icon beside every name.
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '../constants/theme';
 
export default function Avatar({ initials = '?', size = 40, variant = 'green', style }) {
  const bgMap = {
    green: Colors.green500,
    dark:  Colors.green700,
    gray:  Colors.gray200,
    red:   Colors.red,
  };
  const colorMap = {
    green: Colors.white,
    dark:  Colors.white,
    gray:  Colors.gray500,
    red:   Colors.white,
  };
  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: bgMap[variant] || bgMap.green },
      style,
    ]}>
      <Text style={[styles.initials, { fontSize: size * 0.36, color: colorMap[variant] || Colors.white }]}>
        {initials}
      </Text>
    </View>
  );
}
 
const styles = StyleSheet.create({
  avatar:   { alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: Typography.bold, letterSpacing: 0.5 },
});