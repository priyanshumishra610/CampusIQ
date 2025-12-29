import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {EmptyState, SkeletonLoader} from '../../components/Common';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';
import {getCourses, getCourseStudents} from '../../services/courses.service';
import {getStudentAttendanceStats} from '../../services/attendance.service';
import apiClient from '../../services/api.client';

interface StudentPerformance {
  studentId: string;
  studentName: string;
  attendancePercentage: number;
  averageGrade: number;
  assignmentsSubmitted: number;
  assignmentsTotal: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

const StudentPerformanceInsightsScreen = ({route, navigation}: any) => {
  const {courseId} = route.params || {};
  const {user} = useSelector((state: RootState) => state.auth);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId || '');
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourseId) {
      loadStudentPerformance();
    }
  }, [selectedCourseId]);

  const loadCourses = async () => {
    if (!user?.id) return;
    try {
      const coursesData = await getCourses({facultyId: user.id});
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourseId) {
        setSelectedCourseId(coursesData[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadStudentPerformance = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      // Get enrolled students
      const students = await getCourseStudents(selectedCourseId);

      // Get student details
      const studentsData: StudentPerformance[] = [];
      for (const student of students) {
        const studentId = student.id;

        // Get attendance stats
        const attendanceStats = await getStudentAttendanceStats(studentId);
        const courseAttendance = attendanceStats.courseWise.find(c => c.courseId === selectedCourseId);
        const attendancePercentage = courseAttendance?.attendancePercentage || 0;

        // Get assignments
        const assignments = await apiClient.get(`/assignments/course/${selectedCourseId}`);
        const publishedAssignments = assignments.filter((a: any) => a.status === 'PUBLISHED').length;

        // Get submissions for this student
        let submissions: any[] = [];
        for (const assignment of assignments) {
          try {
            const submission = await apiClient.get(`/assignments/${assignment.id}/submission`, {studentId});
            if (submission) {
              submissions.push(submission);
            }
          } catch (error) {
            // Submission not found, continue
          }
        }

        const gradedSubmissions = submissions.filter((s: any) => s.status === 'GRADED');

        // Calculate average grade
        let averageGrade = 0;
        if (gradedSubmissions.length > 0) {
          const totalMarks = gradedSubmissions.reduce(
            (sum: number, s: any) => sum + (s.marksObtained || 0),
            0,
          );
          const maxMarks = gradedSubmissions.reduce(
            (sum: number, s: any) => sum + (s.marksObtained ? 100 : 0),
            0,
          );
          averageGrade = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
        }

        // Determine risk level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (attendancePercentage < 60 || averageGrade < 50) {
          riskLevel = 'HIGH';
        } else if (attendancePercentage < 75 || averageGrade < 65) {
          riskLevel = 'MEDIUM';
        }

        studentsData.push({
          studentId,
          studentName: student.name || 'Unknown',
          attendancePercentage,
          averageGrade,
          assignmentsSubmitted: submissions.length,
          assignmentsTotal: publishedAssignments,
          riskLevel,
        });
      }

      // Sort by risk level
      studentsData.sort((a, b) => {
        const riskOrder = {HIGH: 3, MEDIUM: 2, LOW: 1};
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
      });

      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading student performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return Colors.error;
      case 'MEDIUM':
        return Colors.warning;
      default:
        return Colors.success;
    }
  };

  const renderStudent = ({item}: {item: StudentPerformance}) => {
    const riskColor = getRiskColor(item.riskLevel);

    return (
      <TouchableOpacity
        style={[styles.studentCard, {borderLeftColor: riskColor, borderLeftWidth: 4}]}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.studentId}>{item.studentId}</Text>
          </View>
          <View style={[styles.riskBadge, {backgroundColor: `${riskColor}15`}]}>
            <Text style={[styles.riskText, {color: riskColor}]}>{item.riskLevel}</Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Attendance</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color:
                    item.attendancePercentage >= 75
                      ? Colors.success
                      : item.attendancePercentage >= 60
                      ? Colors.warning
                      : Colors.error,
                },
              ]}>
              {item.attendancePercentage}%
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Avg Grade</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color:
                    item.averageGrade >= 70
                      ? Colors.success
                      : item.averageGrade >= 50
                      ? Colors.warning
                      : Colors.error,
                },
              ]}>
              {item.averageGrade}%
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>Assignments</Text>
            <Text style={styles.metricValue}>
              {item.assignmentsSubmitted}/{item.assignmentsTotal}
            </Text>
          </View>
        </View>

        {item.riskLevel !== 'LOW' && (
          <View style={[styles.alertBox, {backgroundColor: `${riskColor}10`}]}>
            <Text style={[styles.alertText, {color: riskColor}]}>
              ⚠️ {item.riskLevel === 'HIGH' ? 'High Risk' : 'Medium Risk'} - Requires attention
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && students.length === 0) {
    return (
      <View style={styles.container}>
        <SkeletonLoader width="100%" height={200} style={styles.skeleton} />
      </View>
    );
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const highRiskCount = students.filter(s => s.riskLevel === 'HIGH').length;
  const mediumRiskCount = students.filter(s => s.riskLevel === 'MEDIUM').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Performance Insights</Text>
        <Text style={styles.headerSubtitle}>Per-class student analytics</Text>
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
                  selectedCourseId === course.id && styles.courseChipActive,
                ]}
                onPress={() => setSelectedCourseId(course.id)}>
                <Text
                  style={[
                    styles.courseChipText,
                    selectedCourseId === course.id && styles.courseChipTextActive,
                  ]}>
                  {course.code || course.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {selectedCourse && (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>{selectedCourse.name}</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryValue}>{students.length}</Text>
                <Text style={styles.summaryLabel}>Total Students</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryValue, {color: Colors.error}]}>
                  {highRiskCount}
                </Text>
                <Text style={styles.summaryLabel}>High Risk</Text>
              </View>
              <View style={styles.summaryStat}>
                <Text style={[styles.summaryValue, {color: Colors.warning}]}>
                  {mediumRiskCount}
                </Text>
                <Text style={styles.summaryLabel}>Medium Risk</Text>
              </View>
            </View>
          </View>

          <FlatList
            data={students}
            keyExtractor={item => item.studentId}
            renderItem={renderStudent}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                variant="no-students"
                customTitle="No students enrolled"
                customMessage="Student performance data will appear here"
              />
            }
          />
        </>
      )}

      {courses.length === 0 && (
        <EmptyState
          variant="no-results"
          customTitle="No courses"
          customMessage="No courses assigned to view student performance"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  skeleton: {
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    paddingBottom: Spacing.base,
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
  courseSelector: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectorLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  courseChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  courseChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  courseChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  courseChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
  },
  courseChipTextActive: {
    color: Colors.textInverse,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    margin: Spacing.base,
    borderRadius: BorderRadius.md,
    ...Shadows.base,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.base,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.base,
  },
  summaryValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: Typography.fontWeight.semibold,
  },
  listContent: {
    padding: Spacing.base,
  },
  studentCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.base,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  studentId: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  riskBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.base,
  },
  riskText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.base,
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    fontWeight: Typography.fontWeight.semibold,
  },
  metricValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  alertBox: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.base,
    marginTop: Spacing.sm,
  },
  alertText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
});

export default StudentPerformanceInsightsScreen;

