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
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
        <View style={styles.filterOptions}>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              onPress={() => setFn(option as any)}
              activeOpacity={0.7}
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
            disabled={updating}
            activeOpacity={0.8}>
            <Text style={styles.actionText}>In Progress</Text>
          </TouchableOpacity>
        )}
        {canCloseTasks && task.status !== 'RESOLVED' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionResolve]}
            onPress={() => handleStatusChange(task.id, 'RESOLVED', task.createdBy, task.status)}
            disabled={updating}
            activeOpacity={0.8}>
            <Text style={styles.actionText}>Complete</Text>
          </TouchableOpacity>
        )}
        {canEscalate && task.status !== 'ESCALATED' && task.status !== 'RESOLVED' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionEscalate]}
            onPress={() => handleStatusChange(task.id, 'ESCALATED', task.createdBy, task.status)}
            disabled={updating}
            activeOpacity={0.8}>
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
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.header}>
                <View style={styles.headerContent}>
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
            </View>

            {/* Health Score Section */}
            <View style={styles.section}>
              <HealthScoreCard />
            </View>

            {/* Metrics Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
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
            </View>

            {/* Filters Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Filters</Text>
              {renderFilters(statusFilter, setStatusFilter, statuses, 'Status')}
              {renderFilters(priorityFilter, setPriorityFilter, priorities, 'Priority')}
            </View>

            {/* Tasks Section Header */}
            <View style={styles.tasksSectionHeader}>
              <Text style={styles.sectionTitle}>Tasks ({filtered.length})</Text>
            </View>
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.sm * 1.5,
  },
  readOnlyBadge: {
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.md,
  },
  readOnlyText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
    ...shadows.sm,
  },
  metricAlert: {
    borderColor: colors.error + '30',
    backgroundColor: colors.error + '08',
  },
  metricValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  metricValueAlert: {
    color: colors.error,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontSize: fontSize.sm,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  filterScrollContent: {
    paddingRight: spacing.lg,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  chipTextActive: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
  },
  tasksSectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cardWrapper: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  actionProgress: {
    backgroundColor: colors.status.inProgress,
  },
  actionResolve: {
    backgroundColor: colors.status.resolved,
  },
  actionEscalate: {
    backgroundColor: colors.status.escalated,
  },
  actionText: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
});

export default ExecutiveDashboard;

