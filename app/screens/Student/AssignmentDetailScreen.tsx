import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchAssignmentById,
  fetchStudentSubmission,
  setCurrentAssignment,
  setCurrentSubmission,
} from '../../redux/slices/assignmentSlice';
import {submitAssignment} from '../../services/assignment.service';
import {EmptyState, RetryButton, SkeletonLoader} from '../../components/Common';

const AssignmentDetailScreen = ({route, navigation}: any) => {
  const {assignmentId} = route.params;
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {currentAssignment, currentSubmission, loading} = useSelector(
    (state: RootState) => state.assignment,
  );

  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      dispatch(fetchAssignmentById(assignmentId) as any);
      if (user?.id) {
        dispatch(fetchStudentSubmission({assignmentId, studentId: user.id}) as any);
      }
    }

    return () => {
      dispatch(setCurrentAssignment(null));
      dispatch(setCurrentSubmission(null));
    };
  }, [dispatch, assignmentId, user]);

  useEffect(() => {
    if (currentSubmission?.content) {
      setSubmissionText(currentSubmission.content);
    }
  }, [currentSubmission]);

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      Alert.alert('Error', 'Please enter your submission content');
      return;
    }

    if (!user?.id || !currentAssignment) return;

    setSubmitting(true);
    try {
      await submitAssignment(assignmentId, user.id, submissionText.trim());
      Alert.alert('Success', 'Assignment submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            dispatch(fetchStudentSubmission({assignmentId, studentId: user.id}) as any);
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !currentAssignment) {
    return (
      <View style={styles.container}>
        <SkeletonLoader width="100%" height={200} style={styles.skeleton} />
        <SkeletonLoader width="100%" height={300} style={styles.skeleton} />
      </View>
    );
  }

  if (!currentAssignment) {
    return (
      <View style={styles.container}>
        <EmptyState variant="no-results" customTitle="Assignment not found" />
      </View>
    );
  }

  const now = Date.now();
  const isOverdue = now > currentAssignment.dueDate;
  const isSubmitted = currentSubmission?.status === 'SUBMITTED' || currentSubmission?.status === 'LATE';
  const isGraded = currentSubmission?.status === 'GRADED';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.courseCode}>{currentAssignment.courseCode}</Text>
        <Text style={styles.title}>{currentAssignment.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.facultyName}>{currentAssignment.facultyName}</Text>
          <Text style={styles.marks}>Max: {currentAssignment.maxMarks} marks</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{currentAssignment.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Due Date</Text>
        <View style={[styles.dueDateCard, isOverdue && styles.dueDateCardOverdue]}>
          <Text style={styles.dueDateText}>
            {new Date(currentAssignment.dueDate).toLocaleDateString()} at{' '}
            {new Date(currentAssignment.dueDate).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          {isOverdue && (
            <Text style={styles.overdueLabel}>Overdue</Text>
          )}
        </View>
      </View>

      {isGraded && currentSubmission && (
        <View style={[styles.section, styles.gradeSection]}>
          <Text style={styles.sectionTitle}>Grade</Text>
          <View style={styles.gradeCard}>
            <Text style={styles.gradeValue}>
              {currentSubmission.marksObtained} / {currentAssignment.maxMarks}
            </Text>
            <Text style={styles.gradePercentage}>
              {Math.round((currentSubmission.marksObtained! / currentAssignment.maxMarks) * 100)}%
            </Text>
            {currentSubmission.feedback && (
              <Text style={styles.feedback}>{currentSubmission.feedback}</Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {isSubmitted ? 'Your Submission' : 'Submit Assignment'}
        </Text>
        {isSubmitted ? (
          <View style={styles.submissionCard}>
            <Text style={styles.submissionLabel}>
              Status: {currentSubmission?.status === 'LATE' ? 'Late Submission' : 'Submitted'}
            </Text>
            <Text style={styles.submissionText}>{currentSubmission?.content}</Text>
            <Text style={styles.submissionDate}>
              Submitted: {currentSubmission?.submittedAt
                ? new Date(currentSubmission.submittedAt).toLocaleString()
                : 'N/A'}
            </Text>
          </View>
        ) : (
          <View>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={8}
              placeholder="Enter your submission here..."
              value={submissionText}
              onChangeText={setSubmissionText}
              editable={!submitting}
            />
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Assignment</Text>
              )}
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a8a9a',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 12,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  facultyName: {
    fontSize: 14,
    color: '#5a6a7a',
    fontWeight: '500',
  },
  marks: {
    fontSize: 14,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#5a6a7a',
    lineHeight: 22,
  },
  dueDateCard: {
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  dueDateCardOverdue: {
    backgroundColor: '#fef5f5',
    borderColor: '#e74c3c',
  },
  dueDateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0c1222',
  },
  overdueLabel: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  gradeSection: {
    backgroundColor: '#f0f9f5',
    borderColor: '#27ae60',
  },
  gradeCard: {
    alignItems: 'center',
    padding: 16,
  },
  gradeValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#27ae60',
    marginBottom: 4,
  },
  gradePercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 12,
  },
  feedback: {
    fontSize: 14,
    color: '#5a6a7a',
    textAlign: 'center',
    lineHeight: 20,
  },
  submissionCard: {
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  submissionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a8a9a',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  submissionText: {
    fontSize: 14,
    color: '#0c1222',
    lineHeight: 22,
    marginBottom: 12,
  },
  submissionDate: {
    fontSize: 12,
    color: '#7a8a9a',
  },
  textInput: {
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#e4e8ec',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#0c1222',
    textAlignVertical: 'top',
    minHeight: 200,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AssignmentDetailScreen;

