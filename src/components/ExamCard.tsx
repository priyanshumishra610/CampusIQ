import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {Exam, ExamType} from '../redux/examSlice';
import {colors} from '../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../theme/spacing';
import {shadows} from '../theme/shadows';

type Props = {
  exam: Exam;
  onPress?: () => void;
};

const examTypeConfig: Record<ExamType, {label: string; color: string}> = {
  MIDTERM: {label: 'Midterm', color: '#e74c3c'},
  FINAL: {label: 'Final', color: '#c0392b'},
  QUIZ: {label: 'Quiz', color: '#3498db'},
  ASSIGNMENT: {label: 'Assignment', color: '#9b59b6'},
  PROJECT: {label: 'Project', color: '#16a085'},
};

const ExamCard = ({exam, onPress}: Props) => {
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

  const statusColor = {
    DRAFT: '#95a5a6',
    SCHEDULED: '#3498db',
    IN_PROGRESS: '#f39c12',
    COMPLETED: '#27ae60',
    CANCELLED: '#e74c3c',
  }[exam.status];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>{exam.title}</Text>
          <Text style={styles.courseCode}>{exam.courseCode}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
          <Text style={styles.statusText}>{exam.status}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.typeBadge, {backgroundColor: typeConfig.color}]}>
          <Text style={styles.typeText}>{typeConfig.label}</Text>
        </View>
        <Text style={styles.meta}>
          {exam.courseName}
        </Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{examDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>
            {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
          </Text>
        </View>
      </View>

      {exam.room && (
        <View style={styles.locationRow}>
          <Text style={styles.location}>
            📍 {exam.building ? `${exam.building} - ` : ''}{exam.room}
          </Text>
          <Text style={styles.capacity}>
            {exam.studentCount}/{exam.capacity} students
          </Text>
        </View>
      )}

      {exam.conflictWarnings && exam.conflictWarnings.length > 0 && (
        <View style={styles.conflictWarning}>
          <Text style={styles.conflictText}>
            ⚠️ {exam.conflictWarnings.length} conflict{exam.conflictWarnings.length > 1 ? 's' : ''} detected
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {exam.createdByName || 'Administrator'}
        </Text>
        <Text style={styles.footerDate}>
          {exam.createdAt instanceof Date
            ? exam.createdAt.toDateString()
            : new Date(exam.createdAt?.toDate?.() ?? Date.now()).toDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    lineHeight: fontSize.md * 1.5,
    marginBottom: spacing.xs,
    letterSpacing: -0.1,
  },
  courseCode: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  metaRow: {
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
  meta: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs / 2,
    fontWeight: fontWeight.medium,
  },
  detailValue: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    fontWeight: fontWeight.medium,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  location: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  capacity: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
  },
  conflictWarning: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  conflictText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  footerDate: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.normal,
  },
});

export default ExamCard;




