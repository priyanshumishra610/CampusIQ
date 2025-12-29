import React, {useEffect} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {fetchFacultyTimetable} from '../../redux/slices';
import {useTheme} from '../../theme/ThemeContext';
import {PremiumCard, MetricTile, ActionButton, EmptyState, SkeletonLoader} from '../../components/Common';
import {Typography, Spacing, BorderRadius} from '../../theme/designTokens';

const FacultyDashboard = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {colors} = useTheme();
  const {user} = useSelector((state: RootState) => state.auth);
  const {entries, currentClass, nextClass, loading} = useSelector(
    (state: RootState) => state.timetable,
  );

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchFacultyTimetable({facultyId: user.id}) as any);
    }
  }, [dispatch, user]);

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <Text style={styles.greeting}>Welcome, {user?.name?.split(' ')[0]}!</Text>
        <Text style={[styles.subtitle, {color: colors.primaryAccentLight}]}>
          Faculty Dashboard
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        {loading ? (
          <>
            <SkeletonLoader width="30%" height={100} borderRadius={BorderRadius.lg} />
            <SkeletonLoader width="30%" height={100} borderRadius={BorderRadius.lg} />
            <SkeletonLoader width="30%" height={100} borderRadius={BorderRadius.lg} />
          </>
        ) : (
          <>
            <MetricTile
              value={entries.length}
              label="Total Classes"
              icon="class"
              variant="highlight"
            />
            <MetricTile
              value={currentClass ? 1 : 0}
              label="Active Now"
              icon="radio-button-checked"
              variant={currentClass ? 'highlight' : 'default'}
            />
            <MetricTile
              value={nextClass ? 1 : 0}
              label="Upcoming"
              icon="schedule"
              variant="default"
            />
          </>
        )}
      </View>

      {/* Current Class */}
      {currentClass && (
        <PremiumCard
          variant="elevated"
          style={styles.classCard}
          onPress={() => navigation.navigate('MarkAttendance', {courseId: currentClass.courseId})}>
          <View style={styles.classHeader}>
            <Text style={[styles.classCardTitle, {color: colors.textSecondary}]}>
              Current Class
            </Text>
            <Text style={[styles.classTime, {color: colors.textMuted}]}>
              {currentClass.startTime} - {currentClass.endTime}
            </Text>
          </View>
          <Text style={[styles.className, {color: colors.textPrimary}]}>
            {currentClass.courseName}
          </Text>
          <Text style={[styles.classLocation, {color: colors.textTertiary}]}>
            {currentClass.building} - {currentClass.room}
          </Text>
          <View style={styles.buttonContainer}>
            <ActionButton
              label="Mark Attendance"
              onPress={() => navigation.navigate('MarkAttendance', {courseId: currentClass.courseId})}
              variant="primary"
              size="md"
              style={styles.markButton}
            />
          </View>
        </PremiumCard>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionButton
            label="Mark Attendance"
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
            label="Analytics"
            onPress={() => navigation.navigate('Analytics')}
            variant="outline"
            size="md"
            style={styles.actionButton}
          />
          <ActionButton
            label="Student Insights"
            onPress={() => navigation.navigate('StudentPerformanceInsights')}
            variant="outline"
            size="md"
            style={styles.actionButton}
          />
        </View>
      </View>

      {/* Next Class */}
      {nextClass && !currentClass && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {color: colors.textPrimary}]}>Next Class</Text>
          <PremiumCard variant="outlined" style={styles.classCard}>
            <Text style={[styles.className, {color: colors.textPrimary}]}>
              {nextClass.courseName}
            </Text>
            <Text style={[styles.classTime, {color: colors.textMuted}]}>
              {nextClass.startTime} - {nextClass.endTime}
            </Text>
            <Text style={[styles.classLocation, {color: colors.textTertiary}]}>
              {nextClass.building} - {nextClass.room}
            </Text>
          </PremiumCard>
        </View>
      )}

      {!currentClass && !nextClass && !loading && (
        <View style={styles.emptyContainer}>
          <EmptyState variant="no-classes" />
        </View>
      )}
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
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
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
    marginBottom: Spacing.xs,
  },
  classLocation: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
  buttonContainer: {
    marginTop: Spacing.base,
  },
  markButton: {
    width: '100%',
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
  emptyContainer: {
    padding: Spacing.xl,
  },
});

export default FacultyDashboard;
