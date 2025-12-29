import React, {useEffect, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchStudentAssignments,
  fetchStudentAssignmentSummary,
} from '../../redux/slices/assignmentSlice';
import {EmptyState, SkeletonList, RetryButton} from '../../components/Common';

const AssignmentsListScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {assignments, summary, loading, error} = useSelector(
    (state: RootState) => state.assignment,
  );

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchStudentAssignments({studentId: user.id}) as any);
      dispatch(fetchStudentAssignmentSummary(user.id) as any);
    }
  }, [dispatch, user]);

  const now = Date.now();
  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => {
      // Overdue first
      const aOverdue = now > a.dueDate;
      const bOverdue = now > b.dueDate;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      // Then by due date
      return a.dueDate - b.dueDate;
    });
  }, [assignments, now]);

  const getStatusColor = (assignment: typeof assignments[0]) => {
    if (now > assignment.dueDate) return '#e74c3c';
    const daysLeft = (assignment.dueDate - now) / (1000 * 60 * 60 * 24);
    if (daysLeft <= 1) return '#f39c12';
    return '#27ae60';
  };

  const getStatusText = (assignment: typeof assignments[0]) => {
    if (now > assignment.dueDate) return 'Overdue';
    const daysLeft = Math.ceil((assignment.dueDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft === 0) return 'Due today';
    if (daysLeft === 1) return 'Due tomorrow';
    return `${daysLeft} days left`;
  };

  const handleRetry = () => {
    if (user?.id) {
      dispatch(fetchStudentAssignments({studentId: user.id}) as any);
      dispatch(fetchStudentAssignmentSummary(user.id) as any);
    }
  };

  const renderAssignment = ({item}: {item: typeof assignments[0]}) => {
    const statusColor = getStatusColor(item);
    const statusText = getStatusText(item);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AssignmentDetail', {assignmentId: item.id})}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.courseCode}>{item.courseCode}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: `${statusColor}15`}]}>
            <Text style={[styles.statusText, {color: statusColor}]}>{statusText}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.facultyName}>{item.facultyName}</Text>
          <Text style={styles.dueDate}>
            Due: {new Date(item.dueDate).toLocaleDateString()} at{' '}
            {new Date(item.dueDate).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
          </Text>
          <Text style={styles.marks}>Max Marks: {item.maxMarks}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && assignments.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assignments</Text>
          <Text style={styles.headerSubtitle}>
            {summary ? `${summary.pending} pending, ${summary.overdue} overdue` : ''}
          </Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error && assignments.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assignments</Text>
        </View>
        <RetryButton onPress={handleRetry} message={error} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Assignments</Text>
        {summary && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.total}</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, {color: '#f39c12'}]}>
                {summary.pending}
              </Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, {color: '#e74c3c'}]}>
                {summary.overdue}
              </Text>
              <Text style={styles.summaryLabel}>Overdue</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, {color: '#27ae60'}]}>
                {summary.submitted}
              </Text>
              <Text style={styles.summaryLabel}>Submitted</Text>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={sortedAssignments}
        keyExtractor={item => item.id}
        renderItem={renderAssignment}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            variant="no-results"
            customTitle="No assignments"
            customMessage="You don't have any assignments yet"
          />
        }
        refreshing={loading}
        onRefresh={handleRetry}
      />
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
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#a8c4e0',
  },
  summaryRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#a8c4e0',
    textTransform: 'uppercase',
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
  courseCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a8a9a',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: 6,
  },
  facultyName: {
    fontSize: 13,
    color: '#5a6a7a',
    fontWeight: '500',
  },
  dueDate: {
    fontSize: 12,
    color: '#7a8a9a',
  },
  marks: {
    fontSize: 12,
    color: '#7a8a9a',
    fontWeight: '600',
  },
});

export default AssignmentsListScreen;

