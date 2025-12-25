import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {AuditTrail, PermissionGate, usePermission, EmptyState} from '../../components/Common';
import {Exam, ExamType, ExamStatus, updateExam, deleteExam} from '../../redux/slices/examSlice';
import {RootState} from '../../redux/store';
import {getRoleDisplayName} from '../../config/permissions';

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
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionSchedule]}
            onPress={() => handleStatusChange('SCHEDULED')}
            disabled={updating}>
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>Mark as Scheduled</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {canDelete && exam.status === 'DRAFT' && (
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionDelete]}
            onPress={handleDelete}
            disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.actionBtnText}>Delete Exam</Text>
            )}
          </TouchableOpacity>
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
    padding: 16,
    backgroundColor: '#f4f6f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c1222',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    color: '#1e3a5f',
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  conflictSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
    paddingBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#7a8a9a',
    marginTop: 10,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#2a3a4a',
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    color: '#7a8a9a',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  scheduleItem: {
    flex: 1,
  },
  conflictItem: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  conflictType: {
    fontSize: 11,
    color: '#856404',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  conflictMessage: {
    fontSize: 13,
    color: '#856404',
    marginTop: 4,
  },
  conflictExam: {
    fontSize: 12,
    color: '#856404',
    marginTop: 4,
    fontStyle: 'italic',
  },
  aiCard: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e0f0',
  },
  aiText: {
    fontSize: 14,
    color: '#2a3a4a',
    lineHeight: 20,
  },
  aiTag: {
    marginTop: 8,
    fontSize: 11,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  actionsSection: {
    marginBottom: 16,
  },
  actionBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionSchedule: {
    backgroundColor: '#3498db',
  },
  actionDelete: {
    backgroundColor: '#e74c3c',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  metaSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e4e8ec',
  },
});

export default ExamDetailScreen;

