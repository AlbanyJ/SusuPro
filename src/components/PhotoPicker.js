// ============================================================
// src/components/PhotoPicker.js
// WHAT:   Tappable circular photo — shows the picked/existing
//         photo, or initials as a fallback. Tapping opens a
//         camera-or-gallery choice. Only picks a LOCAL uri —
//         the caller is responsible for uploading it (via
//         storageService.uploadCustomerPhoto) and saving the
//         resulting URL, since a brand-new customer doesn't have
//         an id to upload against until it's been created.
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../constants/theme';
import { useTheme } from '../store/ThemeContext';

export default function PhotoPicker({ uri, initials = '?', size = 72, onPick, disabled = false }) {
  const { colors, gradients } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function pickFrom(source) {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        `SusuPro needs ${source === 'camera' ? 'camera' : 'photo library'} access to set a profile picture.`
      );
      return;
    }

    const launch = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await launch({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      onPick(result.assets[0].uri);
    }
  }

  function handlePress() {
    if (disabled) return;
    Alert.alert('Profile Photo', 'Choose a source', [
      { text: 'Take Photo', onPress: () => pickFrom('camera') },
      { text: 'Choose from Library', onPress: () => pickFrom('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  const circleStyle = { width: size, height: size, borderRadius: size / 2 };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={uri ? 'Change profile photo' : 'Add profile photo'}
    >
      <View style={[styles.wrap, circleStyle]}>
        {uri ? (
          <Image source={{ uri }} style={[styles.image, circleStyle]} />
        ) : (
          <View style={[styles.fallback, circleStyle, { backgroundColor: gradients.primary[1] }]}>
            <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
          </View>
        )}
        {!disabled && (
          <View style={styles.badge}>
            <Ionicons name="camera" size={14} color={colors.white} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(colors) {
  return StyleSheet.create({
    wrap:      { position: 'relative' },
    image:     { resizeMode: 'cover' },
    fallback:  { alignItems: 'center', justifyContent: 'center' },
    initials:  { fontFamily: Typography.bold, color: colors.white, letterSpacing: 0.5 },
    badge:     {
      position: 'absolute', bottom: -2, right: -2,
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: colors.green600, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: colors.surface,
    },
  });
}
