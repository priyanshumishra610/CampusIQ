import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import StatusBadge from '../../components/StatusBadge';
import AuditTrail from '../../components/AuditTrail';
import PermissionGate, {usePermission} from '../../components/PermissionGate';
import {Task, addTaskComment, updateTaskStatus} from '../../redux/taskSlice';
import {RootState} from '../../redux/store';
import {getRoleDisplayName} from '../../config/permissions';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={styles.badgeContainer}>
          <StatusBadge status={task.status} priority={task.priority} />
        </View>
        <View style={styles.metaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{task.category}</Text>
          </View>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.metaText}>Priority: {task.priority}</Text>
        </View>
        {createdAt && (
          <Text style={styles.meta}>Created: {createdAt.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</Text>
        )}
        {resolvedAt && (
          <View style={styles.resolvedBadge}>
            <Text style={styles.metaResolved}>✓ Completed: {resolvedAt.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'})}</Text>
          </View>
        )}
      </View>

      <PermissionGate permissions={['task:close', 'task:escalate']}>
        <View style={styles.statusActions}>
          {task.status !== 'RESOLVED' && canClose && (
            <TouchableOpacity
              style={[styles.statusBtn, styles.statusComplete]}
              onPress={() => handleStatusChange('RESOLVED')}
              disabled={updating}
              activeOpacity={0.8}>
              <Text style={styles.statusBtnText}>Mark Complete</Text>
            </TouchableOpacity>
          )}
          {task.status !== 'IN_PROGRESS' && task.status !== 'RESOLVED' && (
            <TouchableOpacity
              style={[styles.statusBtn, styles.statusProgress]}
              onPress={() => handleStatusChange('IN_PROGRESS')}
              disabled={updating}
              activeOpacity={0.8}>
              <Text style={styles.statusBtnText}>Start Progress</Text>
            </TouchableOpacity>
          )}
        </View>
      </PermissionGate>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Details</Text>
        <Text style={styles.body}>{task.description}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>AI Analysis</Text>
        <View style={styles.aiCard}>
          <View style={styles.aiItem}>
            <Text style={styles.label}>Summary</Text>
            <Text style={styles.body}>{task.aiSummary || 'Analysis pending...'}</Text>
          </View>
          <View style={styles.aiItem}>
            <Text style={styles.label}>Recommended Priority</Text>
            <Text style={styles.body}>{task.priority}</Text>
          </View>
          <View style={styles.aiItem}>
            <Text style={styles.label}>Category</Text>
            <Text style={styles.body}>{task.category}</Text>
          </View>
          <View style={styles.aiTag}>
            <Text style={styles.tagText}>Powered by Gemini AI</Text>
          </View>
        </View>
      </View>

      {task.location && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>
              {task.location.lat.toFixed(4)}, {task.location.lng.toFixed(4)}
            </Text>
          </View>
        </View>
      )}

      {canComment && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Add Comment</Text>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Add an administrative note..."
              placeholderTextColor={colors.textTertiary}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.commentBtn, !comment.trim() && styles.commentBtnDisabled]}
              onPress={handleAddComment}
              disabled={!comment.trim() || submittingComment}
              activeOpacity={0.8}>
              {submittingComment ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={styles.commentBtnText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {task.comments && task.comments.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Comments ({task.comments.length})</Text>
          {task.comments.map(c => (
            <View key={c.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <View style={styles.commentAuthorContainer}>
                  <View style={styles.commentAvatar}>
                    <Text style={styles.commentAvatarText}>{c.authorName[0].toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.commentAuthor}>{c.authorName}</Text>
                    <Text style={styles.commentRole}>{getRoleDisplayName(c.authorRole)}</Text>
                  </View>
                </View>
                <Text style={styles.commentTime}>
                  {new Date(c.createdAt).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                </Text>
              </View>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
        </View>
      )}

      {canViewAudit && (
        <View style={styles.sectionCard}>
          <AuditTrail entityId={task.id} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingBottom: spacing['5xl'],
  },
  headerCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 0,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: fontSize['2xl'] * 1.3,
    letterSpacing: -0.3,
  },
  badgeContainer: {
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  metaSeparator: {
    color: colors.textTertiary,
    fontSize: fontSize.sm,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    marginTop: spacing.xs,
  },
  resolvedBadge: {
    marginTop: spacing.md,
    backgroundColor: colors.status.resolved + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.status.resolved + '30',
  },
  metaResolved: {
    color: colors.status.resolved,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  statusActions: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
    ...shadows.md,
  },
  statusComplete: {
    backgroundColor: colors.status.resolved,
  },
  statusProgress: {
    backgroundColor: colors.status.inProgress,
  },
  statusBtnText: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  sectionCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    letterSpacing: -0.1,
  },
  body: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.7,
    fontWeight: fontWeight.normal,
  },
  aiCard: {
    marginTop: spacing.md,
  },
  aiItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  label: {
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontSize: fontSize.xs,
  },
  aiTag: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    fontWeight: fontWeight.normal,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationIcon: {
    fontSize: fontSize.md,
  },
  locationText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    fontFamily: 'monospace',
  },
  commentInputContainer: {
    marginTop: spacing.lg,
    gap: spacing.lg,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  commentBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  commentBtnDisabled: {
    opacity: 0.5,
  },
  commentBtnText: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  commentCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: colors.textInverse,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  commentAuthor: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  commentRole: {
    fontSize: fontSize.xs,
    color: colors.primary,
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.md,
    fontWeight: fontWeight.medium,
    alignSelf: 'flex-start',
  },
  commentText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: fontSize.base * 1.5,
    marginTop: spacing.sm,
  },
  commentTime: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
  },
});

export default TaskDetailScreen;

