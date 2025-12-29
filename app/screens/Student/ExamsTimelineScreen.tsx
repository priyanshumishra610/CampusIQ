import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {fetchExams} from '../../redux/slices/examSlice';
import {EmptyState, SkeletonList, RetryButton} from '../../components/Common';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';
import moment from 'moment';

const ExamsTimelineScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {exams, loading, error} = useSelector((state: RootState) => state.exam);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchExams({studentId: user.id}) as any);
    }
  }, [dispatch, user]);

  const now = Date.now();
  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => a.scheduledDate - b.scheduledDate);
  }, [exams]);

  const upcomingExams = useMemo(() => {
    return sortedExams.filter(exam => exam.scheduledDate > now);
  }, [sortedExams, now]);

  const pastExams = useMemo(() => {
    return sortedExams.filter(exam => exam.scheduledDate <= now);
  }, [sortedExams, now]);

  const getDaysUntil = (date: number) => {
    const days = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Past';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  const getStatusColor = (date: number) => {
    const days = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (days < 0) return Colors.textMuted;
    if (days <= 3) return Colors.error;
    if (days <= 7) return Colors.warning;
    return Colors.success;
  };

  const handleRetry = () => {
    if (user?.id) {
      dispatch(fetchExams({studentId: user.id}) as any);
    }
  };

  const renderExamCard = (exam: typeof exams[0], isPast: boolean = false) => {
    const daysUntil = getDaysUntil(exam.scheduledDate);
    const statusColor = getStatusColor(exam.scheduledDate);
    const examDate = new Date(exam.scheduledDate);

    return (
      <TouchableOpacity
        key={exam.id}
        style={styles.examCard}
        onPress={() => navigation.navigate('ExamDetail', {examId: exam.id})}>
        <View style={styles.examCardHeader}>
          <View style={styles.examCardLeft}>
            <Text style={styles.examCourseCode}>{exam.courseCode}</Text>
            <Text style={styles.examTitle} numberOfLines={2}>
              {exam.title}
            </Text>
            <Text style={styles.examType}>{exam.type}</Text>
          </View>
          {!isPast && (
            <View style={[styles.daysBadge, {backgroundColor: `${statusColor}15`}]}>
              <Text style={[styles.daysText, {color: statusColor}]}>{daysUntil}</Text>
            </View>
          )}
        </View>

        <View style={styles.examCardBody}>
          <View style={styles.examInfoRow}>
            <Text style={styles.examInfoLabel}>Date:</Text>
            <Text style={styles.examInfoValue}>
              {moment(examDate).format('MMM DD, YYYY')}
            </Text>
          </View>
          <View style={styles.examInfoRow}>
            <Text style={styles.examInfoLabel}>Time:</Text>
            <Text style={styles.examInfoValue}>
              {moment(examDate).format('hh:mm A')}
            </Text>
          </View>
          <View style={styles.examInfoRow}>
            <Text style={styles.examInfoLabel}>Duration:</Text>
            <Text style={styles.examInfoValue}>{exam.duration} minutes</Text>
          </View>
          {exam.venue && (
            <View style={styles.examInfoRow}>
              <Text style={styles.examInfoLabel}>Venue:</Text>
              <Text style={styles.examInfoValue} numberOfLines={1}>
                {exam.venue}
              </Text>
            </View>
          )}
        </View>

        {isPast && exam.status === 'COMPLETED' && exam.resultPublished && (
          <View style={styles.resultBadge}>
            <Text style={styles.resultText}>Result Published</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && exams.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exams Timeline</Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error && exams.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exams Timeline</Text>
        </View>
        <RetryButton onPress={handleRetry} message={error} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exams Timeline</Text>
        <Text style={styles.headerSubtitle}>
          {upcomingExams.length} upcoming, {pastExams.length} completed
        </Text>
      </View>

      {/* Semester Timeline Overview */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>Current Semester</Text>
        <View style={styles.timelineStats}>
          <View style={styles.timelineStat}>
            <Text style={styles.timelineStatValue}>{sortedExams.length}</Text>
            <Text style={styles.timelineStatLabel}>Total Exams</Text>
          </View>
          <View style={styles.timelineStat}>
            <Text style={[styles.timelineStatValue, {color: Colors.warning}]}>
              {upcomingExams.length}
            </Text>
            <Text style={styles.timelineStatLabel}>Upcoming</Text>
          </View>
          <View style={styles.timelineStat}>
            <Text style={[styles.timelineStatValue, {color: Colors.success}]}>
              {pastExams.length}
            </Text>
            <Text style={styles.timelineStatLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Upcoming Exams</Text>
          {upcomingExams.map(exam => renderExamCard(exam, false))}
        </View>
      )}

      {/* Past Exams */}
      {pastExams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✅ Completed Exams</Text>
          {pastExams.map(exam => renderExamCard(exam, true))}
        </View>
      )}

      {sortedExams.length === 0 && (
        <EmptyState
          variant="no-exams"
          customTitle="No exams scheduled"
          customMessage="Your exam schedule will appear here once exams are scheduled"
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    padding: Spacing.base,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryAccentLight,
  },
  timelineCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    ...Shadows.base,
  },
  timelineTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  timelineStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timelineStat: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.base,
  },
  timelineStatValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  timelineStatLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: Typography.fontWeight.semibold,
  },
  section: {
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  examCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.base,
  },
  examCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  examCardLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  examCourseCode: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  examTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
  },
  examType: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  daysBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.base,
  },
  daysText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  examCardBody: {
    gap: Spacing.xs,
  },
  examInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examInfoLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    width: 80,
    fontWeight: Typography.fontWeight.semibold,
  },
  examInfoValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  resultBadge: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  resultText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.success,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default ExamsTimelineScreen;

