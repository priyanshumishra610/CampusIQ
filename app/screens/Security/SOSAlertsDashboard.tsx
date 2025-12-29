import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchIncidents,
  updateIncident,
  IncidentStatus,
} from '../../redux/slices/securitySlice';
import {EmptyState, SkeletonList, RetryButton} from '../../components/Common';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';
import moment from 'moment';

const SOSAlertsDashboard = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {incidents, loading, error} = useSelector((state: RootState) => state.security);

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  useEffect(() => {
    dispatch(fetchIncidents({}) as any);
  }, [dispatch]);

  const sosIncidents = incidents.filter(
    i => i.type === 'SOS' || i.severity === 'CRITICAL',
  );

  const filteredIncidents = sosIncidents.filter(incident => {
    if (filter === 'ALL') return true;
    if (filter === 'ACTIVE') return incident.status === 'ACTIVE';
    if (filter === 'RESOLVED') return incident.status === 'RESOLVED';
    return true;
  });

  const handleRespond = async (incidentId: string) => {
    Alert.alert(
      'Respond to SOS',
      'Mark this incident as investigating?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Investigate',
          onPress: async () => {
            await dispatch(
              updateIncident({
                incidentId,
                status: 'INVESTIGATING',
                resolvedBy: user?.id,
              }) as any,
            );
          },
        },
      ],
    );
  };

  const handleResolve = async (incidentId: string) => {
    Alert.alert(
      'Resolve SOS',
      'Mark this incident as resolved?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Resolve',
          onPress: async () => {
            await dispatch(
              updateIncident({
                incidentId,
                status: 'RESOLVED',
                resolvedBy: user?.id,
              }) as any,
            );
          },
        },
      ],
    );
  };

  const renderIncident = ({item}: {item: typeof incidents[0]}) => {
    const timeAgo = moment(item.createdAt).fromNow();
    const isActive = item.status === 'ACTIVE';

    return (
      <TouchableOpacity
        style={[
          styles.incidentCard,
          isActive && styles.incidentCardActive,
        ]}
        onPress={() => navigation.navigate('IncidentDetail', {incidentId: item.id})}>
        <View style={styles.incidentHeader}>
          <View style={styles.incidentHeaderLeft}>
            <Text style={styles.incidentType}>🚨 {item.type}</Text>
            <Text style={styles.incidentDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          {isActive && (
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
            </View>
          )}
        </View>

        {item.location && (
          <Text style={styles.location}>📍 {item.location}</Text>
        )}

        <View style={styles.incidentFooter}>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
          <View
            style={[
              styles.severityBadge,
              {backgroundColor: `${getSeverityColor(item.severity)}15`},
            ]}>
            <Text
              style={[styles.severityText, {color: getSeverityColor(item.severity)}]}>
              {item.severity}
            </Text>
          </View>
        </View>

        {isActive && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonInvestigate]}
              onPress={() => handleRespond(item.id)}>
              <Text style={styles.actionButtonText}>Respond</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonResolve]}
              onPress={() => handleResolve(item.id)}>
              <Text style={styles.actionButtonText}>Resolve</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return Colors.error;
      case 'HIGH':
        return Colors.warning;
      default:
        return Colors.textMuted;
    }
  };

  const activeCount = sosIncidents.filter(i => i.status === 'ACTIVE').length;

  if (loading && sosIncidents.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SOS Alerts</Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error && sosIncidents.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SOS Alerts</Text>
        </View>
        <RetryButton onPress={() => dispatch(fetchIncidents({}) as any)} message={error} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SOS Alerts Dashboard</Text>
        <Text style={styles.headerSubtitle}>
          {activeCount} active alert{activeCount !== 1 ? 's' : ''}
        </Text>
        {activeCount > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertBannerText}>
              ⚠️ {activeCount} active emergency{activeCount !== 1 ? 's' : ''} require immediate attention
            </Text>
          </View>
        )}
      </View>

      <View style={styles.filters}>
        {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map(f => (
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

      <FlatList
        data={filteredIncidents}
        keyExtractor={item => item.id}
        renderItem={renderIncident}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            variant="no-incidents"
            customTitle="No SOS alerts"
            customMessage="No emergency alerts at this time"
          />
        }
        refreshing={loading}
        onRefresh={() => dispatch(fetchIncidents({}) as any)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    backgroundColor: Colors.error,
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
    color: Colors.textInverse,
    opacity: 0.9,
  },
  alertBanner: {
    marginTop: Spacing.md,
    padding: Spacing.base,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.base,
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
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    padding: Spacing.base,
  },
  incidentCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.base,
  },
  incidentCardActive: {
    borderColor: Colors.error,
    borderWidth: 2,
    backgroundColor: Colors.errorLight,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  incidentHeaderLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  incidentType: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  incidentDescription: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  activeBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textInverse,
  },
  location: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timeAgo: {
    fontSize: Typography.fontSize.xs,
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
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  actionButtonInvestigate: {
    backgroundColor: Colors.warning,
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

export default SOSAlertsDashboard;

