/**
 * Premium Action Button Component
 * Responsive button with smooth interactions and premium styling
 */

import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle} from 'react-native';
import {useTheme} from '../../theme/ThemeContext';
import {Typography, Spacing, BorderRadius} from '../../theme/designTokens';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
  style?: ViewStyle;
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
}) => {
  const {colors} = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          textColor: colors.textInverse,
        };
      case 'secondary':
        return {
          backgroundColor: colors.primaryAccent,
          borderColor: colors.primaryAccent,
          textColor: colors.textInverse,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          textColor: colors.textPrimary,
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
          textColor: colors.textInverse,
        };
      case 'success':
        return {
          backgroundColor: colors.success,
          borderColor: colors.success,
          textColor: colors.textInverse,
        };
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          textColor: colors.textInverse,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.base,
          fontSize: Typography.fontSize.sm,
        };
      case 'lg':
        return {
          paddingVertical: Spacing.lg,
          paddingHorizontal: Spacing.xl,
          fontSize: Typography.fontSize.lg,
        };
      default:
        return {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          fontSize: Typography.fontSize.base,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: disabled || loading ? 0.6 : 1,
          width: fullWidth ? '100%' : 'auto',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
          style={styles.loader}
        />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: variantStyles.textColor,
              fontSize: sizeStyles.fontSize,
            },
          ]}>
          {icon && `${icon} `}
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    fontWeight: Typography.fontWeight.semibold,
  },
  label: {
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
  },
  loader: {
    marginRight: Spacing.xs,
  },
});

