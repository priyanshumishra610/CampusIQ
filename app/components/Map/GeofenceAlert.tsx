import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Modal, TouchableOpacity, Animated} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Vibration} from 'react-native';

interface GeofenceAlertProps {
  visible: boolean;
  zoneName: string;
  severity: 'low' | 'medium' | 'high';
  onDismiss: () => void;
}

/**
 * Geo-Fence Alert Component
 * Displays alert when restricted zone is breached
 */
export const GeofenceAlert: React.FC<GeofenceAlertProps> = ({
  visible,
  zoneName,
  severity,
  onDismiss,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger vibration if supported
      if (Vibration.vibrate) {
        Vibration.vibrate(500); // Vibrate for 500ms
      }

      // Animate alert appearance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const getSeverityColor = () => {
    switch (severity) {
      case 'high':
        return '#c0392b';
      case 'medium':
        return '#e67e22';
      case 'low':
        return '#f39c12';
      default:
        return '#c0392b';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'info-outline';
      default:
        return 'warning';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.alertContainer,
            {
              transform: [{scale: scaleAnim}],
              opacity: opacityAnim,
              borderColor: getSeverityColor(),
            },
          ]}>
          <View style={[styles.iconContainer, {backgroundColor: getSeverityColor()}]}>
            <Icon name={getSeverityIcon()} size={32} color="#fff" />
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>Geo-Fence Active</Text>
          </View>

          <Text style={styles.alertTitle}>Restricted Zone Breach Detected</Text>
          <Text style={styles.zoneName}>{zoneName}</Text>
          <Text style={styles.alertMessage}>
            Unauthorized entry detected in restricted area. Please proceed with caution.
          </Text>

          <TouchableOpacity style={[styles.dismissButton, {backgroundColor: getSeverityColor()}]} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Acknowledge</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c1222',
    textAlign: 'center',
    marginBottom: 8,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 14,
    color: '#5a6a7a',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  dismissButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  dismissButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});



