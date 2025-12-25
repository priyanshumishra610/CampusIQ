import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import {fetchAuditLogs, getActionDisplayName, AuditLogEntry} from '../redux/auditSlice';
import {getRoleDisplayName} from '../config/permissions';
import EmptyState from './EmptyState';
import {colors} from '../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../theme/spacing';
import {shadows} from '../theme/shadows';

type Props = {
  entityId: string;
};

const AuditTrail = ({entityId}: Props) => {
  const dispatch = useDispatch();
  const {logs, loading} = useSelector((state: RootState) => state.audit);

  useEffect(() => {
    dispatch(fetchAuditLogs({entityId, limit: 20}) as any);
  }, [dispatch, entityId]);

  const filteredLogs = logs.filter(log => log.entityId === entityId);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getActionIcon = (action: string): string => {
    if (action.includes('created')) return '●';
    if (action.includes('status')) return '◆';
    if (action.includes('priority')) return '▲';
    if (action.includes('comment')) return '◇';
    if (action.includes('assigned')) return '→';
    if (action.includes('deleted')) return '×';
    return '○';
  };

  if (loading && filteredLogs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#5a6a7a" />
        <Text style={styles.loadingText}>Loading audit trail...</Text>
      </View>
    );
  }

  if (filteredLogs.length === 0) {
    return <EmptyState variant="no-audit-logs" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Audit Trail</Text>
      <View style={styles.timeline}>
        {filteredLogs.map((log, index) => (
          <View key={log.id} style={styles.logEntry}>
            <View style={styles.timelineIndicator}>
              <View style={styles.iconCircle}>
                <Text style={styles.icon}>{getActionIcon(log.action)}</Text>
              </View>
              {index < filteredLogs.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.logContent}>
              <Text style={styles.action}>{getActionDisplayName(log.action)}</Text>
              {log.previousValue && log.newValue && (
                <Text style={styles.change}>
                  {log.previousValue} → {log.newValue}
                </Text>
              )}
              <View style={styles.metaRow}>
                <Text style={styles.performer}>
                  {log.performedBy.name}
                </Text>
                <Text style={styles.role}>
                  {getRoleDisplayName(log.performedBy.role)}
                </Text>
                <Text style={styles.timestamp}>
                  {formatTimestamp(log.timestamp)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    letterSpacing: -0.1,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  timeline: {
    gap: 0,
  },
  logEntry: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 24,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.border,
    minHeight: 20,
  },
  logContent: {
    flex: 1,
    paddingBottom: spacing.md,
  },
  action: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  change: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs / 2,
    fontStyle: 'italic',
    fontWeight: fontWeight.normal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  performer: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  role: {
    fontSize: fontSize.xs,
    color: colors.primary,
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    fontWeight: fontWeight.medium,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: fontWeight.normal,
  },
});

export default AuditTrail;

