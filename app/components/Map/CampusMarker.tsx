import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Marker} from 'react-native-maps';

export interface CampusLocation {
  id: string;
  name: string;
  description: string;
  coordinate: {latitude: number; longitude: number};
  type: string;
  icon: string;
}

interface CampusMarkerProps {
  location: CampusLocation;
  onPress: (location: CampusLocation) => void;
  selected?: boolean;
}

/**
 * Custom marker component for campus locations
 */
export const CampusMarker: React.FC<CampusMarkerProps> = ({
  location,
  onPress,
  selected = false,
}) => {
  return (
    <Marker
      coordinate={location.coordinate}
      onPress={() => onPress(location)}
      anchor={{x: 0.5, y: 0.5}}>
      <View style={[styles.markerContainer, selected && styles.markerSelected]}>
        <Icon name={location.icon} size={24} color="#1e3a5f" />
        {selected && <View style={styles.markerPulse} />}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    borderColor: '#64b5f6',
    transform: [{scale: 1.2}],
  },
  markerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#64b5f6',
    opacity: 0.3,
    transform: [{scale: 1.5}],
  },
});



