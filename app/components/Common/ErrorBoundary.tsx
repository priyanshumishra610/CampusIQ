import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors, Typography, Spacing, BorderRadius} from '../../theme/designTokens';
import {logError} from '../../utils/debugLogger';

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
  showDetails?: boolean;
};

type State = {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
};

/**
 * Enhanced ErrorBoundary with better error reporting and UI
 * Catches React component errors and displays user-friendly error messages
 */
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // #region agent log
    logError('ErrorBoundary.tsx:33', error, {componentStack: errorInfo?.componentStack?.substring(0, 200)}, 'F');
    // #endregion
    this.setState({errorInfo});
    // In production, you might want to log this to an error reporting service
    // Example: Sentry.captureException(error, {extra: errorInfo});
  }

  handleReset = () => {
    this.setState({hasError: false, error: undefined, errorInfo: undefined});
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const {error, errorInfo} = this.state;
      const showDetails = this.props.showDetails && __DEV__;

      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.iconContainer}>
              <Icon name="error-outline" size={48} color={Colors.error} />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {error?.message || 'An unexpected error occurred. Please try again.'}
            </Text>

            {showDetails && errorInfo && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Error Details (Dev Only)</Text>
                <Text style={styles.detailsText}>{error?.stack}</Text>
                <Text style={styles.detailsText}>{errorInfo.componentStack}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  // Optionally reload the app or navigate to home
                  this.handleReset();
                }}>
                <Text style={styles.buttonTextSecondary}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    maxWidth: 300,
  },
  detailsContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  detailsText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: Spacing.xs,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: Spacing.md,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  buttonTextSecondary: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default ErrorBoundary;

