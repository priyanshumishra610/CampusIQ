/**
 * Premium Metric Tile Component
 * Displays key metrics with proper text wrapping and premium styling
 */

import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../theme/ThemeContext';
import {Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';
import {PremiumCard} from './PremiumCard';

type MetricTileProps = {
  value: string | number;
  label: string;
  icon?: string; // MaterialIcons icon name
  iconType?: 'vector' | 'emoji'; // Default to 'vector'
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'highlight' | 'alert';
  onPress?: () => void;
  style?: ViewStyle;
};

export const MetricTile: React.FC<MetricTileProps> = ({
  value,
  label,
  icon,
  iconType = 'vector',
  trend,
  variant = 'default',
  onPress,
  style,
}) => {
  const {colors} = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'highlight':
        return {
          backgroundColor: colors.primaryAccent + '10',
          borderColor: colors.primaryAccent + '30',
        };
      case 'alert':
        return {
          backgroundColor: colors.errorLight,
          borderColor: colors.error + '30',
        };
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <PremiumCard
      onPress={onPress}
      variant="outlined"
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
        },
        style,
      ]}>
      {icon && (
        <View style={styles.iconContainer}>
          {iconType === 'vector' ? (
            <Icon
              name={icon}
              size={26}
              color={variant === 'alert' ? colors.error : colors.primaryAccent}
            />
          ) : (
            <Text style={styles.icon}>{icon}</Text>
          )}
        </View>
      )}
      <Text
        style={[
          styles.value,
          {
            color: variant === 'alert' ? colors.error : colors.textPrimary,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit>
        {value}
      </Text>
      <Text
        style={[styles.label, {color: colors.textMuted}]}
        numberOfLines={2}
        ellipsizeMode="tail">
        {label}
      </Text>
      {trend && (
        <View style={styles.trendContainer}>
          <Text style={[styles.trendIcon, {color: colors.textTertiary}]}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </Text>
        </View>
      )}
    </PremiumCard>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    padding: Spacing.base,
  },
  iconContainer: {
    marginBottom: Spacing.xs,
  },
  icon: {
    fontSize: 24,
  },
  value: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize.xs,
  },
  trendContainer: {
    marginTop: Spacing.xs,
  },
  trendIcon: {
    fontSize: Typography.fontSize.sm,
  },
});

