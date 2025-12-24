import React, {useMemo, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import TaskCard from '../../components/TaskCard';
import HealthScoreCard from '../../components/HealthScoreCard';
import EmptyState from '../../components/EmptyState';
import PermissionGate, {usePermission} from '../../components/PermissionGate';
import {
  TaskPriority,
  TaskStatus,
  updateTaskStatus,
} from '../../redux/taskSlice';
import {RootState} from '../../redux/store';
import {getRoleDisplayName} from '../../config/permissions';

const statuses: (TaskStatus | 'ALL')[] = [
  'ALL',
  'NEW',
  'IN_PROGRESS',
  'RESOLVED',
  'ESCALATED',
];
const priorities: (TaskPriority | 'ALL')[] = ['ALL', 'LOW', 'MEDIUM', 'HIGH'];

const ExecutiveDashboard = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {items, updating} = useSelector((state: RootState) => state.tasks);
  const user = useSelector((state: RootState) => state.auth.user);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');

  const canCloseTasks = usePermission('task:close');
  const canEscalate = usePermission('task:escalate');
  const isReadOnly = !usePermission('task:create');

  const filtered = useMemo(
    () =>
      items.filter(
        task =>
          (statusFilter === 'ALL' || task.status === statusFilter) &&
          (priorityFilter === 'ALL' || task.priority === priorityFilter),
      ),
    [items, statusFilter, priorityFilter],
  );

  const avgResolution = useMemo(() => {
    const resolved = items.filter(task => task.status === 'RESOLVED' && task.resolvedAt);
    if (!resolved.length) return 0;
    const total = resolved.reduce((sum, task) => {
      const created =
        task.createdAt instanceof Date
          ? task.createdAt.getTime()
          : task.createdAt?.toDate?.().getTime?.() || 0;
      const resolvedAt =
        task.resolvedAt instanceof Date
          ? task.resolvedAt.getTime()
          : task.resolvedAt?.toDate?.().getTime?.() || 0;
      if (!created || !resolvedAt) return sum;
      return sum + (resolvedAt - created) / (1000 * 60 * 60);
    }, 0);
    return +(total / resolved.length).toFixed(1);
  }, [items]);

  const pendingCount = useMemo(() => items.filter(i => i.status === 'NEW').length, [items]);
  const inProgressCount = useMemo(() => items.filter(i => i.status === 'IN_PROGRESS').length, [items]);
  const escalatedCount = useMemo(() => items.filter(i => i.status === 'ESCALATED').length, [items]);
  const resolvedCount = useMemo(() => items.filter(i => i.status === 'RESOLVED').length, [items]);

  const handleStatusChange = (taskId: string, status: TaskStatus, createdBy: string, previousStatus: TaskStatus) => {
    if (!user) return;
    dispatch(updateTaskStatus({
      taskId,
      status,
      userId: createdBy,
      userName: user.name,
      userRole: user.adminRole,
      previousStatus,
    }) as any);
  };

  const renderFilters = (
    current: any,
    setFn: (value: any) => void,
    options: string[],
    title: string,
  ) => (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterOptions}>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              onPress={() => setFn(option as any)}
              style={[
                styles.chip,
                current === option && styles.chipActive,
              ]}>
              <Text
                style={[
                  styles.chipText,
                  current === option && styles.chipTextActive,
                ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderTaskActions = (task: typeof items[0]) => {
    if (isReadOnly) return null;

    return (
      <View style={styles.actions}>
        {task.status !== 'IN_PROGRESS' && task.status !== 'RESOLVED' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionProgress]}
            onPress={() => handleStatusChange(task.id, 'IN_PROGRESS', task.createdBy, task.status)}
            disabled={updating}>
            <Text style={styles.actionText}>In Progress</Text>
          </TouchableOpacity>
        )}
        {canCloseTasks && task.status !== 'RESOLVED' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionResolve]}
            onPress={() => handleStatusChange(task.id, 'RESOLVED', task.createdBy, task.status)}
            disabled={updating}>
            <Text style={styles.actionText}>Complete</Text>
          </TouchableOpacity>
        )}
        {canEscalate && task.status !== 'ESCALATED' && task.status !== 'RESOLVED' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionEscalate]}
            onPress={() => handleStatusChange(task.id, 'ESCALATED', task.createdBy, task.status)}
            disabled={updating}>
            <Text style={styles.actionText}>Escalate</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Executive Dashboard</Text>
                <Text style={styles.subtitle}>
                  {user?.adminRole ? getRoleDisplayName(user.adminRole) : 'Administrator'} • Operations Overview
                </Text>
              </View>
              {isReadOnly && (
                <View style={styles.readOnlyBadge}>
                  <Text style={styles.readOnlyText}>View Only</Text>
                </View>
              )}
            </View>

            <HealthScoreCard />

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{pendingCount}</Text>
                <Text style={styles.metricLabel}>Pending</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{inProgressCount}</Text>
                <Text style={styles.metricLabel}>In Progress</Text>
              </View>
              <View style={[styles.metricCard, escalatedCount > 0 && styles.metricAlert]}>
                <Text style={[styles.metricValue, escalatedCount > 0 && styles.metricValueAlert]}>
                  {escalatedCount}
                </Text>
                <Text style={styles.metricLabel}>Escalated</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{avgResolution}h</Text>
                <Text style={styles.metricLabel}>Avg. Time</Text>
              </View>
            </View>

            {renderFilters(statusFilter, setStatusFilter, statuses, 'Status')}
            {renderFilters(priorityFilter, setPriorityFilter, priorities, 'Priority')}
          </>
        }
        renderItem={({item}) => (
          <View style={styles.cardWrapper}>
            <TaskCard
              task={item}
              onPress={() => navigation.navigate('TaskDetail', {task: item})}
            />
            {renderTaskActions(item)}
          </View>
        )}
        ListEmptyComponent={
          items.length === 0 ? (
            <EmptyState variant="campus-stable" />
          ) : (
            <EmptyState variant="no-results" />
          )
        }
        contentContainerStyle={{paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f6f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c1222',
  },
  subtitle: {
    fontSize: 13,
    color: '#5a6a7a',
    marginTop: 2,
  },
  readOnlyBadge: {
    backgroundColor: '#e8f0f8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e0f0',
  },
  readOnlyText: {
    fontSize: 11,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    alignItems: 'center',
  },
  metricAlert: {
    borderColor: '#e74c3c',
    backgroundColor: '#fef5f5',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c1222',
  },
  metricValueAlert: {
    color: '#c0392b',
  },
  metricLabel: {
    fontSize: 10,
    color: '#7a8a9a',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  filterRow: {
    marginBottom: 10,
  },
  filterLabel: {
    fontWeight: '600',
    color: '#3a4a5a',
    marginBottom: 6,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4dce6',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  chipText: {
    color: '#3a4a5a',
    fontWeight: '600',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#fff',
  },
  cardWrapper: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionProgress: {
    backgroundColor: '#2980b9',
  },
  actionResolve: {
    backgroundColor: '#27ae60',
  },
  actionEscalate: {
    backgroundColor: '#c0392b',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default ExecutiveDashboard;

