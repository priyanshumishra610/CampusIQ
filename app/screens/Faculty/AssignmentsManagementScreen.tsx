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
import {
  fetchCourseAssignments,
  fetchAssignmentSubmissions,
  setCurrentAssignment,
} from '../../redux/slices/assignmentSlice';
import {createAssignment, publishAssignment} from '../../services/assignment.service';
import {EmptyState, SkeletonList} from '../../components/Common';
import {getCourses} from '../../services/courses.service';

const AssignmentsManagementScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {assignments, submissions, loading} = useSelector(
    (state: RootState) => state.assignment,
  );

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      dispatch(fetchCourseAssignments({courseId: selectedCourse}) as any);
    }
  }, [dispatch, selectedCourse]);

  const loadCourses = async () => {
    if (!user?.id) return;
    try {
      // Get courses taught by this faculty
      const coursesData = await getCourses({facultyId: user.id});
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesData[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleCreateAssignment = () => {
    navigation.navigate('CreateAssignment', {courseId: selectedCourse});
  };

  const handleViewSubmissions = async (assignmentId: string) => {
    dispatch(fetchAssignmentSubmissions(assignmentId) as any);
    navigation.navigate('AssignmentSubmissions', {assignmentId});
  };

  const handlePublish = async (assignmentId: string) => {
    try {
      await publishAssignment(assignmentId);
      Alert.alert('Success', 'Assignment published successfully!');
      if (selectedCourse) {
        dispatch(fetchCourseAssignments({courseId: selectedCourse}) as any);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to publish assignment');
    }
  };

  const renderAssignment = ({item}: {item: typeof assignments[0]}) => {
    const isPublished = item.status === 'PUBLISHED';
    const submissionCount = submissions.filter(s => s.assignmentId === item.id).length;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AssignmentDetail', {assignmentId: item.id})}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.courseCode}>{item.courseCode}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isPublished
                ? {backgroundColor: '#27ae6015', borderColor: '#27ae60'}
                : {backgroundColor: '#f39c1215', borderColor: '#f39c12'},
            ]}>
            <Text
              style={[
                styles.statusText,
                {color: isPublished ? '#27ae60' : '#f39c12'},
              ]}>
              {item.status}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.dueDate}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </Text>
          <Text style={styles.marks}>Max Marks: {item.maxMarks}</Text>
          {isPublished && (
            <Text style={styles.submissions}>
              {submissionCount} submission{submissionCount !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <View style={styles.cardActions}>
          {!isPublished && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePublish(item.id)}>
              <Text style={styles.actionButtonText}>Publish</Text>
            </TouchableOpacity>
          )}
          {isPublished && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonView]}
              onPress={() => handleViewSubmissions(item.id)}>
              <Text style={styles.actionButtonText}>View Submissions</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && assignments.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assignments</Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignments</Text>
        <Text style={styles.headerSubtitle}>Manage your course assignments</Text>
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

      {selectedCourse && (
        <>
          <View style={styles.createButtonContainer}>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateAssignment}>
              <Text style={styles.createButtonText}>+ Create Assignment</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={assignments}
            keyExtractor={item => item.id}
            renderItem={renderAssignment}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                variant="no-results"
                customTitle="No assignments"
                customMessage="Create your first assignment to get started"
              />
            }
          />
        </>
      )}

      {courses.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No courses assigned</Text>
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
  createButtonContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
  },
  createButton: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 4,
    lineHeight: 22,
  },
  courseCode: {
    fontSize: 12,
    color: '#7a8a9a',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: 6,
    marginBottom: 12,
  },
  dueDate: {
    fontSize: 13,
    color: '#5a6a7a',
    fontWeight: '500',
  },
  marks: {
    fontSize: 13,
    color: '#7a8a9a',
  },
  submissions: {
    fontSize: 12,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#27ae60',
    alignItems: 'center',
  },
  actionButtonView: {
    backgroundColor: '#1e3a5f',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
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

export default AssignmentsManagementScreen;

