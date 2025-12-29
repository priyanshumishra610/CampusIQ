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
import PermissionGate from '../../components/PermissionGate';
import EmptyState from '../../components/EmptyState';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

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
            <ActivityIndicator size="large" color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.sm * 1.5,
  },
  timeWindowContainer: {
    maxHeight: 48,
  },
  timeWindowContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  timeWindowButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    minHeight: 40,
  },
  timeWindowButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeWindowText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  timeWindowTextActive: {
    color: colors.textInverse,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.lg,
    color: colors.textSecondary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['3xl'],
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: fontSize.base * 1.6,
    fontWeight: fontWeight.medium,
    padding: spacing.lg,
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.error + '30',
    maxWidth: '90%',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'space-around',
    ...shadows.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hotspotsContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: Dimensions.get('window').height * 0.3,
    ...shadows.sm,
  },
  hotspotsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    letterSpacing: -0.1,
  },
  hotspotsList: {
    paddingHorizontal: spacing.lg,
  },
  hotspotItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  hotspotRank: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  hotspotRankText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  hotspotInfo: {
    flex: 1,
  },
  hotspotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  hotspotIntensityDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  hotspotCount: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs / 2,
  },
  hotspotCoords: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
    fontFamily: 'monospace',
  },
});

export default CrowdHeatmapScreen;



