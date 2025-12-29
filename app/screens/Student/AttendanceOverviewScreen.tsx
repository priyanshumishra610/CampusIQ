import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchStudentAttendanceSummary,
  fetchStudentAttendanceStats,
} from '../../redux/slices/attendanceSlice';
import {EmptyState, SkeletonLoader, RetryButton} from '../../components/Common';

const AttendanceOverviewScreen = () => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {summary, stats, loading, error} = useSelector(
    (state: RootState) => state.attendance,
  );

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchStudentAttendanceSummary({studentId: user.id}) as any);
      dispatch(fetchStudentAttendanceStats(user.id) as any);
    }
  }, [dispatch, user]);

  const overallAttendance = useMemo(() => {
    if (summary.length === 0) return 0;
    return Math.round(
      summary.reduce((sum, s) => sum + s.attendancePercentage, 0) / summary.length,
    );
  }, [summary]);

  const getRiskLevel = (percentage: number) => {
    if (percentage >= 75) return {level: 'SAFE', color: '#27ae60'};
    if (percentage >= 60) return {level: 'WARNING', color: '#f39c12'};
    return {level: 'RISK', color: '#e74c3c'};
  };

  const handleRetry = () => {
    if (user?.id) {
      dispatch(fetchStudentAttendanceSummary({studentId: user.id}) as any);
      dispatch(fetchStudentAttendanceStats(user.id) as any);
    }
  };

  if (loading && summary.length === 0) {
    return (
      <View style={styles.container}>
        <SkeletonLoader width="100%" height={200} style={styles.skeleton} />
        <SkeletonLoader width="100%" height={300} style={styles.skeleton} />
      </View>
    );
  }

  if (error && summary.length === 0) {
    return (
      <View style={styles.container}>
        <RetryButton onPress={handleRetry} message={error} />
      </View>
    );
  }

  const overallRisk = getRiskLevel(overallAttendance);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance Overview</Text>
        <Text style={styles.headerSubtitle}>Your attendance statistics</Text>
      </View>

      <View style={styles.overallCard}>
        <Text style={styles.overallLabel}>Overall Attendance</Text>
        <Text style={[styles.overallValue, {color: overallRisk.color}]}>
          {overallAttendance}%
        </Text>
        <View style={[styles.riskBadge, {backgroundColor: `${overallRisk.color}15`}]}>
          <Text style={[styles.riskText, {color: overallRisk.color}]}>
            {overallRisk.level}
          </Text>
        </View>
      </View>

      {stats && (
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalClasses || 0}</Text>
              <Text style={styles.statLabel}>Total Classes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: '#27ae60'}]}>
                {stats.presentCount || 0}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: '#e74c3c'}]}>
                {stats.absentCount || 0}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subject-wise Attendance</Text>
        {summary.length === 0 ? (
          <EmptyState
            variant="no-results"
            customTitle="No attendance data"
            customMessage="Your attendance records will appear here"
          />
        ) : (
          summary.map((item, index) => {
            const risk = getRiskLevel(item.attendancePercentage);
            return (
              <View key={index} style={styles.subjectCard}>
                <View style={styles.subjectHeader}>
                  <View style={styles.subjectInfo}>
                    <Text style={styles.subjectName}>{item.courseName}</Text>
                    <Text style={styles.subjectCode}>{item.courseCode}</Text>
                  </View>
                  <View style={[styles.percentageBadge, {backgroundColor: `${risk.color}15`}]}>
                    <Text style={[styles.percentageText, {color: risk.color}]}>
                      {item.attendancePercentage}%
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${item.attendancePercentage}%`,
                        backgroundColor: risk.color,
                      },
                    ]}
                  />
                </View>
                <View style={styles.subjectStats}>
                  <Text style={styles.subjectStatText}>
                    Present: {item.presentCount} / Total: {item.totalClasses}
                  </Text>
                  {item.attendancePercentage < 75 && (
                    <Text style={[styles.warningText, {color: risk.color}]}>
                      ⚠️ Below 75% threshold
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 16,
  },
  skeleton: {
    marginBottom: 16,
    borderRadius: 12,
  },
  header: {
    backgroundColor: '#1e3a5f',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#a8c4e0',
  },
  overallCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overallLabel: {
    fontSize: 14,
    color: '#7a8a9a',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  overallValue: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statsCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7a8a9a',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 12,
  },
  subjectCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 4,
  },
  subjectCode: {
    fontSize: 12,
    color: '#7a8a9a',
    textTransform: 'uppercase',
  },
  percentageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e4e8ec',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  subjectStats: {
    gap: 4,
  },
  subjectStatText: {
    fontSize: 12,
    color: '#7a8a9a',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default AttendanceOverviewScreen;

