import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import MapView, {Polygon, Circle, PROVIDER_GOOGLE, MapType} from 'react-native-maps';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  CAMPUS_COORDINATES,
  CAMPUS_BOUNDARY,
  CAMPUS_LOCATIONS,
  MAP_SETTINGS,
  RESTRICTED_ZONES,
  generateHeatmapData,
  HeatmapMode,
  EMERGENCY_LOCATIONS,
  ENABLE_MAP_INTRO,
  MAP_INTRO_CONFIG,
} from '../../config/maps.config';
import {
  getDirections,
  isWithinCampusBounds,
  checkGeofenceBreach,
  findNearestEmergencyLocation,
  pushGeofenceNotification,
  getCurrentLocation,
} from '../../services/maps.service';
import {MapControls} from '../../components/Map/MapControls';
import {CampusMarker, CampusLocation} from '../../components/Map/CampusMarker';
import {LocationInfo} from '../../components/Map/LocationInfo';
import {GeofenceAlert} from '../../components/Map/GeofenceAlert';
import {HeatmapLayer} from '../../components/Map/HeatmapLayer';
import {EmergencyPanel} from '../../components/Map/EmergencyPanel';
import {EmptyState} from '../../components/Common';

const {width, height} = Dimensions.get('window');

/**
 * Comprehensive Campus Map Screen
 * Features:
 * - Campus boundary polygon
 * - Restricted map scrolling
 * - Satellite/Map/Hybrid toggle
 * - Campus location markers
 * - Radius selection tool
 * - Search functionality
 * - Directions with distance/time
 * - 3D view support (iOS)
 */
const CampusMapScreen = () => {
  const mapRef = useRef<MapView>(null);
  const [mapType, setMapType] = useState<MapType>('standard');
  const [selectedLocation, setSelectedLocation] = useState<CampusLocation | null>(null);
  const [radiusMode, setRadiusMode] = useState(false);
  const [radiusCenter, setRadiusCenter] = useState<{latitude: number; longitude: number} | null>(
    null,
  );
  const [radius, setRadius] = useState(100); // meters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CampusLocation[]>([]);
  const [directionsInfo, setDirectionsInfo] = useState<{distance?: string; duration?: string}>({});
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // New Feature States
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [geofenceAlert, setGeofenceAlert] = useState<{
    zoneName: string;
    severity: 'low' | 'medium' | 'high';
  } | null>(null);
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>(null);
  const [heatmapData, setHeatmapData] = useState<Array<{latitude: number; longitude: number; intensity: number}>>([]);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [nearestEmergency, setNearestEmergency] = useState<{
    location: typeof EMERGENCY_LOCATIONS[0];
    distance: number;
  } | null>(null);
  const [introAnimationDone, setIntroAnimationDone] = useState(!ENABLE_MAP_INTRO);

  // Main gate coordinates (for directions)
  const mainGate = CAMPUS_LOCATIONS.find(loc => loc.id === 'security-gate')?.coordinate;

  // Google Earth Style Fly-Through Intro Animation
  useEffect(() => {
    if (mapRef.current && mapReady && !introAnimationDone && ENABLE_MAP_INTRO) {
      // Start zoomed out with tilt
      const startRegion = {
        ...CAMPUS_COORDINATES,
        latitudeDelta: MAP_INTRO_CONFIG.startZoom,
        longitudeDelta: MAP_INTRO_CONFIG.startZoom,
      };

      mapRef.current.animateToRegion(startRegion, 0);

      // Animate to final position with smooth transition
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              ...CAMPUS_COORDINATES,
              latitudeDelta: MAP_INTRO_CONFIG.endZoom,
              longitudeDelta: MAP_INTRO_CONFIG.endZoom,
            },
            MAP_INTRO_CONFIG.duration,
          );

          // Add slight rotation if iOS (using animateToCamera if available)
          if (Platform.OS === 'ios' && mapRef.current) {
            setTimeout(() => {
              if (mapRef.current) {
                // Use animateToCamera for rotation (if available)
                try {
                  mapRef.current.animateToCamera(
                    {
                      center: CAMPUS_COORDINATES,
                      zoom: 17,
                      pitch: MAP_INTRO_CONFIG.startPitch,
                      heading: MAP_INTRO_CONFIG.rotation,
                    },
                    {duration: 1000},
                  );
                  setTimeout(() => {
                    if (mapRef.current) {
                      mapRef.current.animateToCamera(
                        {
                          center: CAMPUS_COORDINATES,
                          zoom: 17,
                          pitch: MAP_INTRO_CONFIG.endPitch,
                          heading: 0,
                        },
                        {duration: 1000},
                      );
                    }
                  }, 500);
                } catch (e) {
                  // Fallback if animateToCamera not available
                  console.log('Camera animation not available');
                }
              }
            }, MAP_INTRO_CONFIG.duration / 2);
          }
        }
      }, 100);

      setIntroAnimationDone(true);
    } else if (mapRef.current && mapReady && introAnimationDone) {
      // Normal initialization without animation
      mapRef.current.animateToRegion(
        {
          ...CAMPUS_COORDINATES,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000,
      );
    }
  }, [mapReady, introAnimationDone]);

  // Generate heatmap data when mode changes
  useEffect(() => {
    if (heatmapMode) {
      const data = generateHeatmapData(heatmapMode);
      setHeatmapData(data);
    } else {
      setHeatmapData([]);
    }
  }, [heatmapMode]);

  // Geo-fence monitoring
  useEffect(() => {
    if (!geofenceEnabled) return;

    const interval = setInterval(async () => {
      try {
        const currentLocation = await getCurrentLocation();
        if (currentLocation) {
          const coord = {latitude: currentLocation.lat, longitude: currentLocation.lng};
          const breach = checkGeofenceBreach(coord, RESTRICTED_ZONES);
          
          if (breach && (!geofenceAlert || geofenceAlert.zoneName !== breach.name)) {
            setGeofenceAlert({
              zoneName: breach.name,
              severity: breach.severity,
            });
            
            // Future-ready: Push notification
            await pushGeofenceNotification(
              breach.id,
              breach.name,
              breach.severity,
              coord,
            );
          }
        }
      } catch (error) {
        console.warn('Geo-fence monitoring error:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [geofenceEnabled, geofenceAlert]);

  // Emergency mode: Find nearest critical location
  useEffect(() => {
    if (emergencyMode) {
      const findNearest = async () => {
        try {
          const currentLocation = await getCurrentLocation();
          if (currentLocation) {
            const coord = {latitude: currentLocation.lat, longitude: currentLocation.lng};
            const nearest = findNearestEmergencyLocation(coord, EMERGENCY_LOCATIONS);
            if (nearest) {
              setNearestEmergency(nearest);
              
              // Calculate directions
              const directions = await getDirections(coord, nearest.location.coordinate);
              if (directions) {
                setDirectionsInfo({
                  distance: directions.distance,
                  duration: directions.duration,
                });
              }

              // Zoom to emergency area
              if (mapRef.current) {
                mapRef.current.animateToRegion(
                  {
                    ...nearest.location.coordinate,
                    latitudeDelta: 0.003,
                    longitudeDelta: 0.003,
                  },
                  1000,
                );
              }
            }
          }
        } catch (error) {
          console.warn('Emergency mode error:', error);
        }
      };
      findNearest();
    } else {
      setNearestEmergency(null);
      setDirectionsInfo({});
    }
  }, [emergencyMode]);

  // Handle map region change to restrict scrolling
  const handleRegionChangeComplete = useCallback(
    (region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }) => {
      const center = {latitude: region.latitude, longitude: region.longitude};

      // Check if center is outside campus bounds
      if (!isWithinCampusBounds(center, MAP_SETTINGS.bounds)) {
        // Snap back to campus center
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              ...CAMPUS_COORDINATES,
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            },
            500,
          );
        }
      }
    },
    [],
  );

  // Handle location marker press
  const handleLocationPress = useCallback(
    async (location: CampusLocation) => {
      setSelectedLocation(location);

      // Calculate directions from main gate if available
      if (mainGate) {
        setLoading(true);
        const directions = await getDirections(mainGate, location.coordinate);
        if (directions) {
          setDirectionsInfo({
            distance: directions.distance,
            duration: directions.duration,
          });
        }
        setLoading(false);
      }
    },
    [mainGate],
  );

  // Reset map view to campus center
  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...CAMPUS_COORDINATES,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        1000,
      );
    }
    setSelectedLocation(null);
    setRadiusMode(false);
    setRadiusCenter(null);
  }, []);

  // Toggle radius selection mode
  const handleToggleRadius = useCallback(() => {
    setRadiusMode(!radiusMode);
    if (radiusMode) {
      setRadiusCenter(null);
    }
  }, [radiusMode]);

  // Handle map press for radius selection
  const handleMapPress = useCallback(
    (e: {nativeEvent: {coordinate: {latitude: number; longitude: number}}}) => {
      if (radiusMode) {
        const coord = e.nativeEvent.coordinate;
        if (isWithinCampusBounds(coord, MAP_SETTINGS.bounds)) {
          setRadiusCenter(coord);
        } else {
          Alert.alert('Out of Bounds', 'Please select a location within the campus area.');
        }
      }
    },
    [radiusMode],
  );

  // Search campus locations
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const filtered = CAMPUS_LOCATIONS.filter(
      loc =>
        loc.name.toLowerCase().includes(query.toLowerCase()) ||
        loc.description.toLowerCase().includes(query.toLowerCase()),
    );
    setSearchResults(filtered);
  }, []);

  // Select search result
  const handleSelectSearchResult = useCallback(
    (location: CampusLocation) => {
      setSearchQuery('');
      setSearchResults([]);
      handleLocationPress(location);
      if (mapRef.current) {
        mapRef.current.animateToCoordinate(location.coordinate, 1000);
      }
    },
    [handleLocationPress],
  );

  // Get directions to selected location
  const handleGetDirections = useCallback(() => {
    if (!selectedLocation || !mainGate) {
      return;
    }

    Alert.alert(
      'Directions',
      `Navigate from Main Gate to ${selectedLocation.name}\n\n${directionsInfo.distance || 'Calculating...'} • ${directionsInfo.duration || 'Calculating...'}`,
      [{text: 'OK'}],
    );
  }, [selectedLocation, mainGate, directionsInfo]);

  // Convert map type string to MapType
  const getMapType = (type: string): MapType => {
    switch (type) {
      case 'satellite':
        return 'satellite';
      case 'hybrid':
        return 'hybrid';
      case 'terrain':
        return 'terrain';
      default:
        return 'standard';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Campus Map</Text>
          <Text style={styles.subtitle}>
            {CAMPUS_LOCATIONS.length} key locations • Interactive navigation
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#5a6a7a" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search campus locations..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close" size={20} color="#5a6a7a" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <View style={styles.searchResults}>
          {searchResults.map(location => (
            <TouchableOpacity
              key={location.id}
              style={styles.searchResultItem}
              onPress={() => handleSelectSearchResult(location)}>
              <View style={styles.searchResultIconContainer}>
                <Icon name={location.icon} size={20} color="#1e3a5f" />
              </View>
              <View style={styles.searchResultText}>
                <Text style={styles.searchResultName}>{location.name}</Text>
                <Text style={styles.searchResultDesc}>{location.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        {mapError ? (
          <View style={styles.errorOverlay}>
            <Icon name="error-outline" size={48} color="#c0392b" />
            <Text style={styles.errorTitle}>Map Loading Error</Text>
            <Text style={styles.errorText}>{mapError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setMapError(null);
                setMapReady(false);
                // Force map reload
                if (mapRef.current) {
                  mapRef.current.animateToRegion(
                    {
                      ...CAMPUS_COORDINATES,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    },
                    1000,
                  );
                }
              }}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : !mapReady ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#1e3a5f" />
            <Text style={styles.loadingText}>Loading campus map...</Text>
          </View>
        ) : null}

        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            ...CAMPUS_COORDINATES,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          mapType={getMapType(mapType)}
          onMapReady={() => {
            setMapReady(true);
            setMapError(null);
          }}
          onError={(error) => {
            console.error('Map error:', error);
            setMapError('Failed to load map. Please check your internet connection and API key configuration.');
          }}
          onPress={handleMapPress}
          onRegionChangeComplete={handleRegionChangeComplete}
          minZoomLevel={MAP_SETTINGS.minZoom}
          maxZoomLevel={MAP_SETTINGS.maxZoom}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          pitchEnabled={Platform.OS === 'ios'} // 3D view on iOS
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          loadingEnabled={true}
          loadingIndicatorColor="#1e3a5f"
          // Restrict map bounds
          region={{
            ...CAMPUS_COORDINATES,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}>
          {/* Campus Boundary Polygon */}
          <Polygon
            coordinates={CAMPUS_BOUNDARY}
            fillColor="rgba(30, 58, 95, 0.15)"
            strokeColor="#1e3a5f"
            strokeWidth={2}
          />

          {/* Campus Location Markers */}
          {CAMPUS_LOCATIONS.map(location => (
            <CampusMarker
              key={location.id}
              location={location}
              onPress={handleLocationPress}
              selected={selectedLocation?.id === location.id}
            />
          ))}

          {/* Radius Circle */}
          {radiusMode && radiusCenter && (
            <Circle
              center={radiusCenter}
              radius={radius}
              fillColor="rgba(100, 181, 246, 0.2)"
              strokeColor="#64b5f6"
              strokeWidth={2}
            />
          )}

          {/* Restricted Zones (Geo-Fence) */}
          {geofenceEnabled &&
            RESTRICTED_ZONES.map(zone => {
              if (zone.type === 'polygon' && zone.coordinates) {
                return (
                  <Polygon
                    key={zone.id}
                    coordinates={zone.coordinates}
                    fillColor="rgba(192, 57, 43, 0.3)"
                    strokeColor="#c0392b"
                    strokeWidth={2}
                  />
                );
              } else if (zone.type === 'circle' && zone.center && zone.radius) {
                return (
                  <Circle
                    key={zone.id}
                    center={zone.center}
                    radius={zone.radius}
                    fillColor="rgba(192, 57, 43, 0.3)"
                    strokeColor="#c0392b"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            })}

          {/* Heatmap Layer */}
          <HeatmapLayer mode={heatmapMode} data={heatmapData} />

          {/* Emergency Mode: Highlight Critical Locations */}
          {emergencyMode &&
            EMERGENCY_LOCATIONS.map(location => (
              <CampusMarker
                key={`emergency-${location.id}`}
                location={{
                  id: location.id,
                  name: location.name,
                  description: location.type === 'medical' ? 'Medical assistance' : location.type === 'security' ? 'Security office' : 'Main exit',
                  coordinate: location.coordinate,
                  type: location.type,
                  icon: location.type === 'medical' ? 'local-hospital' : location.type === 'security' ? 'security' : 'exit-to-app',
                }}
                onPress={handleLocationPress}
                selected={nearestEmergency?.location.id === location.id}
              />
            ))}
        </MapView>

        {/* Map Controls */}
        <MapControls
          mapType={mapType}
          onMapTypeChange={setMapType}
          onResetView={handleResetView}
          onToggleRadius={handleToggleRadius}
          radiusMode={radiusMode}
          heatmapMode={heatmapMode}
          onToggleHeatmap={setHeatmapMode}
          geofenceEnabled={geofenceEnabled}
          onToggleGeofence={() => setGeofenceEnabled(!geofenceEnabled)}
          emergencyMode={emergencyMode}
          onToggleEmergency={() => setEmergencyMode(!emergencyMode)}
        />

        {/* Radius Info */}
        {radiusMode && radiusCenter && (
          <View style={styles.radiusInfo}>
            <Text style={styles.radiusText}>
              Radius: {radius}m • Tap map to change center
            </Text>
            <View style={styles.radiusControls}>
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={() => setRadius(Math.max(50, radius - 50))}>
                <Icon name="remove" size={20} color="#1e3a5f" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={() => setRadius(Math.min(500, radius + 50))}>
                <Icon name="add" size={20} color="#1e3a5f" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Location Info Bottom Sheet */}
      {selectedLocation && (
        <LocationInfo
          location={selectedLocation}
          distance={directionsInfo.distance}
          duration={directionsInfo.duration}
          onClose={() => {
            setSelectedLocation(null);
            setDirectionsInfo({});
          }}
          onGetDirections={handleGetDirections}
        />
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#1e3a5f" />
        </View>
      )}

      {/* Geo-Fence Alert */}
      <GeofenceAlert
        visible={geofenceAlert !== null}
        zoneName={geofenceAlert?.zoneName || ''}
        severity={geofenceAlert?.severity || 'medium'}
        onDismiss={() => setGeofenceAlert(null)}
      />

      {/* Emergency Panel */}
      <EmergencyPanel
        visible={emergencyMode}
        nearestLocation={nearestEmergency?.location || null}
        distance={directionsInfo.distance}
        duration={directionsInfo.duration}
        onNavigate={() => {
          if (nearestEmergency && mapRef.current) {
            mapRef.current.animateToCoordinate(nearestEmergency.location.coordinate, 1000);
          }
        }}
        onNotifySecurity={() => {
          Alert.alert('Security Notified', 'Security team has been alerted and will respond shortly.');
        }}
        onClose={() => setEmergencyMode(false)}
      />

      {/* Geo-Fence Badge */}
      {geofenceEnabled && (
        <View style={styles.geofenceBadge}>
          <Icon name="fence" size={16} color="#fff" />
          <Text style={styles.geofenceBadgeText}>Geo-Fence Active</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c1222',
  },
  subtitle: {
    fontSize: 13,
    color: '#5a6a7a',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0c1222',
    padding: 0,
  },
  searchResults: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f6f9',
  },
  searchResultIconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0c1222',
    marginBottom: 2,
  },
  searchResultDesc: {
    fontSize: 12,
    color: '#5a6a7a',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: width,
    height: height,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5a6a7a',
    fontWeight: '600',
  },
  radiusInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  radiusText: {
    fontSize: 13,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  radiusControls: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f6f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    top: 100,
    right: 16,
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 1000,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0c1222',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#5a6a7a',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  geofenceBadge: {
    position: 'absolute',
    top: 80,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  geofenceBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default CampusMapScreen;
