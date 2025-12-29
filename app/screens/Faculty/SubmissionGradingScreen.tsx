import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchAssignmentSubmissions,
  gradeSubmission,
} from '../../redux/slices/assignmentSlice';
import {EmptyState, SkeletonList, RetryButton} from '../../components/Common';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';

const SubmissionGradingScreen = ({route, navigation}: any) => {
  const {assignmentId} = route.params;
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {submissions, currentAssignment, loading, error} = useSelector(
    (state: RootState) => state.assignment,
  );

  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    if (assignmentId) {
      dispatch(fetchAssignmentSubmissions(assignmentId) as any);
    }
  }, [dispatch, assignmentId]);

  const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId);
  const ungradedSubmissions = assignmentSubmissions.filter(
    s => s.status !== 'GRADED',
  );
  const gradedSubmissions = assignmentSubmissions.filter(s => s.status === 'GRADED');

  const handleGrade = async (submissionId: string) => {
    if (!marks || isNaN(Number(marks)) || Number(marks) < 0) {
      Alert.alert('Error', 'Please enter valid marks');
      return;
    }

    if (!currentAssignment) {
      Alert.alert('Error', 'Assignment not found');
      return;
    }

    if (Number(marks) > currentAssignment.maxMarks) {
      Alert.alert('Error', `Marks cannot exceed ${currentAssignment.maxMarks}`);
      return;
    }

    setGrading(true);
    try {
      await dispatch(
        gradeSubmission({
          submissionId,
          marksObtained: Number(marks),
          feedback: feedback.trim() || undefined,
        }) as any,
      ).unwrap();

      Alert.alert('Success', 'Submission graded successfully!');
      setSelectedSubmission(null);
      setMarks('');
      setFeedback('');
      dispatch(fetchAssignmentSubmissions(assignmentId) as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const renderSubmission = ({item}: {item: typeof assignmentSubmissions[0]}) => {
    const isGraded = item.status === 'GRADED';
    const isSelected = selectedSubmission === item.id;
    const studentName = item.studentName || 'Unknown Student';

    return (
      <TouchableOpacity
        style={[styles.submissionCard, isSelected && styles.submissionCardSelected]}
        onPress={() => {
          setSelectedSubmission(item.id);
          if (isGraded && item.marksObtained !== undefined) {
            setMarks(item.marksObtained.toString());
            setFeedback(item.feedback || '');
          } else {
            setMarks('');
            setFeedback('');
          }
        }}>
        <View style={styles.submissionHeader}>
          <View style={styles.submissionHeaderLeft}>
            <Text style={styles.studentName}>{studentName}</Text>
            <Text style={styles.studentId}>{item.studentId}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isGraded
                ? {backgroundColor: Colors.successLight}
                : {backgroundColor: Colors.warningLight},
            ]}>
            <Text
              style={[
                styles.statusText,
                {color: isGraded ? Colors.success : Colors.warning},
              ]}>
              {isGraded ? 'Graded' : 'Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.submissionBody}>
          <Text style={styles.submissionLabel}>Submitted:</Text>
          <Text style={styles.submissionText}>
            {item.submittedAt
              ? new Date(item.submittedAt).toLocaleString()
              : 'N/A'}
          </Text>
        </View>

        {isGraded && item.marksObtained !== undefined && currentAssignment && (
          <View style={styles.gradeInfo}>
            <Text style={styles.gradeText}>
              {item.marksObtained} / {currentAssignment.maxMarks} marks
            </Text>
            {item.feedback && (
              <Text style={styles.feedbackText} numberOfLines={2}>
                {item.feedback}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const selectedSubmissionData = assignmentSubmissions.find(
    s => s.id === selectedSubmission,
  );

  if (loading && assignmentSubmissions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Grade Submissions</Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error && assignmentSubmissions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Grade Submissions</Text>
        </View>
        <RetryButton
          onPress={() => dispatch(fetchAssignmentSubmissions(assignmentId) as any)}
          message={error}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grade Submissions</Text>
        <Text style={styles.headerSubtitle}>
          {ungradedSubmissions.length} pending, {gradedSubmissions.length} graded
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.submissionsList}>
          <Text style={styles.sectionTitle}>Submissions</Text>
          <FlatList
            data={[...ungradedSubmissions, ...gradedSubmissions]}
            keyExtractor={item => item.id}
            renderItem={renderSubmission}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                variant="no-submissions"
                customTitle="No submissions"
                customMessage="Student submissions will appear here"
              />
            }
          />
        </View>

        {selectedSubmissionData && (
          <View style={styles.gradingPanel}>
            <Text style={styles.gradingTitle}>
              Grade: {selectedSubmissionData.studentName}
            </Text>

            <View style={styles.gradingForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Marks (Max: {currentAssignment?.maxMarks || 0}) *
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter marks"
                  value={marks}
                  onChangeText={setMarks}
                  keyboardType="numeric"
                  editable={selectedSubmissionData.status !== 'GRADED'}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Feedback</Text>
                <TextInput
                  style={[styles.formInput, styles.feedbackInput]}
                  placeholder="Enter feedback for the student"
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {selectedSubmissionData.status !== 'GRADED' && (
                <TouchableOpacity
                  style={[styles.gradeButton, grading && styles.gradeButtonDisabled]}
                  onPress={() => handleGrade(selectedSubmissionData.id)}
                  disabled={grading}>
                  {grading ? (
                    <ActivityIndicator color={Colors.textInverse} />
                  ) : (
                    <Text style={styles.gradeButtonText}>Submit Grade</Text>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.submissionContent}>
                <Text style={styles.submissionContentLabel}>Submission:</Text>
                <Text style={styles.submissionContentText}>
                  {selectedSubmissionData.content || 'No content'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
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
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  submissionsList: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  listContent: {
    padding: Spacing.base,
  },
  submissionCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  submissionCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.backgroundLight,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  submissionHeaderLeft: {
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
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.base,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  submissionBody: {
    marginTop: Spacing.sm,
  },
  submissionLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  submissionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  gradeInfo: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  gradeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success,
    marginBottom: Spacing.xs,
  },
  feedbackText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  gradingPanel: {
    width: 400,
    backgroundColor: Colors.surface,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  gradingTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    padding: Spacing.base,
    backgroundColor: Colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  gradingForm: {
    padding: Spacing.base,
  },
  formGroup: {
    marginBottom: Spacing.base,
  },
  formLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  formInput: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  feedbackInput: {
    minHeight: 100,
    paddingTop: Spacing.base,
  },
  gradeButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  gradeButtonDisabled: {
    opacity: 0.6,
  },
  gradeButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  submissionContent: {
    marginTop: Spacing.base,
    padding: Spacing.base,
    backgroundColor: Colors.backgroundLight,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submissionContentLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  submissionContentText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
});

export default SubmissionGradingScreen;

