import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

type MapType = 'standard' | 'satellite' | 'hybrid' | 'terrain';
export type HeatmapMode = 'event-footfall' | 'library-density' | null;

interface MapControlsProps {
  mapType: MapType;
  onMapTypeChange: (type: MapType) => void;
  onResetView: () => void;
  onToggleRadius: () => void;
  radiusMode: boolean;
  heatmapMode: HeatmapMode;
  onToggleHeatmap: (mode: HeatmapMode) => void;
  geofenceEnabled: boolean;
  onToggleGeofence: () => void;
  emergencyMode: boolean;
  onToggleEmergency: () => void;
}

/**
 * Map control buttons for changing map type and other controls
 */
export const MapControls: React.FC<MapControlsProps> = ({
  mapType,
  onMapTypeChange,
  onResetView,
  onToggleRadius,
  radiusMode,
  heatmapMode,
  onToggleHeatmap,
  geofenceEnabled,
  onToggleGeofence,
  emergencyMode,
  onToggleEmergency,
}) => {
  const handleHeatmapToggle = () => {
    if (heatmapMode === null) {
      onToggleHeatmap('event-footfall');
    } else if (heatmapMode === 'event-footfall') {
      onToggleHeatmap('library-density');
    } else {
      onToggleHeatmap(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Type Toggle */}
      <View style={styles.mapTypeContainer}>
        <TouchableOpacity
          style={[styles.button, mapType === 'standard' && styles.buttonActive]}
          onPress={() => onMapTypeChange('standard')}>
          <Icon name="map" size={18} color={mapType === 'standard' ? '#fff' : '#5a6a7a'} />
          <Text style={[styles.buttonText, mapType === 'standard' && styles.buttonTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, mapType === 'satellite' && styles.buttonActive]}
          onPress={() => onMapTypeChange('satellite')}>
          <Icon name="satellite" size={18} color={mapType === 'satellite' ? '#fff' : '#5a6a7a'} />
          <Text style={[styles.buttonText, mapType === 'satellite' && styles.buttonTextActive]}>
            Satellite
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, mapType === 'hybrid' && styles.buttonActive]}
          onPress={() => onMapTypeChange('hybrid')}>
          <Icon name="layers" size={18} color={mapType === 'hybrid' ? '#fff' : '#5a6a7a'} />
          <Text style={[styles.buttonText, mapType === 'hybrid' && styles.buttonTextActive]}>
            Hybrid
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={onResetView}>
          <Icon name="my-location" size={20} color="#1e3a5f" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, radiusMode && styles.actionButtonActive]}
          onPress={onToggleRadius}>
          <Icon name="radio-button-unchecked" size={20} color={radiusMode ? '#fff' : '#1e3a5f'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, heatmapMode !== null && styles.actionButtonActive]}
          onPress={handleHeatmapToggle}>
          <Icon
            name="whatshot"
            size={20}
            color={heatmapMode !== null ? '#fff' : '#1e3a5f'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, geofenceEnabled && styles.actionButtonActive]}
          onPress={onToggleGeofence}>
          <Icon
            name="fence"
            size={20}
            color={geofenceEnabled ? '#fff' : '#1e3a5f'}
          />
        </TouchableOpacity>
      </View>

      {/* Emergency Mode Button */}
      <TouchableOpacity
        style={[styles.emergencyButton, emergencyMode && styles.emergencyButtonActive]}
        onPress={onToggleEmergency}>
        <Icon name="warning" size={20} color={emergencyMode ? '#fff' : '#c0392b'} />
        <Text
          style={[
            styles.emergencyButtonText,
            emergencyMode && styles.emergencyButtonTextActive,
          ]}>
          Emergency
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1000,
  },
  mapTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  buttonActive: {
    backgroundColor: '#1e3a5f',
  },
  buttonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#5a6a7a',
  },
  buttonTextActive: {
    color: '#fff',
  },
  actionContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonActive: {
    backgroundColor: '#1e3a5f',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#c0392b',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emergencyButtonActive: {
    backgroundColor: '#c0392b',
  },
  emergencyButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#c0392b',
  },
  emergencyButtonTextActive: {
    color: '#fff',
  },
});

