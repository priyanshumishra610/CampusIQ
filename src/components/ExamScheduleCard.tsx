import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {Exam, ExamType} from '../redux/examSlice';
import {colors} from '../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../theme/spacing';
import {shadows} from '../theme/shadows';

type Props = {
  exam: Exam;
  compact?: boolean;
};

const examTypeConfig: Record<ExamType, {label: string; color: string; short: string}> = {
  MIDTERM: {label: 'Midterm', color: '#e74c3c', short: 'MT'},
  FINAL: {label: 'Final', color: '#c0392b', short: 'F'},
  QUIZ: {label: 'Quiz', color: '#3498db', short: 'Q'},
  ASSIGNMENT: {label: 'Assignment', color: '#9b59b6', short: 'A'},
  PROJECT: {label: 'Project', color: '#16a085', short: 'P'},
};

const ExamScheduleCard = ({exam, compact = false}: Props) => {
  const examDate = exam.scheduledDate instanceof Date
    ? exam.scheduledDate
    : exam.scheduledDate?.toDate?.() || new Date();

  const typeConfig = examTypeConfig[exam.examType];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={[styles.compactTypeBadge, {backgroundColor: typeConfig.color}]}>
          <Text style={styles.compactTypeText}>{typeConfig.short}</Text>
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{exam.title}</Text>
          <Text style={styles.compactMeta}>
            {exam.courseCode} • {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
            {exam.room ? ` • ${exam.room}` : ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, {backgroundColor: typeConfig.color}]}>
          <Text style={styles.typeText}>{typeConfig.label}</Text>
        </View>
        <Text style={styles.courseCode}>{exam.courseCode}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{exam.title}</Text>
      <Text style={styles.courseName}>{exam.courseName}</Text>

      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Date</Text>
          <Text style={styles.timeValue}>{examDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Time</Text>
          <Text style={styles.timeValue}>
            {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
          </Text>
        </View>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Duration</Text>
          <Text style={styles.timeValue}>{exam.duration} min</Text>
        </View>
      </View>

      {exam.room && (
        <View style={styles.locationRow}>
          <Text style={styles.location}>
            📍 {exam.building ? `${exam.building} - ` : ''}{exam.room}
          </Text>
          <Text style={styles.students}>{exam.studentCount} students</Text>
        </View>
      )}

      {exam.instructions && (
        <Text style={styles.instructions} numberOfLines={2}>
          {exam.instructions}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  compactCard: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  typeText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  compactTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTypeText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  courseCode: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.1,
  },
  compactTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  courseName: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontWeight: fontWeight.normal,
  },
  compactContent: {
    flex: 1,
  },
  compactMeta: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs / 2,
    fontWeight: fontWeight.normal,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs / 2,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  location: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  students: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  instructions: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: fontSize.sm * 1.5,
    fontWeight: fontWeight.normal,
  },
});

export default ExamScheduleCard;




