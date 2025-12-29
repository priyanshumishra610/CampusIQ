import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchTicketById,
  updateTicket,
  addTicketComment,
  TicketStatus,
} from '../../redux/slices/ticketSlice';
import {EmptyState, SkeletonLoader, RetryButton} from '../../components/Common';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';
import moment from 'moment';

const TicketDetailScreen = ({route, navigation}: any) => {
  const {ticketId} = route.params;
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {currentTicket, loading, error} = useSelector((state: RootState) => state.tickets);

  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    if (ticketId) {
      dispatch(fetchTicketById(ticketId) as any);
    }
  }, [dispatch, ticketId]);

  const calculateSLATime = (createdAt: number) => {
    const now = Date.now();
    const elapsed = now - createdAt;
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    return {hours, minutes};
  };

  const getSLAStatus = (createdAt: number, priority: string) => {
    const {hours} = calculateSLATime(createdAt);
    const slaHours = priority === 'URGENT' ? 2 : priority === 'HIGH' ? 8 : 24;
    
    if (hours >= slaHours) return {status: 'BREACHED', color: Colors.error};
    if (hours >= slaHours * 0.8) return {status: 'AT_RISK', color: Colors.warning};
    return {status: 'ON_TRACK', color: Colors.success};
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!currentTicket) return;

    setUpdating(true);
    try {
      await dispatch(
        updateTicket({
          ticketId: currentTicket.id,
          status: newStatus,
          comment: `Status changed to ${newStatus} by ${user?.name}`,
        }) as any,
      ).unwrap();

      Alert.alert('Success', 'Ticket status updated successfully!');
      dispatch(fetchTicketById(ticketId) as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update ticket status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    if (!currentTicket) return;

    setCommenting(true);
    try {
      await dispatch(
        addTicketComment({
          ticketId: currentTicket.id,
          comment: comment.trim(),
          userId: user?.id || '',
          userName: user?.name || '',
        }) as any,
      ).unwrap();

      setComment('');
      Alert.alert('Success', 'Comment added successfully!');
      dispatch(fetchTicketById(ticketId) as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleEscalate = async () => {
    Alert.alert(
      'Escalate Ticket',
      'Are you sure you want to escalate this ticket?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Escalate',
          style: 'destructive',
          onPress: async () => {
            await handleStatusChange('ESCALATED');
          },
        },
      ],
    );
  };

  if (loading && !currentTicket) {
    return (
      <View style={styles.container}>
        <SkeletonLoader width="100%" height={200} style={styles.skeleton} />
        <SkeletonLoader width="100%" height={300} style={styles.skeleton} />
      </View>
    );
  }

  if (error && !currentTicket) {
    return (
      <View style={styles.container}>
        <RetryButton
          onPress={() => dispatch(fetchTicketById(ticketId) as any)}
          message={error}
        />
      </View>
    );
  }

  if (!currentTicket) {
    return (
      <View style={styles.container}>
        <EmptyState variant="no-results" customTitle="Ticket not found" />
      </View>
    );
  }

  const slaInfo = getSLAStatus(currentTicket.createdAt, currentTicket.priority);
  const slaTime = calculateSLATime(currentTicket.createdAt);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{currentTicket.title}</Text>
        <View style={styles.headerMeta}>
          <View
            style={[
              styles.priorityBadge,
              {backgroundColor: `${getPriorityColor(currentTicket.priority)}15`},
            ]}>
            <Text
              style={[
                styles.priorityText,
                {color: getPriorityColor(currentTicket.priority)},
              ]}>
              {currentTicket.priority}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: `${getStatusColor(currentTicket.status)}15`},
            ]}>
            <Text
              style={[styles.statusText, {color: getStatusColor(currentTicket.status)}]}>
              {currentTicket.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      {/* SLA Timer */}
      <View style={styles.slaCard}>
        <Text style={styles.slaLabel}>SLA Status</Text>
        <View style={styles.slaContent}>
          <View style={styles.slaTime}>
            <Text style={styles.slaTimeValue}>
              {slaTime.hours}h {slaTime.minutes}m
            </Text>
            <Text style={styles.slaTimeLabel}>Elapsed</Text>
          </View>
          <View style={[styles.slaStatus, {backgroundColor: `${slaInfo.color}15`}]}>
            <Text style={[styles.slaStatusText, {color: slaInfo.color}]}>
              {slaInfo.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
      </View>

      {/* Ticket Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>{currentTicket.category}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>
            {moment(currentTicket.createdAt).format('MMM DD, YYYY hh:mm A')}
          </Text>
        </View>
        {currentTicket.assignedTo && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Assigned To:</Text>
            <Text style={styles.detailValue}>{currentTicket.assignedToName || 'N/A'}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{currentTicket.description}</Text>
      </View>

      {/* Comments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comments</Text>
        {currentTicket.comments && currentTicket.comments.length > 0 ? (
          currentTicket.comments.map((comment: any, index: number) => (
            <View key={index} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentAuthor}>{comment.userName || 'Unknown'}</Text>
                <Text style={styles.commentTime}>
                  {moment(comment.timestamp).fromNow()}
                </Text>
              </View>
              <Text style={styles.commentText}>{comment.text}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noComments}>No comments yet</Text>
        )}

        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={comment}
            onChangeText={setComment}
            multiline
            placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity
            style={[styles.commentButton, commenting && styles.commentButtonDisabled]}
            onPress={handleAddComment}
            disabled={commenting}>
            {commenting ? (
              <ActivityIndicator color={Colors.textInverse} />
            ) : (
              <Text style={styles.commentButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsGrid}>
          {currentTicket.status === 'OPEN' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonProgress]}
              onPress={() => handleStatusChange('IN_PROGRESS')}
              disabled={updating}>
              <Text style={styles.actionButtonText}>Start Working</Text>
            </TouchableOpacity>
          )}
          {currentTicket.status === 'IN_PROGRESS' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonResolve]}
                onPress={() => handleStatusChange('RESOLVED')}
                disabled={updating}>
                <Text style={styles.actionButtonText}>Mark Resolved</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonEscalate]}
                onPress={handleEscalate}
                disabled={updating}>
                <Text style={styles.actionButtonText}>Escalate</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return Colors.error;
    case 'HIGH':
      return Colors.warning;
    case 'MEDIUM':
      return Colors.info;
    default:
      return Colors.textMuted;
  }
};

const getStatusColor = (status: TicketStatus) => {
  switch (status) {
    case 'OPEN':
      return Colors.info;
    case 'IN_PROGRESS':
      return Colors.warning;
    case 'RESOLVED':
      return Colors.success;
    case 'ESCALATED':
      return Colors.error;
    default:
      return Colors.textMuted;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    padding: Spacing.base,
  },
  skeleton: {
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.md,
  },
  headerMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.base,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
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
  slaCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    ...Shadows.base,
  },
  slaLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  slaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slaTime: {
    alignItems: 'center',
  },
  slaTimeValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  slaTimeLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  slaStatus: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.base,
  },
  slaStatusText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
    ...Shadows.base,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
    width: 100,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  description: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  commentCard: {
    backgroundColor: Colors.backgroundLight,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  commentAuthor: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  commentTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  commentText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
  },
  noComments: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: Spacing.base,
  },
  commentInputContainer: {
    marginTop: Spacing.md,
  },
  commentInput: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.sm,
  },
  commentButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  commentButtonDisabled: {
    opacity: 0.6,
  },
  commentButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  actionsSection: {
    marginBottom: Spacing.xl,
  },
  actionsGrid: {
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
  },
  actionButtonProgress: {
    backgroundColor: Colors.warning,
  },
  actionButtonResolve: {
    backgroundColor: Colors.success,
  },
  actionButtonEscalate: {
    backgroundColor: Colors.error,
  },
  actionButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default TicketDetailScreen;

