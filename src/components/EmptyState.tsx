import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

type EmptyStateVariant =
  | 'no-tasks'
  | 'all-completed'
  | 'no-compliance-risks'
  | 'no-escalations'
  | 'no-results'
  | 'campus-stable'
  | 'no-audit-logs'
  | 'no-exams'
  | 'no-exam-schedule';

type Props = {
  variant: EmptyStateVariant;
  customTitle?: string;
  customMessage?: string;
};

const EMPTY_STATE_CONTENT: Record<
  EmptyStateVariant,
  {title: string; message: string; icon: string}
> = {
  'no-tasks': {
    title: 'No active tasks',
    message: 'All operations are running smoothly',
    icon: '○',
  },
  'all-completed': {
    title: 'All tasks completed',
    message: 'Outstanding work. No pending items require attention.',
    icon: '●',
  },
  'no-compliance-risks': {
    title: 'No compliance risks',
    message: 'All regulatory requirements are on track',
    icon: '◆',
  },
  'no-escalations': {
    title: 'No escalated items',
    message: 'Operations proceeding without critical intervention',
    icon: '▲',
  },
  'no-results': {
    title: 'No matching results',
    message: 'Adjust filters to see more items',
    icon: '◇',
  },
  'campus-stable': {
    title: 'Campus operating normally',
    message: 'All systems and processes are functioning as expected',
    icon: '◎',
  },
  'no-audit-logs': {
    title: 'No activity recorded',
    message: 'Audit trail will appear as actions are performed',
    icon: '◌',
  },
  'no-exams': {
    title: 'No exams scheduled',
    message: 'Create your first exam schedule to get started',
    icon: '📝',
  },
  'no-exam-schedule': {
    title: 'No exams this period',
    message: 'All exam schedules are clear for this time frame',
    icon: '✓',
  },
};

const EmptyState = ({variant, customTitle, customMessage}: Props) => {
  const content = EMPTY_STATE_CONTENT[variant];
  const title = customTitle || content.title;
  const message = customMessage || content.message;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{content.icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  icon: {
    fontSize: 24,
    color: '#7a8a9a',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2a3a4a',
    marginBottom: 6,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#7a8a9a',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});

export default EmptyState;

