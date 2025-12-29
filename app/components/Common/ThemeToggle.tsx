/**
 * Theme Toggle Component
 * Allows users to switch between light/dark/system theme
 */

import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {Typography, Spacing, BorderRadius} from '../../theme/designTokens';

export const ThemeToggle: React.FC = () => {
  const {theme, themeMode, setThemeMode, toggleTheme, colors} = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.toggleButton, {backgroundColor: colors.surface, borderColor: colors.border}]}
        onPress={toggleTheme}
        activeOpacity={0.7}>
        <Icon
          name={theme === 'dark' ? 'dark-mode' : 'light-mode'}
          size={20}
          color={colors.textPrimary}
        />
        <Text style={[styles.toggleText, {color: colors.textSecondary}]}>
          {theme === 'dark' ? 'Dark' : 'Light'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.sm,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  toggleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});

