import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {updateEmployeeTaskStatus, EmployeeTaskStatus} from '../../redux/employeeSlice';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

const EmployeeTaskScreen = () => {
  const dispatch = useDispatch();
  const {tasks, updatingTask} = useSelector((state: RootState) => state.employee);

  const handleUpdateStatus = (taskId: string, newStatus: EmployeeTaskStatus) => {
    dispatch(updateEmployeeTaskStatus({taskId, status: newStatus}) as any);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return colors.priority.high;
      case 'MEDIUM':
        return colors.priority.medium;
      default:
        return colors.priority.low;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':
        return colors.success;
      case 'IN_PROGRESS':
        return colors.status.inProgress;
      default:
        return colors.textTertiary;
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'DONE');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Task Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Task Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{pendingTasks.length}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{inProgressTasks.length}</Text>
            <Text style={styles.summaryLabel}>In Progress</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{completedTasks.length}</Text>
            <Text style={styles.summaryLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* All Tasks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assigned Tasks</Text>
        {tasks.length === 0 ? (
          <EmptyState variant="no-results" customMessage="No tasks assigned" />
        ) : (
          <View style={styles.tasksList}>
            {tasks.map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskHeaderLeft}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View style={styles.taskBadges}>
                      <View style={[styles.priorityBadge, {backgroundColor: getPriorityColor(task.priority) + '20'}]}>
                        <Text style={[styles.priorityText, {color: getPriorityColor(task.priority)}]}>
                          {task.priority}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, {backgroundColor: getStatusColor(task.status) + '20'}]}>
                        <Text style={[styles.statusText, {color: getStatusColor(task.status)}]}>
                          {task.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                <Text style={styles.taskDescription}>{task.description}</Text>
                <View style={styles.taskActions}>
                  {task.status === 'PENDING' && (
                    <Button
                      title="Start"
                      onPress={() => handleUpdateStatus(task.id, 'IN_PROGRESS')}
                      variant="primary"
                      size="sm"
                      loading={updatingTask}
                      style={styles.taskButton}
                    />
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <Button
                      title="Mark Done"
                      onPress={() => handleUpdateStatus(task.id, 'DONE')}
                      variant="primary"
                      size="sm"
                      loading={updatingTask}
                      style={styles.taskButton}
                    />
                  )}
                  {task.status === 'DONE' && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>✓ Completed</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  summaryCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  summaryTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.1,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.1,
  },
  tasksList: {
    gap: spacing.md,
  },
  taskCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  taskHeaderLeft: {
    flex: 1,
  },
  taskTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.1,
  },
  taskBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  priorityText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  taskDescription: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: fontSize.base * 1.5,
    marginBottom: spacing.md,
    fontWeight: fontWeight.normal,
  },
  taskActions: {
    marginTop: spacing.sm,
  },
  taskButton: {
    alignSelf: 'flex-start',
  },
  completedBadge: {
    backgroundColor: colors.success + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.success + '40',
    alignSelf: 'flex-start',
  },
  completedText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

export default EmployeeTaskScreen;

