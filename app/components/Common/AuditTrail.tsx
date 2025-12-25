import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {fetchAuditLogs, getActionDisplayName, AuditLogEntry} from '../../redux/slices/auditSlice';
import {getRoleDisplayName} from '../../config/permissions';
import EmptyState from './EmptyState';

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
    marginTop: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
    paddingBottom: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    color: '#7a8a9a',
    fontSize: 13,
  },
  timeline: {
    gap: 0,
  },
  logEntry: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineIndicator: {
    alignItems: 'center',
    width: 24,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  icon: {
    fontSize: 10,
    color: '#5a6a7a',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e4e8ec',
    minHeight: 20,
  },
  logContent: {
    flex: 1,
    paddingBottom: 16,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2a3a4a',
  },
  change: {
    fontSize: 13,
    color: '#5a6a7a',
    marginTop: 2,
    fontStyle: 'italic',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  performer: {
    fontSize: 12,
    color: '#5a6a7a',
  },
  role: {
    fontSize: 10,
    color: '#1e3a5f',
    backgroundColor: '#e8f0f8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    color: '#9aaaba',
  },
});

export default AuditTrail;

