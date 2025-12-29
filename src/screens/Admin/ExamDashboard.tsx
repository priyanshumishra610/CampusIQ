import React, {useMemo, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import ExamCard from '../../components/ExamCard';
import EmptyState from '../../components/EmptyState';
import PermissionGate, {usePermission} from '../../components/PermissionGate';
import Button from '../../components/Button';
import {
  Exam,
  ExamStatus,
  ExamType,
  updateExam,
} from '../../redux/examSlice';
import {RootState} from '../../redux/store';
import {getRoleDisplayName} from '../../config/permissions';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

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
                  <Button
                    title="Create"
                    onPress={() => navigation.navigate('CreateExam')}
                    variant="primary"
                    size="sm"
                    style={styles.headerButton}
                  />
                )}
                <TouchableOpacity
                  style={styles.calendarButton}
                  onPress={() => navigation.navigate('ExamCalendar')}
                  activeOpacity={0.7}>
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
                <Button
                  title="Schedule"
                  onPress={() => handleStatusChange(item.id, 'SCHEDULED')}
                  variant="primary"
                  size="sm"
                  disabled={updating}
                  loading={updating}
                  style={styles.actionButton}
                />
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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  headerButton: {
    minWidth: 80,
  },
  calendarButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  calendarButtonText: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.sm * 1.5,
  },
  readOnlyBadge: {
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  readOnlyText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 88,
    justifyContent: 'center',
    ...shadows.sm,
  },
  metricAlert: {
    borderColor: colors.error + '30',
    backgroundColor: colors.error + '08',
  },
  metricActive: {
    borderColor: colors.status.inProgress + '30',
    backgroundColor: colors.status.inProgress + '08',
  },
  metricValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  metricValueAlert: {
    color: colors.error,
  },
  metricValueActive: {
    color: colors.status.inProgress,
  },
  metricLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
  cardWrapper: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionButton: {
    flex: 1,
    maxWidth: 200,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
});

export default ExamDashboard;

