import React, {useEffect, useMemo, useState} from 'react';
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
  triggerEmergencyAlert,
  IncidentStatus,
  IncidentType,
} from '../../redux/slices/securitySlice';
import {EmptyState, SkeletonList, RetryButton, PremiumCard, MetricTile, ActionButton} from '../../components/Common';
import {useTheme} from '../../theme/ThemeContext';
import {Typography, Spacing, BorderRadius} from '../../theme/designTokens';

const SecurityDashboard = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {colors} = useTheme();
  const {user} = useSelector((state: RootState) => state.auth);
  const {incidents, summary, loading, error} = useSelector(
    (state: RootState) => state.security,
  );

  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'ALL'>('ALL');

  useEffect(() => {
    dispatch(fetchIncidents({}) as any);
  }, [dispatch]);

  const filteredIncidents = useMemo(() => {
    if (statusFilter === 'ALL') return incidents;
    return incidents.filter(i => i.status === statusFilter);
  }, [incidents, statusFilter]);

  const handleStatusChange = async (incidentId: string, newStatus: IncidentStatus) => {
    if (!user) return;
    dispatch(
      updateIncident({
        incidentId,
        status: newStatus,
        resolvedBy: user.id,
      }) as any,
    );
  };

  const handleEmergency = () => {
    Alert.alert(
      'Trigger Emergency',
      'Select emergency type',
      [
        {text: 'SOS', onPress: () => triggerEmergency('SOS')},
        {text: 'Fire', onPress: () => triggerEmergency('FIRE')},
        {text: 'Medical', onPress: () => triggerEmergency('MEDICAL')},
        {text: 'Security Breach', onPress: () => triggerEmergency('SECURITY_BREACH')},
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };

  const triggerEmergency = async (type: 'SOS' | 'FIRE' | 'MEDICAL' | 'SECURITY_BREACH') => {
    if (!user) return;
    dispatch(
      triggerEmergencyAlert({
        type,
        location: 'Campus',
        description: `Emergency alert triggered by ${user.name}`,
        triggeredBy: user.id,
        triggeredByName: user.name,
      }) as any,
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return colors.error;
      case 'HIGH':
        return colors.warning;
      case 'MEDIUM':
        return colors.info;
      default:
        return colors.textMuted;
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'ACTIVE':
        return colors.error;
      case 'INVESTIGATING':
        return colors.warning;
      case 'RESOLVED':
        return colors.success;
      default:
        return colors.textMuted;
    }
  };

  const renderIncident = ({item}: {item: typeof incidents[0]}) => {
    const severityColor = getSeverityColor(item.severity);
    const statusColor = getStatusColor(item.status);

    return (
      <PremiumCard
        variant="outlined"
        style={styles.card}
        onPress={() => navigation.navigate('IncidentDetail', {incidentId: item.id})}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.type, {color: colors.textMuted}]}>
              {item.type.replace('_', ' ')}
            </Text>
            <Text style={[styles.description, {color: colors.textPrimary}]} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
          <View style={[styles.severityBadge, {backgroundColor: severityColor + '15'}]}>
            <Text style={[styles.severityText, {color: severityColor}]}>
              {item.severity}
            </Text>
          </View>
        </View>
        {item.location && (
          <Text style={[styles.location, {color: colors.textTertiary}]}>
            📍 {item.location}
          </Text>
        )}
        <View style={[styles.cardFooter, {borderTopColor: colors.border}]}>
          <View style={[styles.statusBadge, {backgroundColor: statusColor + '15'}]}>
            <Text style={[styles.statusText, {color: statusColor}]}>
              {item.status}
            </Text>
          </View>
          <Text style={[styles.date, {color: colors.textMuted}]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.status === 'ACTIVE' && (
          <View style={styles.actions}>
            <ActionButton
              label="Investigate"
              onPress={() => handleStatusChange(item.id, 'INVESTIGATING')}
              variant="secondary"
              size="sm"
              style={styles.actionButton}
            />
            <ActionButton
              label="Resolve"
              onPress={() => handleStatusChange(item.id, 'RESOLVED')}
              variant="success"
              size="sm"
              style={styles.actionButton}
            />
          </View>
        )}
      </PremiumCard>
    );
  };

  const handleRetry = () => {
    dispatch(fetchIncidents({}) as any);
  };

  if (loading && incidents.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <Text style={styles.headerTitle}>Security Dashboard</Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error && incidents.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <Text style={styles.headerTitle}>Security Dashboard</Text>
        </View>
        <RetryButton onPress={handleRetry} message={error} />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <Text style={styles.headerTitle}>Security Dashboard</Text>
        <Text style={[styles.headerSubtitle, {color: colors.primaryAccentLight}]}>
          Monitor and manage security incidents
        </Text>
        {summary && (
          <View style={styles.summaryRow}>
            <MetricTile
              value={summary.active}
              label="Active"
              variant={summary.active > 0 ? 'alert' : 'default'}
              style={styles.summaryTile}
            />
            <MetricTile
              value={summary.resolved}
              label="Resolved"
              variant="default"
              style={styles.summaryTile}
            />
            <MetricTile
              value={summary.critical}
              label="Critical"
              variant={summary.critical > 0 ? 'alert' : 'default'}
              style={styles.summaryTile}
            />
            <MetricTile
              value={summary.total}
              label="Total"
              variant="default"
              style={styles.summaryTile}
            />
          </View>
        )}
        <ActionButton
          label="🚨 Trigger Emergency"
          onPress={handleEmergency}
          variant="danger"
          size="md"
          style={styles.emergencyButton}
        />
      </View>

      <View style={[styles.filters, {backgroundColor: colors.surface, borderBottomColor: colors.border}]}>
        {(['ALL', 'ACTIVE', 'INVESTIGATING', 'RESOLVED'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              {
                backgroundColor: statusFilter === status ? colors.primary : colors.surface,
                borderColor: statusFilter === status ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setStatusFilter(status)}>
            <Text
              style={[
                styles.filterText,
                {
                  color: statusFilter === status ? colors.textInverse : colors.textSecondary,
                },
              ]}>
              {status}
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
            variant="no-results"
            customTitle="No incidents"
            customMessage="No security incidents reported"
          />
        }
        refreshing={loading}
        onRefresh={handleRetry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
  },
  summaryTile: {
    flex: 1,
  },
  emergencyButton: {
    marginTop: Spacing.base,
    width: '100%',
  },
  filters: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  listContent: {
    padding: Spacing.base,
  },
  card: {
    marginBottom: Spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: Spacing.base,
  },
  type: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  location: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.base,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.base,
    borderTopWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: Typography.fontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

export default SecurityDashboard;
