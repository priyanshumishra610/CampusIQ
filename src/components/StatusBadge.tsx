import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {TaskPriority, TaskStatus} from '../redux/taskSlice';
import {colors} from '../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../theme/spacing';

const statusConfig: Record<TaskStatus, {bg: string; text: string; label: string}> = {
  NEW: {bg: colors.status.new + '15', text: colors.status.new, label: 'NEW'},
  IN_PROGRESS: {bg: colors.status.inProgress + '15', text: colors.status.inProgress, label: 'IN PROGRESS'},
  RESOLVED: {bg: colors.status.resolved + '15', text: colors.status.resolved, label: 'COMPLETED'},
  ESCALATED: {bg: colors.status.escalated + '15', text: colors.status.escalated, label: 'ESCALATED'},
};

const priorityConfig: Record<TaskPriority, {bg: string; text: string; label: string}> = {
  LOW: {bg: colors.priority.low + '15', text: colors.priority.low, label: 'LOW'},
  MEDIUM: {bg: colors.priority.medium + '15', text: colors.priority.medium, label: 'MED'},
  HIGH: {bg: colors.priority.high + '15', text: colors.priority.high, label: 'HIGH'},
};

type Props = {
  status: TaskStatus;
  priority?: TaskPriority;
};

const StatusBadge = ({status, priority}: Props) => {
  const statusInfo = statusConfig[status];
  const priorityInfo = priority ? priorityConfig[priority] : null;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, {backgroundColor: statusInfo.bg}]}>
        <View style={[styles.dot, {backgroundColor: statusInfo.text}]} />
        <Text style={[styles.text, {color: statusInfo.text}]}>{statusInfo.label}</Text>
      </View>
      {priorityInfo && (
        <View style={[styles.priorityBadge, {backgroundColor: priorityInfo.bg}]}>
          <Text style={[styles.priorityText, {color: priorityInfo.text}]}>{priorityInfo.label}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
  },
  text: {
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.3,
  },
  priorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  priorityText: {
    fontSize: fontSize.xs - 1,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.2,
  },
});

export default StatusBadge;
