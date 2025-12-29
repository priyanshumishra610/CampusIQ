import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';

type RetryButtonProps = {
  onPress: () => void;
  message?: string;
  loading?: boolean;
};

const RetryButton = ({
  onPress,
  message = 'Failed to load. Tap to retry.',
  loading = false,
}: RetryButtonProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onPress}
        disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Retrying...' : 'Retry'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  message: {
    fontSize: 14,
    color: '#7a8a9a',
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default RetryButton;

