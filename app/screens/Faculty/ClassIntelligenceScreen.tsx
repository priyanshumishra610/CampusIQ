import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {EmptyState, SkeletonLoader} from '../../components/Common';
import {getCourses} from '../../services/courses.service';
import {getCourseAttendance} from '../../services/attendance.service';
import {getCourseAssignments} from '../../services/assignment.service';

const ClassIntelligenceScreen = () => {
  const {user} = useSelector((state: RootState) => state.auth);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      loadAnalytics();
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    if (!user?.id) return;
    try {
      const coursesData = await getCourses({facultyId: user.id});
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadAnalytics = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      // Get attendance data
      const attendanceRecords = await getCourseAttendance(selectedCourse);
      
      // Get assignment data
      const assignments = await getCourseAssignments(selectedCourse);

      // Calculate analytics
      const totalStudents = new Set(attendanceRecords.map((r: any) => r.studentId)).size;
      const totalClasses = new Set(attendanceRecords.map((r: any) => r.date)).size;
      
      const presentCount = attendanceRecords.filter((r: any) => r.status === 'PRESENT').length;
      const absentCount = attendanceRecords.filter((r: any) => r.status === 'ABSENT').length;
      const averageAttendance = totalClasses > 0 
        ? Math.round((presentCount / (totalClasses * totalStudents)) * 100)
        : 0;

      // At-risk students (attendance < 75%)
      const studentAttendance: Record<string, {present: number; total: number}> = {};
      attendanceRecords.forEach((record: any) => {
        if (!studentAttendance[record.studentId]) {
          studentAttendance[record.studentId] = {present: 0, total: 0};
        }
        studentAttendance[record.studentId].total++;
        if (record.status === 'PRESENT' || record.status === 'LATE') {
          studentAttendance[record.studentId].present++;
        }
      });

      const atRiskStudents = Object.entries(studentAttendance)
        .filter(([_, data]) => {
          const percentage = data.total > 0 ? (data.present / data.total) * 100 : 0;
          return percentage < 75;
        })
        .map(([studentId]) => studentId);

      setAnalytics({
        totalStudents,
        totalClasses,
        averageAttendance,
        presentCount,
        absentCount,
        atRiskCount: atRiskStudents.length,
        totalAssignments: assignments.length,
        publishedAssignments: assignments.filter((a: any) => a.status === 'PUBLISHED').length,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <View style={styles.container}>
        <SkeletonLoader width="100%" height={200} style={styles.skeleton} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Class Intelligence</Text>
        <Text style={styles.headerSubtitle}>Performance analytics and insights</Text>
      </View>

      {courses.length > 0 && (
        <View style={styles.courseSelector}>
          <Text style={styles.selectorLabel}>Select Course</Text>
          <View style={styles.courseChips}>
            {courses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseChip,
                  selectedCourse === course.id && styles.courseChipActive,
                ]}
                onPress={() => setSelectedCourse(course.id)}>
                <Text
                  style={[
                    styles.courseChipText,
                    selectedCourse === course.id && styles.courseChipTextActive,
                  ]}>
                  {course.code || course.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {analytics && (
        <>
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{analytics.totalStudents}</Text>
              <Text style={styles.metricLabel}>Total Students</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{analytics.totalClasses}</Text>
              <Text style={styles.metricLabel}>Classes Held</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricValue, {color: '#27ae60'}]}>
                {analytics.averageAttendance}%
              </Text>
              <Text style={styles.metricLabel}>Avg Attendance</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attendance Overview</Text>
            <View style={styles.attendanceCard}>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Present</Text>
                <Text style={[styles.attendanceValue, {color: '#27ae60'}]}>
                  {analytics.presentCount}
                </Text>
              </View>
              <View style={styles.attendanceRow}>
                <Text style={styles.attendanceLabel}>Absent</Text>
                <Text style={[styles.attendanceValue, {color: '#e74c3c'}]}>
                  {analytics.absentCount}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>At-Risk Students</Text>
            <View style={[styles.riskCard, analytics.atRiskCount > 0 && styles.riskCardAlert]}>
              <Text style={styles.riskValue}>{analytics.atRiskCount}</Text>
              <Text style={styles.riskLabel}>
                Students with attendance below 75%
              </Text>
              {analytics.atRiskCount > 0 && (
                <Text style={styles.riskWarning}>
                  ⚠️ Action required: Review attendance patterns
                </Text>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignments</Text>
            <View style={styles.assignmentsCard}>
              <View style={styles.assignmentsRow}>
                <Text style={styles.assignmentsLabel}>Total</Text>
                <Text style={styles.assignmentsValue}>{analytics.totalAssignments}</Text>
              </View>
              <View style={styles.assignmentsRow}>
                <Text style={styles.assignmentsLabel}>Published</Text>
                <Text style={[styles.assignmentsValue, {color: '#27ae60'}]}>
                  {analytics.publishedAssignments}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Engagement Insights</Text>
            <View style={styles.insightsCard}>
              <Text style={styles.insightText}>
                📊 Average attendance is {analytics.averageAttendance}%
              </Text>
              <Text style={styles.insightText}>
                {analytics.averageAttendance >= 80
                  ? '✅ Excellent engagement levels'
                  : analytics.averageAttendance >= 70
                  ? '⚠️ Good, but room for improvement'
                  : '🔴 Low engagement - consider interventions'}
              </Text>
            </View>
          </View>
        </>
      )}

      {!selectedCourse && courses.length > 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Please select a course to view analytics</Text>
        </View>
      )}

      {courses.length === 0 && (
        <EmptyState
          variant="no-results"
          customTitle="No courses"
          customMessage="No courses assigned to view analytics"
        />
      )}
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
    fontSize: 13,
    color: '#a8c4e0',
  },
  courseSelector: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c1222',
    marginBottom: 12,
  },
  courseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  courseChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    backgroundColor: '#fff',
  },
  courseChipActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  courseChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7a8a9a',
  },
  courseChipTextActive: {
    color: '#fff',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c1222',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#7a8a9a',
    textTransform: 'uppercase',
    fontWeight: '600',
    textAlign: 'center',
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
  attendanceCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
  },
  attendanceLabel: {
    fontSize: 14,
    color: '#5a6a7a',
  },
  attendanceValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  riskCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    alignItems: 'center',
  },
  riskCardAlert: {
    backgroundColor: '#fef5f5',
    borderColor: '#e74c3c',
  },
  riskValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#e74c3c',
    marginBottom: 8,
  },
  riskLabel: {
    fontSize: 14,
    color: '#5a6a7a',
    textAlign: 'center',
    marginBottom: 8,
  },
  riskWarning: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
    textAlign: 'center',
  },
  assignmentsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  assignmentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
  },
  assignmentsLabel: {
    fontSize: 14,
    color: '#5a6a7a',
  },
  assignmentsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
  },
  insightsCard: {
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  insightText: {
    fontSize: 14,
    color: '#0c1222',
    lineHeight: 22,
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#7a8a9a',
    textAlign: 'center',
  },
});

export default ClassIntelligenceScreen;

