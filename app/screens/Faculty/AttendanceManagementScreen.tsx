import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {fetchCourseAttendance, fetchFacultyTimetable} from '../../redux/slices';
import {markAttendance, markBulkAttendance, AttendanceStatus} from '../../services/attendance.service';
import {EmptyState, SkeletonList, RetryButton} from '../../components/Common';
import {getCourseStudents} from '../../services/courses.service';

const AttendanceManagementScreen = ({route, navigation}: any) => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {entries} = useSelector((state: RootState) => state.timetable);
  const courseId = route?.params?.courseId;

  const [selectedCourse, setSelectedCourse] = useState<string | null>(courseId);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [today] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchFacultyTimetable({facultyId: user.id}) as any);
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (selectedCourse) {
      loadStudents();
      loadTodayAttendance();
    }
  }, [selectedCourse]);

  const loadStudents = async () => {
    if (!selectedCourse) return;
    setLoading(true);
    try {
      // Get enrolled students for the course
      const studentsData = await getCourseStudents(selectedCourse);
      setStudents(studentsData.map((s: any) => ({
        id: s.id,
        name: s.name || 'Unknown',
        enrollmentNumber: s.enrollmentNumber || '',
      })));
    } catch (error) {
      console.error('Error loading students:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAttendance = async () => {
    if (!selectedCourse) return;
    try {
      const records = await fetchCourseAttendance({courseId: selectedCourse, date: today});
      const attendanceMap: Record<string, AttendanceStatus> = {};
      records.forEach(record => {
        attendanceMap[record.studentId] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSave = async () => {
    if (!selectedCourse || !user?.id) return;

    setSaving(true);
    try {
      const records = students.map(student => ({
        studentId: student.id,
        courseId: selectedCourse,
        status: attendance[student.id] || 'ABSENT',
      }));

      await markBulkAttendance(records, user.id, selectedCourse);
      Alert.alert('Success', 'Attendance marked successfully!');
      loadTodayAttendance();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    students.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT':
        return '#27ae60';
      case 'ABSENT':
        return '#e74c3c';
      case 'LATE':
        return '#f39c12';
      case 'EXCUSED':
        return '#3498db';
      default:
        return '#7a8a9a';
    }
  };

  const renderStudent = ({item}: {item: typeof students[0]}) => {
    const currentStatus = attendance[item.id] || 'ABSENT';
    const statusColor = getStatusColor(currentStatus);

    return (
      <View style={styles.studentCard}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.name}</Text>
          {item.enrollmentNumber && (
            <Text style={styles.enrollmentNumber}>{item.enrollmentNumber}</Text>
          )}
        </View>
        <View style={styles.statusButtons}>
          {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusButton,
                currentStatus === status && [
                  styles.statusButtonActive,
                  {backgroundColor: `${getStatusColor(status)}15`, borderColor: getStatusColor(status)},
                ],
              ]}
              onPress={() => handleStatusChange(item.id, status)}>
              <Text
                style={[
                  styles.statusButtonText,
                  currentStatus === status && {color: getStatusColor(status), fontWeight: '700'},
                ]}>
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const courses = entries
    .map(e => ({id: e.courseId, name: e.courseName, code: e.courseCode}))
    .filter((course, index, self) => index === self.findIndex(c => c.id === course.id));

  if (loading && students.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <Text style={styles.headerSubtitle}>Select course and mark attendance for today</Text>
      </View>

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
                {course.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedCourse && (
        <>
          <View style={styles.bulkActions}>
            <Text style={styles.bulkLabel}>Mark All:</Text>
            {(['PRESENT', 'ABSENT'] as AttendanceStatus[]).map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.bulkButton, {backgroundColor: `${getStatusColor(status)}15`}]}
                onPress={() => handleMarkAll(status)}>
                <Text style={[styles.bulkButtonText, {color: getStatusColor(status)}]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={students}
            keyExtractor={item => item.id}
            renderItem={renderStudent}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                variant="no-results"
                customTitle="No students"
                customMessage="No students enrolled in this course"
              />
            }
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Attendance</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {!selectedCourse && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Please select a course to mark attendance</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#1e3a5f',
    padding: 20,
    paddingBottom: 16,
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
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
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
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
    gap: 8,
  },
  bulkLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c1222',
    marginRight: 8,
  },
  bulkButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  bulkButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  studentInfo: {
    marginBottom: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 4,
  },
  enrollmentNumber: {
    fontSize: 12,
    color: '#7a8a9a',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    backgroundColor: '#f5f7fa',
    alignItems: 'center',
  },
  statusButtonActive: {
    borderWidth: 2,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a8a9a',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e4e8ec',
  },
  saveButton: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
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

export default AttendanceManagementScreen;

