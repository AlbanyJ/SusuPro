// ============================================================
// FILE 13: src/components/Input.js
// WHAT:   Text input field with label, used in all forms.
// ============================================================
import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Typography, Radius } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

export default function Input({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', secureTextEntry = false,
  required = false, prefix, style,
}) {
  const [focused, setFocused] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text style={styles.label}>
          {label.toUpperCase()}
          {required && <Text style={styles.req}> *</Text>}
        </Text>
      )}
      <View style={styles.inputRow}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray400}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            focused && styles.inputFocused,
            prefix && styles.inputWithPrefix,
            style,
          ]}
        />
      </View>
    </View>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    wrapper:        { gap: 6 },
    label:          { fontFamily: Typography.bold, fontSize: 11, color: colors.gray500, letterSpacing: 1 },
    req:            { color: colors.red },
    inputRow:       { flexDirection: 'row', alignItems: 'center', position: 'relative' },
    prefix:         { position: 'absolute', left: 14, zIndex: 1, color: colors.gray700, fontFamily: Typography.bold, fontSize: 15 },
    input:          {
      flex: 1, borderWidth: 1.5, borderColor: 'transparent',
      borderRadius: Radius.sm, padding: 13, fontFamily: Typography.body,
      fontSize: 15, color: colors.gray900, backgroundColor: colors.gray50,
    },
    inputFocused:   {
      borderColor: colors.green500, backgroundColor: colors.surfaceAlt,
      shadowColor: colors.green500, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15, shadowRadius: 6, elevation: 2,
    },
    inputWithPrefix: { paddingLeft: 34 },
  });
}
