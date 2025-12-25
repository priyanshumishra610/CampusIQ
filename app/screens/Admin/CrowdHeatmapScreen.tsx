/**
 * 🔥 Crowd Intelligence & Heatmap Screen
 * 
 * Admin-only screen displaying real-time crowd density heatmap.
 * 
 * Features:
 * - Google Maps heatmap overlay showing crowd density
 * - Time-based filtering (15 min / 1 hr / today)
 * - Hotspot identification
 * - Privacy-preserving (aggregated data only, no individual tracking)
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import MapView, {Heatmap, PROVIDER_GOOGLE} from 'react-native-maps';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {getHeatmapData} from '../../services/crowdIntelligence.service';
import {PermissionGate, EmptyState} from '../../components/Common';

type TimeWindow = '15min' | '1hr' | 'today';

interface HeatmapCell {
  geohash: string;
  lat: number;
  lng: number;
  count: number;
  lastUpdated: any;
  timeWindow: string;
}

const CrowdHeatmapScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('15min');
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  // Default campus location (adjust to your campus coordinates)
  const DEFAULT_REGION = {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const loadHeatmapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getHeatmapData(timeWindow);
      setHeatmapData(result.cells || []);
    } catch (err: any) {
      console.error('Error loading heatmap data:', err);
      setError(err.message || 'Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeatmapData();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadHeatmapData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [timeWindow]);

  // Convert heatmap cells to Google Maps heatmap format
  const heatmapPoints = heatmapData.map(cell => ({
    latitude: cell.lat,
    longitude: cell.lng,
    weight: Math.min(cell.count / 10, 1.0), // Normalize weight (0-1)
  }));

  // Find hotspots (cells with highest density)
  const hotspots = [...heatmapData]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(cell => ({
      ...cell,
      intensity: cell.count > 20 ? 'high' : cell.count > 10 ? 'medium' : 'low',
    }));

  const getTimeWindowLabel = (window: TimeWindow): string => {
    switch (window) {
      case '15min':
        return 'Last 15 min';
      case '1hr':
        return 'Last 1 hour';
      case 'today':
        return 'Today';
      default:
        return window;
    }
  };

  const getIntensityColor = (intensity: string): string => {
    switch (intensity) {
      case 'high':
        return '#c0392b';
      case 'medium':
        return '#e67e22';
      default:
        return '#f39c12';
    }
  };

  return (
    <PermissionGate permissions={['crowd:view']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Crowd Intelligence</Text>
          <Text style={styles.subtitle}>
            Real-time crowd density heatmap
          </Text>
        </View>

        {/* Time Window Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeWindowContainer}
          contentContainerStyle={styles.timeWindowContent}>
          {(['15min', '1hr', 'today'] as TimeWindow[]).map(window => (
            <TouchableOpacity
              key={window}
              onPress={() => setTimeWindow(window)}
              style={[
                styles.timeWindowButton,
                timeWindow === window && styles.timeWindowButtonActive,
              ]}>
              <Text
                style={[
                  styles.timeWindowText,
                  timeWindow === window && styles.timeWindowTextActive,
                ]}>
                {getTimeWindowLabel(window)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Map with Heatmap Overlay */}
        {loading && heatmapData.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e3a5f" />
            <Text style={styles.loadingText}>Loading heatmap data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              onPress={loadHeatmapData}
              style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : heatmapData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              variant="campus-stable"
              customMessage="No crowd data available for the selected time window."
            />
          </View>
        ) : (
          <>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={DEFAULT_REGION}
              showsUserLocation={false}
              showsMyLocationButton={false}>
              {heatmapPoints.length > 0 && (
                <Heatmap
                  points={heatmapPoints}
                  radius={50}
                  opacity={0.7}
                  gradient={{
                    colors: ['#00ff00', '#ffff00', '#ff0000'],
                    startPoints: [0.2, 0.5, 1.0],
                    colorMapSize: 256,
                  }}
                />
              )}
            </MapView>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{heatmapData.length}</Text>
                <Text style={styles.statLabel}>Hotspots</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {heatmapData.reduce((sum, cell) => sum + cell.count, 0)}
                </Text>
                <Text style={styles.statLabel}>Total Signals</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {hotspots.length > 0 ? hotspots[0].count : 0}
                </Text>
                <Text style={styles.statLabel}>Peak Density</Text>
              </View>
            </View>

            {/* Hotspots List */}
            {hotspots.length > 0 && (
              <View style={styles.hotspotsContainer}>
                <Text style={styles.hotspotsTitle}>Top Hotspots</Text>
                <ScrollView style={styles.hotspotsList}>
                  {hotspots.map((hotspot, index) => (
                    <View key={hotspot.geohash} style={styles.hotspotItem}>
                      <View style={styles.hotspotRank}>
                        <Text style={styles.hotspotRankText}>#{index + 1}</Text>
                      </View>
                      <View style={styles.hotspotInfo}>
                        <View style={styles.hotspotHeader}>
                          <View
                            style={[
                              styles.hotspotIntensityDot,
                              {backgroundColor: getIntensityColor(hotspot.intensity)},
                            ]}
                          />
                          <Text style={styles.hotspotCount}>
                            {hotspot.count} devices
                          </Text>
                        </View>
                        <Text style={styles.hotspotCoords}>
                          {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}
      </View>
    </PermissionGate>
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
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0c1222',
  },
  subtitle: {
    fontSize: 13,
    color: '#5a6a7a',
    marginTop: 2,
  },
  timeWindowContainer: {
    maxHeight: 50,
  },
  timeWindowContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  timeWindowButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4dce6',
    backgroundColor: '#fff',
  },
  timeWindowButtonActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  timeWindowText: {
    color: '#3a4a5a',
    fontWeight: '600',
    fontSize: 13,
  },
  timeWindowTextActive: {
    color: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#5a6a7a',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e4e8ec',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e3a5f',
  },
  statLabel: {
    fontSize: 11,
    color: '#5a6a7a',
    marginTop: 4,
    fontWeight: '500',
  },
  hotspotsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e4e8ec',
    maxHeight: Dimensions.get('window').height * 0.3,
  },
  hotspotsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    padding: 16,
    paddingBottom: 8,
  },
  hotspotsList: {
    paddingHorizontal: 16,
  },
  hotspotItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  hotspotRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f6f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hotspotRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e3a5f',
  },
  hotspotInfo: {
    flex: 1,
  },
  hotspotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hotspotIntensityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  hotspotCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c1222',
  },
  hotspotCoords: {
    fontSize: 12,
    color: '#5a6a7a',
  },
});

export default CrowdHeatmapScreen;

