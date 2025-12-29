import React, {useMemo, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useDispatch, useSelector} from 'react-redux';
import {TaskCard} from '../../components/Task';
import {HealthScoreCard, EmptyState, PermissionGate, usePermission, MetricTile, PremiumCard, ActionButton} from '../../components/Common';
import {
  TaskPriority,
  TaskStatus,
  updateTaskStatus,
} from '../../redux/slices/taskSlice';
import {RootState} from '../../redux/store';
import {getRoleDisplayName} from '../../config/permissions';
import {useTheme} from '../../theme/ThemeContext';
import {Typography, Spacing, BorderRadius} from '../../theme/designTokens';

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
  const {colors} = useTheme();
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
          : task.createdAt?.toDate?.().getTime() || 0;
      const resolvedAt =
        task.resolvedAt instanceof Date
          ? task.resolvedAt.getTime()
          : task.resolvedAt?.toDate?.().getTime() || 0;
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
      <Text style={[styles.filterLabel, {color: colors.textSecondary}]}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterOptions}>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              onPress={() => setFn(option as any)}
              style={[
                styles.chip,
                {
                  backgroundColor: current === option ? colors.primary : colors.surface,
                  borderColor: current === option ? colors.primary : colors.border,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: current === option ? colors.textInverse : colors.textSecondary,
                  },
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
          <ActionButton
            label="In Progress"
            onPress={() => handleStatusChange(task.id, 'IN_PROGRESS', task.createdBy, task.status)}
            variant="secondary"
            size="sm"
            disabled={updating}
            style={styles.actionBtn}
          />
        )}
        {canCloseTasks && task.status !== 'RESOLVED' && (
          <ActionButton
            label="Complete"
            onPress={() => handleStatusChange(task.id, 'RESOLVED', task.createdBy, task.status)}
            variant="success"
            size="sm"
            disabled={updating}
            style={styles.actionBtn}
          />
        )}
        {canEscalate && task.status !== 'ESCALATED' && task.status !== 'RESOLVED' && (
          <ActionButton
            label="Escalate"
            onPress={() => handleStatusChange(task.id, 'ESCALATED', task.createdBy, task.status)}
            variant="danger"
            size="sm"
            disabled={updating}
            style={styles.actionBtn}
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, {color: colors.textPrimary}]}>Executive Dashboard</Text>
                <Text style={[styles.subtitle, {color: colors.textTertiary}]}>
                  {user?.adminRole ? getRoleDisplayName(user.adminRole) : 'Administrator'} • Operations Overview
                </Text>
              </View>
              {isReadOnly && (
                <View style={[styles.readOnlyBadge, {backgroundColor: colors.borderLight, borderColor: colors.border}]}>
                  <Text style={[styles.readOnlyText, {color: colors.primary}]}>View Only</Text>
                </View>
              )}
            </View>

            <HealthScoreCard />

            {/* Enterprise Analytics Tiles */}
            <View style={styles.analyticsSection}>
              <Text style={[styles.analyticsTitle, {color: colors.textPrimary}]}>Campus Health Index</Text>
              <View style={styles.analyticsGrid}>
                <MetricTile
                  value={`${Math.round((resolvedCount / Math.max(items.length, 1)) * 100)}%`}
                  label="Resolution Rate"
                  icon="bar-chart"
                  variant="highlight"
                />
                <MetricTile
                  value={`${avgResolution}h`}
                  label="Avg Resolution"
                  icon="flash-on"
                  variant="default"
                />
                <MetricTile
                  value={items.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length}
                  label="High Priority"
                  icon="priority-high"
                  variant={items.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length > 0 ? 'alert' : 'default'}
                />
                <MetricTile
                  value={items.filter(t => {
                    const created = t.createdAt instanceof Date
                      ? t.createdAt.getTime()
                      : t.createdAt?.toDate?.().getTime() || 0;
                    const daysOld = (Date.now() - created) / (1000 * 60 * 60 * 24);
                    return daysOld <= 7;
                  }).length}
                  label="This Week"
                  icon="trending-up"
                  variant="default"
                />
              </View>
            </View>

            {/* Predictive Analytics Tiles */}
            <View style={styles.predictiveSection}>
              <Text style={[styles.analyticsTitle, {color: colors.textPrimary}]}>Predictive Insights</Text>
              <View style={styles.predictiveGrid}>
                <PremiumCard
                  variant="outlined"
                  style={[
                    styles.predictiveTile,
                    escalatedCount > 5 && {
                      backgroundColor: colors.errorLight,
                      borderColor: colors.error + '30',
                    },
                  ]}>
                  <View style={styles.predictiveIconContainer}>
                    <Icon
                      name="warning"
                      size={24}
                      color={escalatedCount > 5 ? colors.error : colors.warning}
                    />
                  </View>
                  <Text style={[styles.predictiveText, {color: colors.textPrimary}]}>
                    {escalatedCount > 5
                      ? 'High escalation rate detected'
                      : escalatedCount > 0
                      ? 'Some escalations pending'
                      : 'No escalations'}
                  </Text>
                </PremiumCard>
                <PremiumCard
                  variant="outlined"
                  style={[
                    styles.predictiveTile,
                    avgResolution > 48 && {
                      backgroundColor: colors.warningLight,
                      borderColor: colors.warning + '30',
                    },
                  ]}>
                  <View style={styles.predictiveIconContainer}>
                    <Icon
                      name="schedule"
                      size={24}
                      color={avgResolution > 48 ? colors.warning : colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.predictiveText, {color: colors.textPrimary}]}>
                    {avgResolution > 48
                      ? 'Resolution time above target'
                      : 'Resolution time optimal'}
                  </Text>
                </PremiumCard>
              </View>
            </View>

            {/* Key Metrics - Fixed Text Wrapping */}
            <View style={styles.metricsRow}>
              <MetricTile
                value={pendingCount}
                label="Pending"
                variant="default"
              />
              <MetricTile
                value={inProgressCount}
                label="In Progress"
                variant="highlight"
              />
              <MetricTile
                value={escalatedCount}
                label="Escalated"
                variant={escalatedCount > 0 ? 'alert' : 'default'}
              />
              <MetricTile
                value={`${avgResolution}h`}
                label="Avg Time"
                variant="default"
              />
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
        contentContainerStyle={{paddingBottom: 40, padding: Spacing.base}}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
    padding: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
  readOnlyBadge: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
  },
  readOnlyText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  filterRow: {
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  filterLabel: {
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
    fontSize: Typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
  },
  chipText: {
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.xs,
  },
  cardWrapper: {
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  actionBtn: {
    flex: 1,
  },
  analyticsSection: {
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  analyticsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
  },
  predictiveSection: {
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  predictiveGrid: {
    gap: Spacing.base,
  },
  predictiveTile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  predictiveIconContainer: {
    marginRight: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictiveText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
});

export default ExecutiveDashboard;
