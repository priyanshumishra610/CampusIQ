/**
 * Premium Card Component
 * Clean, minimalist card with subtle shadows and hover states
 */

import React from 'react';
import {View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp} from 'react-native';
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated';
import {useTheme} from '../../theme/ThemeContext';
import {Spacing, BorderRadius, Shadows} from '../../theme/designTokens';

type PremiumCardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof Spacing;
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  padding = 'base',
}) => {
  const {colors} = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
    };
  });

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      padding: Spacing[padding],
    },
    variant === 'elevated' && {
      ...Shadows.lg,
      borderWidth: 0,
    },
    variant === 'outlined' && {
      borderWidth: 1,
      ...Shadows.sm,
    },
    variant === 'default' && {
      ...Shadows.base,
      borderWidth: 0,
    },
    style,
  ];

  if (onPress) {
    return (
      <AnimatedTouchable
        style={[cardStyle, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        accessibilityRole="button">
        {children}
      </AnimatedTouchable>
    );
  }

  return <AnimatedView style={cardStyle}>{children}</AnimatedView>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
});

