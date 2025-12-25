import React, {useMemo, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {ExamCard} from '../../components/Exam';
import {EmptyState, PermissionGate, usePermission} from '../../components/Common';
import {
  Exam,
  ExamStatus,
  ExamType,
  updateExam,
} from '../../redux/slices/examSlice';
import {RootState} from '../../redux/store';
import {getRoleDisplayName} from '../../config/permissions';

const statuses: (ExamStatus | 'ALL')[] = [
  'ALL',
  'DRAFT',
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

const types: (ExamType | 'ALL')[] = ['ALL', 'MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT', 'PROJECT'];

const ExamDashboard = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {items, updating} = useSelector((state: RootState) => state.exams);
  const user = useSelector((state: RootState) => state.auth.user);
  const [statusFilter, setStatusFilter] = useState<ExamStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<ExamType | 'ALL'>('ALL');

  const canCreateExams = usePermission('exam:create');
  const canEditExams = usePermission('exam:edit');
  const canDeleteExams = usePermission('exam:delete');
  const canPublishResults = usePermission('exam:publish');
  const isReadOnly = !canCreateExams && !canEditExams;

  const filtered = useMemo(
    () =>
      items.filter(
        exam =>
          (statusFilter === 'ALL' || exam.status === statusFilter) &&
          (typeFilter === 'ALL' || exam.examType === typeFilter),
      ),
    [items, statusFilter, typeFilter],
  );

  const upcomingCount = useMemo(() => {
    const now = new Date();
    return items.filter(exam => {
      const examDate = exam.scheduledDate instanceof Date
        ? exam.scheduledDate
        : exam.scheduledDate?.toDate?.() || new Date();
      return examDate >= now && exam.status !== 'COMPLETED' && exam.status !== 'CANCELLED';
    }).length;
  }, [items]);

  const scheduledCount = useMemo(() => items.filter(i => i.status === 'SCHEDULED').length, [items]);
  const inProgressCount = useMemo(() => items.filter(i => i.status === 'IN_PROGRESS').length, [items]);
  const completedCount = useMemo(() => items.filter(i => i.status === 'COMPLETED').length, [items]);

  const conflictCount = useMemo(() => {
    return items.filter(exam => exam.conflictWarnings && exam.conflictWarnings.length > 0).length;
  }, [items]);

  const handleStatusChange = (examId: string, status: ExamStatus) => {
    dispatch(updateExam({
      examId,
      updates: {status},
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterOptions}>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              onPress={() => setFn(option as any)}
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

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Exam Management</Text>
                <Text style={styles.subtitle}>
                  {user?.adminRole ? getRoleDisplayName(user.adminRole) : 'Administrator'} • Schedule & Analytics
                </Text>
              </View>
              <View style={styles.headerActions}>
                {canCreateExams && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('CreateExam')}>
                    <Text style={styles.addButtonText}>+ Create</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => navigation.navigate('ExamCalendar')}>
                  <Text style={styles.calendarButtonText}>📅 Calendar</Text>
                </TouchableOpacity>
                {isReadOnly && (
                  <View style={styles.readOnlyBadge}>
                    <Text style={styles.readOnlyText}>View Only</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{upcomingCount}</Text>
                <Text style={styles.metricLabel}>Upcoming</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{scheduledCount}</Text>
                <Text style={styles.metricLabel}>Scheduled</Text>
              </View>
              <View style={[styles.metricCard, inProgressCount > 0 && styles.metricActive]}>
                <Text style={[styles.metricValue, inProgressCount > 0 && styles.metricValueActive]}>
                  {inProgressCount}
                </Text>
                <Text style={styles.metricLabel}>In Progress</Text>
              </View>
              {conflictCount > 0 && (
                <View style={[styles.metricCard, styles.metricAlert]}>
                  <Text style={styles.metricValueAlert}>{conflictCount}</Text>
                  <Text style={styles.metricLabel}>Conflicts</Text>
                </View>
              )}
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{completedCount}</Text>
                <Text style={styles.metricLabel}>Completed</Text>
              </View>
            </View>

            {renderFilters(statusFilter, setStatusFilter, statuses, 'Status')}
            {renderFilters(typeFilter, setTypeFilter, types, 'Type')}
          </>
        }
        renderItem={({item}) => (
          <View style={styles.cardWrapper}>
            <ExamCard
              exam={item}
              onPress={() => navigation.navigate('ExamDetail', {exam: item})}
            />
            {canEditExams && item.status === 'DRAFT' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionSchedule]}
                  onPress={() => handleStatusChange(item.id, 'SCHEDULED')}
                  disabled={updating}>
                  <Text style={styles.actionText}>Schedule</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          items.length === 0 ? (
            <EmptyState variant="no-exams" />
          ) : (
            <EmptyState variant="no-results" />
          )
        }
        contentContainerStyle={{paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  calendarButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  calendarButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c1222',
  },
  subtitle: {
    fontSize: 13,
    color: '#5a6a7a',
    marginTop: 2,
  },
  readOnlyBadge: {
    backgroundColor: '#e8f0f8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e0f0',
  },
  readOnlyText: {
    fontSize: 11,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    alignItems: 'center',
  },
  metricAlert: {
    borderColor: '#e74c3c',
    backgroundColor: '#fef5f5',
  },
  metricActive: {
    borderColor: '#f39c12',
    backgroundColor: '#fffbf0',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0c1222',
  },
  metricValueAlert: {
    color: '#c0392b',
  },
  metricValueActive: {
    color: '#d68910',
  },
  metricLabel: {
    fontSize: 10,
    color: '#7a8a9a',
    marginTop: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  filterRow: {
    marginBottom: 10,
  },
  filterLabel: {
    fontWeight: '600',
    color: '#3a4a5a',
    marginBottom: 6,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4dce6',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  chipText: {
    color: '#3a4a5a',
    fontWeight: '600',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#fff',
  },
  cardWrapper: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionSchedule: {
    backgroundColor: '#3498db',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default ExamDashboard;

