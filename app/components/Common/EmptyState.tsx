import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Colors, Typography, Spacing, BorderRadius} from '../../theme/designTokens';

type EmptyStateVariant =
  | 'no-tasks'
  | 'all-completed'
  | 'no-compliance-risks'
  | 'no-escalations'
  | 'no-results'
  | 'campus-stable'
  | 'no-audit-logs'
  | 'no-exams'
  | 'no-exam-schedule'
  | 'no-assignments'
  | 'no-attendance'
  | 'no-submissions'
  | 'no-tickets'
  | 'no-incidents'
  | 'no-announcements'
  | 'no-notifications'
  | 'no-classes'
  | 'no-students'
  | 'no-grades';

type Props = {
  variant: EmptyStateVariant;
  customTitle?: string;
  customMessage?: string;
  actionLabel?: string;
  onAction?: () => void;
};

const EMPTY_STATE_CONTENT: Record<
  EmptyStateVariant,
  {title: string; message: string; icon: string}
> = {
  'no-tasks': {
    title: 'No active tasks',
    message: 'All operations are running smoothly',
    icon: 'check-circle-outline',
  },
  'all-completed': {
    title: 'All tasks completed',
    message: 'Outstanding work. No pending items require attention.',
    icon: 'check-circle',
  },
  'no-compliance-risks': {
    title: 'No compliance risks',
    message: 'All regulatory requirements are on track',
    icon: 'verified',
  },
  'no-escalations': {
    title: 'No escalated items',
    message: 'Operations proceeding without critical intervention',
    icon: 'trending-up',
  },
  'no-results': {
    title: 'No matching results',
    message: 'Adjust filters to see more items',
    icon: 'search-off',
  },
  'campus-stable': {
    title: 'Campus operating normally',
    message: 'All systems and processes are functioning as expected',
    icon: 'check-circle',
  },
  'no-audit-logs': {
    title: 'No activity recorded',
    message: 'Audit trail will appear as actions are performed',
    icon: 'history',
  },
  'no-exams': {
    title: 'No exams scheduled',
    message: 'Create your first exam schedule to get started',
    icon: 'quiz',
  },
  'no-exam-schedule': {
    title: 'No exams this period',
    message: 'All exam schedules are clear for this time frame',
    icon: 'event-available',
  },
  'no-assignments': {
    title: 'No assignments',
    message: 'You have no assignments at this time',
    icon: 'assignment',
  },
  'no-attendance': {
    title: 'No attendance records',
    message: 'Attendance data will appear here once classes begin',
    icon: 'check-circle-outline',
  },
  'no-submissions': {
    title: 'No submissions yet',
    message: 'Student submissions will appear here once they submit their work',
    icon: 'upload-file',
  },
  'no-tickets': {
    title: 'No support tickets',
    message: 'All support requests have been resolved',
    icon: 'support-agent',
  },
  'no-incidents': {
    title: 'No security incidents',
    message: 'Campus security is operating normally',
    icon: 'security',
  },
  'no-announcements': {
    title: 'No announcements',
    message: 'Check back later for updates and important information',
    icon: 'campaign',
  },
  'no-notifications': {
    title: 'No notifications',
    message: 'You\'re all caught up! No new notifications',
    icon: 'notifications-off',
  },
  'no-classes': {
    title: 'No classes scheduled',
    message: 'Your class schedule will appear here',
    icon: 'class',
  },
  'no-students': {
    title: 'No students enrolled',
    message: 'Student enrollment data will appear here',
    icon: 'people-outline',
  },
  'no-grades': {
    title: 'No grades available',
    message: 'Grade information will appear here once assessments are completed',
    icon: 'assessment',
  },
};

/**
 * Enhanced EmptyState component with action button support
 * Provides consistent empty state UI across all modules
 */
const EmptyState = ({variant, customTitle, customMessage, actionLabel, onAction}: Props) => {
  const content = EMPTY_STATE_CONTENT[variant];
  const title = customTitle || content.title;
  const message = customMessage || content.message;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Icon name={content.icon} size={48} color={Colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
    paddingHorizontal: Spacing.xl,
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.fontSize.base,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
    maxWidth: 300,
    marginBottom: Spacing.base,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.base,
    marginTop: Spacing.md,
  },
  actionButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default EmptyState;

