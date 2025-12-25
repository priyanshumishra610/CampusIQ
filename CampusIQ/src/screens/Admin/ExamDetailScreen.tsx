import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import AuditTrail from '../../components/AuditTrail';
import PermissionGate, {usePermission} from '../../components/PermissionGate';
import Button from '../../components/Button';
import {Exam, ExamType, ExamStatus, updateExam, deleteExam} from '../../redux/examSlice';
import {RootState} from '../../redux/store';
import {getRoleDisplayName} from '../../config/permissions';
import EmptyState from '../../components/EmptyState';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

type Props = {
  route: {params: {exam: Exam}};
  navigation: any;
};

const examTypeConfig: Record<ExamType, {label: string; color: string}> = {
  MIDTERM: {label: 'Midterm', color: '#e74c3c'},
  FINAL: {label: 'Final', color: '#c0392b'},
  QUIZ: {label: 'Quiz', color: '#3498db'},
  ASSIGNMENT: {label: 'Assignment', color: '#9b59b6'},
  PROJECT: {label: 'Project', color: '#16a085'},
};

const ExamDetailScreen = ({route, navigation}: Props) => {
  const dispatch = useDispatch();
  const exam = route.params.exam;
  const user = useSelector((state: RootState) => state.auth.user);
  const {updating, deleting} = useSelector((state: RootState) => state.exams);

  const canViewAudit = usePermission('audit:view');
  const canEdit = usePermission('exam:edit');
  const canDelete = usePermission('exam:delete');
  const canPublish = usePermission('exam:publish');

  const examDate = useMemo(() => {
    if (!exam.scheduledDate) return null;
    return exam.scheduledDate instanceof Date
      ? exam.scheduledDate
      : exam.scheduledDate.toDate?.() || null;
  }, [exam.scheduledDate]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const typeConfig = examTypeConfig[exam.examType];

  const handleStatusChange = (status: ExamStatus) => {
    if (!user || !user.adminRole) return;
    dispatch(updateExam({
      examId: exam.id,
      updates: {status},
    }) as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Exam',
      'Are you sure you want to delete this exam? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteExam({examId: exam.id}) as any).then(() => {
              navigation.goBack();
            });
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>{exam.title}</Text>
          <Text style={styles.courseCode}>{exam.courseCode}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: typeConfig.color}]}>
          <Text style={styles.statusText}>{exam.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Course Information</Text>
        <Text style={styles.label}>Course Name</Text>
        <Text style={styles.value}>{exam.courseName}</Text>
        <Text style={styles.label}>Exam Type</Text>
        <View style={[styles.typeBadge, {backgroundColor: typeConfig.color}]}>
          <Text style={styles.typeText}>{typeConfig.label}</Text>
        </View>
      </View>

      {examDate && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{examDate.toLocaleDateString()}</Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.label}>Time</Text>
              <Text style={styles.value}>
                {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
              </Text>
            </View>
            <View style={styles.scheduleItem}>
              <Text style={styles.label}>Duration</Text>
              <Text style={styles.value}>{exam.duration} minutes</Text>
            </View>
          </View>
        </View>
      )}

      {exam.room && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.label}>Room</Text>
          <Text style={styles.value}>
            {exam.building ? `${exam.building} - ` : ''}{exam.room}
          </Text>
          <Text style={styles.label}>Capacity</Text>
          <Text style={styles.value}>
            {exam.studentCount} / {exam.capacity} students
          </Text>
        </View>
      )}

      {exam.instructions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.value}>{exam.instructions}</Text>
        </View>
      )}

      {exam.conflictWarnings && exam.conflictWarnings.length > 0 && (
        <View style={styles.conflictSection}>
          <Text style={styles.sectionTitle}>⚠️ Conflicts Detected</Text>
          {exam.conflictWarnings.map((conflict, idx) => (
            <View key={idx} style={styles.conflictItem}>
              <Text style={styles.conflictType}>{conflict.type}</Text>
              <Text style={styles.conflictMessage}>{conflict.message}</Text>
              <Text style={styles.conflictExam}>Conflicting: {conflict.conflictingExamTitle}</Text>
            </View>
          ))}
        </View>
      )}

      {exam.aiSuggestions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Suggestions</Text>
          <View style={styles.aiCard}>
            <Text style={styles.aiText}>{exam.aiSuggestions}</Text>
            <Text style={styles.aiTag}>Powered by Gemini AI</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Enrollment</Text>
        {exam.enrolledStudents && exam.enrolledStudents.length > 0 ? (
          <Text style={styles.value}>
            {exam.enrolledStudents.length} students enrolled
          </Text>
        ) : (
          <Text style={styles.meta}>No students enrolled yet</Text>
        )}
      </View>

      {canEdit && exam.status === 'DRAFT' && (
        <View style={styles.actionsSection}>
          <Button
            title="Mark as Scheduled"
            onPress={() => handleStatusChange('SCHEDULED')}
            variant="primary"
            size="md"
            disabled={updating}
            loading={updating}
            style={styles.actionButton}
          />
        </View>
      )}

      {canDelete && exam.status === 'DRAFT' && (
        <View style={styles.actionsSection}>
          <Button
            title="Delete Exam"
            onPress={handleDelete}
            variant="destructive"
            size="md"
            disabled={deleting}
            loading={deleting}
            style={styles.actionButton}
          />
        </View>
      )}

      <View style={styles.metaSection}>
        <Text style={styles.meta}>
          Created by {exam.createdByName || 'Administrator'}
        </Text>
        <Text style={styles.meta}>
          {exam.createdAt instanceof Date
            ? exam.createdAt.toLocaleDateString()
            : new Date(exam.createdAt?.toDate?.() ?? Date.now()).toLocaleDateString()}
        </Text>
      </View>

      {canViewAudit && <AuditTrail entityId={exam.id} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  courseCode: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  section: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  conflictSection: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: fontSize.base * 1.5,
    fontWeight: fontWeight.normal,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  typeText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  scheduleItem: {
    flex: 1,
  },
  conflictItem: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  conflictType: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  conflictMessage: {
    fontSize: fontSize.sm,
    color: colors.warning,
    marginTop: spacing.xs,
    fontWeight: fontWeight.normal,
  },
  conflictExam: {
    fontSize: fontSize.xs,
    color: colors.warning,
    marginTop: spacing.xs,
    fontStyle: 'italic',
    fontWeight: fontWeight.normal,
  },
  aiCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: fontSize.base * 1.5,
    fontWeight: fontWeight.normal,
  },
  aiTag: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: fontWeight.normal,
  },
  actionsSection: {
    marginBottom: spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  metaSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default ExamDetailScreen;

