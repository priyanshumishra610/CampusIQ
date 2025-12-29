import React, {useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchStudentTimetable,
  fetchStudentAttendanceSummary,
  fetchStudentAssignmentSummary,
} from '../../redux/slices';
import {fetchAnnouncements} from '../../redux/slices/announcementSlice';
import {useTheme} from '../../theme/ThemeContext';
import {PremiumCard, MetricTile, ActionButton, EmptyState, SkeletonLoader} from '../../components/Common';
import {Typography, Spacing, BorderRadius} from '../../theme/designTokens';

const StudentDashboard = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {colors} = useTheme();
  const {user} = useSelector((state: RootState) => state.auth);
  const {entries, currentClass, nextClass, loading: timetableLoading} = useSelector(
    (state: RootState) => state.timetable,
  );
  const {summary: attendanceSummary, loading: attendanceLoading} = useSelector(
    (state: RootState) => state.attendance,
  );
  const {summary: assignmentSummary, loading: assignmentLoading} = useSelector(
    (state: RootState) => state.assignment,
  );
  const {announcements, unreadCount, loading: announcementsLoading} = useSelector(
    (state: RootState) => state.announcement,
  );

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchStudentTimetable({studentId: user.id}) as any);
      dispatch(fetchStudentAttendanceSummary({studentId: user.id}) as any);
      dispatch(fetchStudentAssignmentSummary(user.id) as any);
      dispatch(fetchAnnouncements({userId: user.id, role: user.role, campusId: user.campusId}) as any);
    }
  }, [dispatch, user]);

  const overallAttendance =
    attendanceSummary.length > 0
      ? Math.round(
          attendanceSummary.reduce((sum, s) => sum + s.attendancePercentage, 0) /
            attendanceSummary.length,
        )
      : 0;

  const isLoading = timetableLoading || attendanceLoading || assignmentLoading || announcementsLoading;

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <Text style={styles.greeting}>Welcome back, {user?.name?.split(' ')[0]}!</Text>
        <Text style={[styles.subtitle, {color: colors.primaryAccentLight}]}>
          Here's your campus overview
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        {isLoading ? (
          <>
            <SkeletonLoader width="30%" height={100} borderRadius={BorderRadius.lg} />
            <SkeletonLoader width="30%" height={100} borderRadius={BorderRadius.lg} />
            <SkeletonLoader width="30%" height={100} borderRadius={BorderRadius.lg} />
          </>
        ) : (
          <>
            <MetricTile
              value={`${overallAttendance}%`}
              label="Attendance"
              icon="bar-chart"
              variant="highlight"
              onPress={() => navigation.navigate('Attendance')}
            />
            <MetricTile
              value={assignmentSummary?.pending || 0}
              label="Pending Assignments"
              icon="assignment"
              variant={assignmentSummary?.pending > 0 ? 'alert' : 'default'}
              onPress={() => navigation.navigate('Assignments')}
            />
            <MetricTile
              value={assignmentSummary?.overdue || 0}
              label="Overdue"
              icon="warning"
              variant={assignmentSummary?.overdue > 0 ? 'alert' : 'default'}
              onPress={() => navigation.navigate('Assignments')}
            />
          </>
        )}
      </View>

      {/* Current/Next Class */}
      {(currentClass || nextClass) && (
        <PremiumCard
          variant="elevated"
          style={styles.classCard}
          onPress={() => navigation.navigate('Timetable')}>
          <View style={styles.classHeader}>
            <Text style={[styles.classCardTitle, {color: colors.textSecondary}]}>
              {currentClass ? 'Current Class' : 'Next Class'}
            </Text>
            <Text style={[styles.classTime, {color: colors.textMuted}]}>
              {currentClass
                ? `${currentClass.startTime} - ${currentClass.endTime}`
                : nextClass
                ? `${nextClass.startTime} - ${nextClass.endTime}`
                : ''}
            </Text>
          </View>
          <Text style={[styles.className, {color: colors.textPrimary}]}>
            {currentClass?.courseName || nextClass?.courseName}
          </Text>
          {(currentClass || nextClass) && (
            <Text style={[styles.classLocation, {color: colors.textTertiary}]}>
              {currentClass
                ? `${currentClass.building} - ${currentClass.room}`
                : nextClass
                ? `${nextClass.building} - ${nextClass.room}`
                : ''}
            </Text>
          )}
        </PremiumCard>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionButton
            label="Timetable"
            onPress={() => navigation.navigate('Timetable')}
            variant="outline"
            size="md"
            style={styles.actionButton}
          />
          <ActionButton
            label="Attendance"
            onPress={() => navigation.navigate('Attendance')}
            variant="outline"
            size="md"
            style={styles.actionButton}
          />
          <ActionButton
            label="Assignments"
            onPress={() => navigation.navigate('Assignments')}
            variant="outline"
            size="md"
            style={styles.actionButton}
          />
          <ActionButton
            label="Exams"
            onPress={() => navigation.navigate('Exams')}
            variant="outline"
            size="md"
            style={styles.actionButton}
          />
        </View>
      </View>

      {/* Announcements */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Announcements</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, {backgroundColor: colors.error}]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {isLoading ? (
          <SkeletonLoader width="100%" height={80} borderRadius={BorderRadius.lg} style={styles.skeleton} />
        ) : announcements.length === 0 ? (
          <EmptyState variant="no-announcements" />
        ) : (
          announcements.slice(0, 3).map(announcement => (
            <PremiumCard
              key={announcement.id}
              variant="outlined"
              style={styles.announcementCard}
              onPress={() => navigation.navigate('AnnouncementDetail', {id: announcement.id})}>
              <Text style={[styles.announcementTitle, {color: colors.textPrimary}]}>
                {announcement.title}
              </Text>
              <Text style={[styles.announcementDate, {color: colors.textMuted}]}>
                {new Date(announcement.createdAt).toLocaleDateString()}
              </Text>
            </PremiumCard>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing['4xl'],
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.base,
    marginTop: -Spacing['2xl'],
  },
  section: {
    padding: Spacing.base,
    marginTop: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    flex: 1,
  },
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  classCard: {
    margin: Spacing.base,
    marginTop: Spacing.base,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  classCardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  className: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  classTime: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  classLocation: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  announcementCard: {
    marginBottom: Spacing.base,
  },
  announcementTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  announcementDate: {
    fontSize: Typography.fontSize.xs,
  },
  skeleton: {
    marginBottom: Spacing.base,
  },
});

export default StudentDashboard;
