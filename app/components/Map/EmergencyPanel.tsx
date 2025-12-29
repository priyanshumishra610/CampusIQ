import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {EmergencyLocation} from '../../config/maps.config';

interface EmergencyPanelProps {
  visible: boolean;
  nearestLocation: EmergencyLocation | null;
  distance?: string;
  duration?: string;
  onNavigate: () => void;
  onNotifySecurity: () => void;
  onClose: () => void;
}

/**
 * Emergency Panel Component
 * Displays critical locations and quick actions during emergency mode
 */
export const EmergencyPanel: React.FC<EmergencyPanelProps> = ({
  visible,
  nearestLocation,
  distance,
  duration,
  onNavigate,
  onNotifySecurity,
  onClose,
}) => {
  if (!visible) return null;

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return 'local-hospital';
      case 'security':
        return 'security';
      case 'exit':
        return 'exit-to-app';
      default:
        return 'place';
    }
  };

  const getLocationColor = (type: string) => {
    switch (type) {
      case 'medical':
        return '#c0392b';
      case 'security':
        return '#1e3a5f';
      case 'exit':
        return '#27ae60';
      default:
        return '#5a6a7a';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, {backgroundColor: '#c0392b'}]}>
            <Icon name="warning" size={24} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Emergency Mode</Text>
            <Text style={styles.headerSubtitle}>Critical locations highlighted</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#5a6a7a" />
        </TouchableOpacity>
      </View>

      {nearestLocation && (
        <View style={styles.nearestSection}>
          <Text style={styles.nearestLabel}>Nearest Critical Point</Text>
          <View style={styles.nearestCard}>
            <View
              style={[
                styles.locationIcon,
                {backgroundColor: getLocationColor(nearestLocation.type)},
              ]}>
              <Icon name={getLocationIcon(nearestLocation.type)} size={20} color="#fff" />
            </View>
            <View style={styles.nearestInfo}>
              <Text style={styles.nearestName}>{nearestLocation.name}</Text>
              {(distance || duration) && (
                <Text style={styles.nearestDistance}>
                  {distance && `${distance} • `}
                  {duration}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.primaryAction} onPress={onNavigate}>
          <Icon name="directions" size={24} color="#fff" />
          <Text style={styles.primaryActionText}>Navigate Now</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryAction} onPress={onNotifySecurity}>
          <Icon name="notifications-active" size={20} color="#1e3a5f" />
          <Text style={styles.secondaryActionText}>Notify Security</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 300,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0c1222',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#5a6a7a',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  nearestSection: {
    marginBottom: 16,
  },
  nearestLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a6a7a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nearestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f6f9',
    padding: 12,
    borderRadius: 10,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nearestInfo: {
    flex: 1,
  },
  nearestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 4,
  },
  nearestDistance: {
    fontSize: 13,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  actionsSection: {
    gap: 10,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c0392b',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f6f9',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    gap: 8,
  },
  secondaryActionText: {
    color: '#1e3a5f',
    fontSize: 15,
    fontWeight: '600',
  },
});



