import React from 'react';
import {View, StyleSheet, Animated, Easing} from 'react-native';
import {Colors, BorderRadius, Spacing} from '../../theme/designTokens';

type SkeletonLoaderProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  variant?: 'default' | 'circular' | 'rounded';
};

/**
 * Enhanced SkeletonLoader with shimmer effect
 * Provides smooth loading animation for better UX
 */
const SkeletonLoader = ({
  width = '100%',
  height = 20,
  borderRadius = BorderRadius.base,
  style,
  variant = 'default',
}: SkeletonLoaderProps) => {
  const shimmerValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(0.3)).current;

  React.useEffect(() => {
    // Shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0.7,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityValue, {
            toValue: 0.3,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, [shimmerValue, opacityValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  const finalBorderRadius =
    variant === 'circular' ? height / 2 : variant === 'rounded' ? BorderRadius.lg : borderRadius;

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius: finalBorderRadius,
          overflow: 'hidden',
        },
        style,
      ]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity: opacityValue,
            transform: [{translateX}],
          },
        ]}
      />
    </View>
  );
};

export const SkeletonCard = () => (
  <View style={styles.cardContainer}>
    <SkeletonLoader width="60%" height={16} style={styles.title} />
    <SkeletonLoader width="100%" height={12} style={styles.line} />
    <SkeletonLoader width="80%" height={12} style={styles.line} />
  </View>
);

export const SkeletonList = ({count = 3}: {count?: number}) => (
  <View>
    {Array.from({length: count}).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
);

export const SkeletonDashboardCard = () => (
  <View style={styles.dashboardCard}>
    <SkeletonLoader width="40%" height={20} style={styles.dashboardTitle} />
    <SkeletonLoader width="60%" height={32} style={styles.dashboardValue} />
    <SkeletonLoader width="100%" height={12} style={styles.dashboardLabel} />
  </View>
);

export const SkeletonListItem = () => (
  <View style={styles.listItem}>
    <SkeletonLoader variant="circular" width={48} height={48} style={styles.avatar} />
    <View style={styles.listItemContent}>
      <SkeletonLoader width="70%" height={16} style={styles.listItemTitle} />
      <SkeletonLoader width="50%" height={12} style={styles.listItemSubtitle} />
    </View>
  </View>
);

export const SkeletonChart = () => (
  <View style={styles.chartContainer}>
    <SkeletonLoader width="100%" height={200} borderRadius={BorderRadius.md} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.border,
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.borderLight,
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    marginBottom: Spacing.md,
  },
  line: {
    marginBottom: Spacing.sm,
  },
  dashboardCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dashboardTitle: {
    marginBottom: Spacing.sm,
  },
  dashboardValue: {
    marginBottom: Spacing.sm,
  },
  dashboardLabel: {
    marginTop: Spacing.xs,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  avatar: {
    marginRight: Spacing.base,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    marginBottom: Spacing.xs,
  },
  listItemSubtitle: {
    marginTop: Spacing.xs,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
});

export default SkeletonLoader;

