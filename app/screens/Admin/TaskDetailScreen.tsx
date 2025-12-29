import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {StatusBadge} from '../../components/Task';
import {AuditTrail, PermissionGate, usePermission} from '../../components/Common';
import {Task, addTaskComment, updateTaskStatus} from '../../redux/slices/taskSlice';
import {RootState} from '../../redux/store';
import {getRoleDisplayName} from '../../config/permissions';

type Props = {
  route: {params: {task: Task}};
};

const TaskDetailScreen = ({route}: Props) => {
  const dispatch = useDispatch();
  const task = route.params.task;
  const user = useSelector((state: RootState) => state.auth.user);
  const {updating} = useSelector((state: RootState) => state.tasks);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const canViewAudit = usePermission('audit:view');
  const canClose = usePermission('task:close');
  const canComment = usePermission('task:create');

  const createdAt = useMemo(() => {
    if (!task.createdAt) return null;
    return task.createdAt instanceof Date
      ? task.createdAt
      : task.createdAt.toDate?.() || null;
  }, [task.createdAt]);

  const resolvedAt = useMemo(() => {
    if (!task.resolvedAt) return null;
    return task.resolvedAt instanceof Date
      ? task.resolvedAt
      : task.resolvedAt.toDate?.() || null;
  }, [task.resolvedAt]);

  const handleStatusChange = (status: Task['status']) => {
    if (!user || !user.adminRole) return;
    dispatch(updateTaskStatus({
      taskId: task.id,
      status,
      userId: task.createdBy,
      userName: user.name,
      userRole: user.adminRole,
      previousStatus: task.status,
    }) as any);
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !user || !user.adminRole) return;
    setSubmittingComment(true);
    await dispatch(addTaskComment({
      taskId: task.id,
      text: comment.trim(),
      authorId: user.id,
      authorName: user.name,
      authorRole: user.adminRole,
    }) as any);
    setComment('');
    setSubmittingComment(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      <Text style={styles.title}>{task.title}</Text>
      <StatusBadge status={task.status} priority={task.priority} />
      <Text style={styles.meta}>
        {task.category} • Priority: {task.priority}
      </Text>
      {createdAt && (
        <Text style={styles.meta}>Created: {createdAt.toDateString()}</Text>
      )}
      {resolvedAt && (
        <Text style={styles.metaResolved}>Completed: {resolvedAt.toDateString()}</Text>
      )}

      <PermissionGate permissions={['task:close', 'task:escalate']}>
        <View style={styles.statusActions}>
          {task.status !== 'RESOLVED' && canClose && (
            <TouchableOpacity
              style={[styles.statusBtn, styles.statusComplete]}
              onPress={() => handleStatusChange('RESOLVED')}
              disabled={updating}>
              <Text style={styles.statusBtnText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
          {task.status !== 'IN_PROGRESS' && task.status !== 'RESOLVED' && (
            <TouchableOpacity
              style={[styles.statusBtn, styles.statusProgress]}
              onPress={() => handleStatusChange('IN_PROGRESS')}
              disabled={updating}>
              <Text style={styles.statusBtnText}>Start Progress</Text>
            </TouchableOpacity>
          )}
        </View>
      </PermissionGate>

      <Text style={styles.sectionTitle}>Details</Text>
      <Text style={styles.body}>{task.description}</Text>

      <Text style={styles.sectionTitle}>AI Analysis</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Summary</Text>
        <Text style={styles.body}>{task.aiSummary || 'Analysis pending...'}</Text>
        <Text style={styles.label}>Recommended Priority</Text>
        <Text style={styles.body}>{task.priority}</Text>
        <Text style={styles.label}>Category</Text>
        <Text style={styles.body}>{task.category}</Text>
        <Text style={styles.tag}>Powered by Gemini AI</Text>
      </View>

      {task.location && (
        <>
          <Text style={styles.sectionTitle}>Location Data</Text>
          <Text style={styles.meta}>
            Coordinates: {task.location.lat.toFixed(4)}, {task.location.lng.toFixed(4)}
          </Text>
        </>
      )}

      {canComment && (
        <>
          <Text style={styles.sectionTitle}>Add Comment</Text>
          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              placeholder="Add an administrative note..."
              placeholderTextColor="#9aaaba"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.commentBtn, !comment.trim() && styles.commentBtnDisabled]}
              onPress={handleAddComment}
              disabled={!comment.trim() || submittingComment}>
              {submittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.commentBtnText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {task.comments && task.comments.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Comments</Text>
          {task.comments.map(c => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{c.authorName}</Text>
                <Text style={styles.commentRole}>{getRoleDisplayName(c.authorRole)}</Text>
              </View>
              <Text style={styles.commentText}>{c.text}</Text>
              <Text style={styles.commentTime}>
                {new Date(c.createdAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </>
      )}

      {canViewAudit && <AuditTrail entityId={task.id} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f6f9',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c1222',
    marginBottom: 10,
  },
  meta: {
    color: '#5a6a7a',
    marginTop: 6,
    fontSize: 13,
  },
  metaResolved: {
    color: '#27ae60',
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  statusBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusComplete: {
    backgroundColor: '#27ae60',
  },
  statusProgress: {
    backgroundColor: '#2980b9',
  },
  statusBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
    paddingBottom: 8,
  },
  body: {
    marginTop: 8,
    color: '#2a3a4a',
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  label: {
    fontWeight: '700',
    color: '#3a4a5a',
    marginTop: 10,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tag: {
    marginTop: 16,
    fontSize: 11,
    color: '#1e3a5f',
    fontWeight: '600',
  },
  commentInput: {
    marginTop: 12,
    gap: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d4dce6',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#0c1222',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  commentBtn: {
    backgroundColor: '#1e3a5f',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  commentBtnDisabled: {
    opacity: 0.5,
  },
  commentBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  commentCard: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e8ec',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2a3a4a',
  },
  commentRole: {
    fontSize: 10,
    color: '#1e3a5f',
    backgroundColor: '#e8f0f8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    color: '#3a4a5a',
    lineHeight: 20,
  },
  commentTime: {
    marginTop: 8,
    fontSize: 11,
    color: '#9aaaba',
  },
});

export default TaskDetailScreen;

