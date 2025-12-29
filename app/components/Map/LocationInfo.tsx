import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {CampusLocation} from './CampusMarker';

interface LocationInfoProps {
  location: CampusLocation | null;
  distance?: string;
  duration?: string;
  onClose: () => void;
  onGetDirections: () => void;
}

/**
 * Bottom sheet component showing location details
 */
export const LocationInfo: React.FC<LocationInfoProps> = ({
  location,
  distance,
  duration,
  onClose,
  onGetDirections,
}) => {
  if (!location) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.icon}>{location.icon}</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>{location.name}</Text>
            <Text style={styles.description}>{location.description}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color="#5a6a7a" />
        </TouchableOpacity>
      </View>

      {(distance || duration) && (
        <View style={styles.directionsInfo}>
          <Icon name="directions-walk" size={18} color="#1e3a5f" />
          <Text style={styles.directionsText}>
            {distance && `${distance} • `}
            {duration}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.directionsButton} onPress={onGetDirections}>
        <Icon name="directions" size={20} color="#fff" />
        <Text style={styles.directionsButtonText}>Get Directions</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: 200,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#d0d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    flex: 1,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#5a6a7a',
  },
  closeButton: {
    padding: 4,
  },
  directionsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f6f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  directionsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e3a5f',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});



