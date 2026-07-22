// ============================================================
// FILE 13: src/components/Input.js
// WHAT:   Text input field with label, used in all forms.
// ============================================================
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Typography, Radius } from '../constants/theme';
 
export default function Input({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', secureTextEntry = false,
  required = false, prefix, style,
}) {
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
          placeholderTextColor={Colors.gray400}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          style={[styles.input, prefix && styles.inputWithPrefix, style]}
        />
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  wrapper:        { gap: 6 },
  label:          { fontFamily: Typography.bold, fontSize: 11, color: Colors.gray500, letterSpacing: 1 },
  req:            { color: Colors.red },
  inputRow:       { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  prefix:         { position: 'absolute', left: 14, zIndex: 1, color: Colors.green500, fontFamily: Typography.bold, fontSize: 15 },
  input:          {
    flex: 1, borderWidth: 1.5, borderColor: Colors.gray200,
    borderRadius: Radius.sm, padding: 13, fontFamily: Typography.body,
    fontSize: 15, color: Colors.gray900, backgroundColor: Colors.white,
  },
  inputWithPrefix: { paddingLeft: 34 },
});