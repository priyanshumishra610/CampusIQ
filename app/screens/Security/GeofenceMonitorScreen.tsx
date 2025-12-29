import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {EmptyState, SkeletonList} from '../../components/Common';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';
import moment from 'moment';

interface GeofenceBreach {
  id: string;
  studentId: string;
  studentName: string;
  zoneName: string;
  breachType: 'ENTRY' | 'EXIT';
  timestamp: number;
  location: {latitude: number; longitude: number};
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  resolved: boolean;
}

const GeofenceMonitorScreen = ({navigation}: any) => {
  const {user} = useSelector((state: RootState) => state.auth);
  const [breaches, setBreaches] = useState<GeofenceBreach[]>([]);
  const [loading, setLoading] = useState(false);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNRESOLVED' | 'HIGH'>('ALL');

  useEffect(() => {
    if (monitoringEnabled) {
      loadBreaches();
      const interval = setInterval(loadBreaches, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [monitoringEnabled]);

  const loadBreaches = async () => {
    setLoading(true);
    try {
      // Mock data - replace with actual Firestore query
      const mockBreaches: GeofenceBreach[] = [
        {
          id: '1',
          studentId: 'student-1',
          studentName: 'John Doe',
          zoneName: 'Restricted Area A',
          breachType: 'ENTRY',
          timestamp: Date.now() - 300000,
          location: {latitude: 28.7041, longitude: 77.1025},
          severity: 'HIGH',
          resolved: false,
        },
        {
          id: '2',
          studentId: 'student-2',
          studentName: 'Jane Smith',
          zoneName: 'Parking Zone',
          breachType: 'EXIT',
          timestamp: Date.now() - 600000,
          location: {latitude: 28.7051, longitude: 77.1035},
          severity: 'MEDIUM',
          resolved: false,
        },
      ];

      setBreaches(mockBreaches);
    } catch (error) {
      console.error('Error loading geofence breaches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBreaches = breaches.filter(breach => {
    if (filter === 'UNRESOLVED') return !breach.resolved;
    if (filter === 'HIGH') return breach.severity === 'HIGH';
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return Colors.error;
      case 'MEDIUM':
        return Colors.warning;
      default:
        return Colors.info;
    }
  };

  const renderBreach = ({item}: {item: GeofenceBreach}) => {
    const timeAgo = moment(item.timestamp).fromNow();
    const severityColor = getSeverityColor(item.severity);

    return (
      <TouchableOpacity
        style={[
          styles.breachCard,
          !item.resolved && styles.breachCardActive,
          item.severity === 'HIGH' && styles.breachCardHigh,
        ]}>
        <View style={styles.breachHeader}>
          <View style={styles.breachHeaderLeft}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.studentId}>{item.studentId}</Text>
          </View>
          <View style={[styles.severityBadge, {backgroundColor: `${severityColor}15`}]}>
            <Text style={[styles.severityText, {color: severityColor}]}>
              {item.severity}
            </Text>
          </View>
        </View>

        <View style={styles.breachBody}>
          <View style={styles.breachInfoRow}>
            <Text style={styles.breachLabel}>Zone:</Text>
            <Text style={styles.breachValue}>{item.zoneName}</Text>
          </View>
          <View style={styles.breachInfoRow}>
            <Text style={styles.breachLabel}>Type:</Text>
            <Text style={styles.breachValue}>
              {item.breachType === 'ENTRY' ? 'Unauthorized Entry' : 'Unauthorized Exit'}
            </Text>
          </View>
          <View style={styles.breachInfoRow}>
            <Text style={styles.breachLabel}>Time:</Text>
            <Text style={styles.breachValue}>{timeAgo}</Text>
          </View>
        </View>

        {!item.resolved && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Navigate to student location
                navigation.navigate('StudentLocation', {
                  studentId: item.studentId,
                  location: item.location,
                });
              }}>
              <Text style={styles.actionButtonText}>View Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonResolve]}
              onPress={() => {
                // Mark as resolved
                setBreaches(prev =>
                  prev.map(b => (b.id === item.id ? {...b, resolved: true} : b)),
                );
              }}>
              <Text style={styles.actionButtonText}>Resolve</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const unresolvedCount = breaches.filter(b => !b.resolved).length;
  const highSeverityCount = breaches.filter(b => b.severity === 'HIGH' && !b.resolved).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Geo-fence Monitor</Text>
        <Text style={styles.headerSubtitle}>
          {unresolvedCount} active breach{unresolvedCount !== 1 ? 'es' : ''}
        </Text>

        <View style={styles.monitorToggle}>
          <Text style={styles.toggleLabel}>Monitoring</Text>
          <Switch
            value={monitoringEnabled}
            onValueChange={setMonitoringEnabled}
            trackColor={{false: Colors.border, true: Colors.primary}}
            thumbColor={Colors.surface}
          />
        </View>

        {highSeverityCount > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerText}>
              🚨 {highSeverityCount} high severity breach{highSeverityCount !== 1 ? 'es' : ''} require immediate attention
            </Text>
          </View>
        )}
      </View>

      <View style={styles.filters}>
        {(['ALL', 'UNRESOLVED', 'HIGH'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && breaches.length === 0 ? (
        <SkeletonList count={5} />
      ) : (
        <FlatList
          data={filteredBreaches}
          keyExtractor={item => item.id}
          renderItem={renderBreach}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              variant="no-incidents"
              customTitle="No breaches detected"
              customMessage={
                monitoringEnabled
                  ? 'No geo-fence breaches at this time'
                  : 'Monitoring is disabled'
              }
            />
          }
          refreshing={loading}
          onRefresh={loadBreaches}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryAccentLight,
    marginBottom: Spacing.md,
  },
  monitorToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.md,
  },
  toggleLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textInverse,
  },
  alertBanner: {
    padding: Spacing.base,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  alertBannerText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
  },
  filters: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  filterTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    padding: Spacing.base,
  },
  breachCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.base,
  },
  breachCardActive: {
    borderColor: Colors.warning,
    borderWidth: 2,
  },
  breachCardHigh: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  breachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  breachHeaderLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  studentName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  studentId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.base,
  },
  severityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  breachBody: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  breachInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breachLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    width: 80,
  },
  breachValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  actionButtonResolve: {
    backgroundColor: Colors.success,
  },
  actionButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default GeofenceMonitorScreen;

