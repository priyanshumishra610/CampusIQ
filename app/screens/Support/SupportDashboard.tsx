import React, {useEffect, useMemo, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchTickets,
  updateTicket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '../../redux/slices/ticketSlice';
import {EmptyState, SkeletonList, RetryButton, PremiumCard, MetricTile, ActionButton} from '../../components/Common';
import {useTheme} from '../../theme/ThemeContext';
import {Typography, Spacing, BorderRadius} from '../../theme/designTokens';

const SupportDashboard = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {colors} = useTheme();
  const {user} = useSelector((state: RootState) => state.auth);
  const {tickets, summary, loading, error} = useSelector(
    (state: RootState) => state.tickets,
  );

  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (user?.id) {
      dispatch(
        fetchTickets({
          userId: user.id,
          role: user.role,
        }) as any,
      );
    }
  }, [dispatch, user]);

  const filteredTickets = useMemo(() => {
    if (statusFilter === 'ALL') return tickets;
    return tickets.filter(t => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    if (!user) return;
    dispatch(
      updateTicket({
        ticketId,
        status: newStatus,
        comment: `Status changed to ${newStatus} by ${user.name}`,
      }) as any,
    );
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return colors.error;
      case 'HIGH':
        return colors.warning;
      case 'MEDIUM':
        return colors.info;
      default:
        return colors.textMuted;
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return colors.info;
      case 'IN_PROGRESS':
        return colors.warning;
      case 'RESOLVED':
        return colors.success;
      case 'ESCALATED':
        return colors.error;
      default:
        return colors.textMuted;
    }
  };

  const renderTicket = ({item}: {item: typeof tickets[0]}) => {
    const priorityColor = getPriorityColor(item.priority);
    const statusColor = getStatusColor(item.status);

    return (
      <PremiumCard
        variant="outlined"
        style={styles.card}
        onPress={() => navigation.navigate('TicketDetail', {ticketId: item.id})}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.title, {color: colors.textPrimary}]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.category, {color: colors.textMuted}]}>{item.category}</Text>
          </View>
          <View style={[styles.priorityBadge, {backgroundColor: priorityColor + '15'}]}>
            <Text style={[styles.priorityText, {color: priorityColor}]}>
              {item.priority}
            </Text>
          </View>
        </View>
        <Text style={[styles.description, {color: colors.textSecondary}]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={[styles.cardFooter, {borderTopColor: colors.border}]}>
          <View style={[styles.statusBadge, {backgroundColor: statusColor + '15'}]}>
            <Text style={[styles.statusText, {color: statusColor}]}>
              {item.status.replace('_', ' ')}
            </Text>
          </View>
          <Text style={[styles.date, {color: colors.textMuted}]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.assignedTo === user?.id && (
          <View style={styles.actions}>
            {item.status === 'OPEN' && (
              <ActionButton
                label="Start"
                onPress={() => handleStatusChange(item.id, 'IN_PROGRESS')}
                variant="secondary"
                size="sm"
                style={styles.actionButton}
              />
            )}
            {item.status === 'IN_PROGRESS' && (
              <ActionButton
                label="Resolve"
                onPress={() => handleStatusChange(item.id, 'RESOLVED')}
                variant="success"
                size="sm"
                style={styles.actionButton}
              />
            )}
          </View>
        )}
      </PremiumCard>
    );
  };

  const handleRetry = () => {
    if (user?.id) {
      dispatch(
        fetchTickets({
          userId: user.id,
          role: user.role,
        }) as any,
      );
    }
  };

  if (loading && tickets.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <Text style={styles.headerTitle}>Support Dashboard</Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.header, {backgroundColor: colors.primary}]}>
          <Text style={styles.headerTitle}>Support Dashboard</Text>
        </View>
        <RetryButton onPress={handleRetry} message={error} />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <View style={[styles.header, {backgroundColor: colors.primary}]}>
        <Text style={styles.headerTitle}>Support Dashboard</Text>
        <Text style={[styles.headerSubtitle, {color: colors.primaryAccentLight}]}>
          Manage support tickets
        </Text>
        {summary && (
          <View style={styles.summaryRow}>
            <MetricTile
              value={summary.open}
              label="Open"
              variant="default"
              style={styles.summaryTile}
            />
            <MetricTile
              value={summary.inProgress}
              label="In Progress"
              variant="highlight"
              style={styles.summaryTile}
            />
            <MetricTile
              value={summary.resolved}
              label="Resolved"
              variant="default"
              style={styles.summaryTile}
            />
            <MetricTile
              value={summary.escalated}
              label="Escalated"
              variant={summary.escalated > 0 ? 'alert' : 'default'}
              style={styles.summaryTile}
            />
          </View>
        )}
      </View>

      <View style={[styles.filters, {backgroundColor: colors.surface, borderBottomColor: colors.border}]}>
        {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'ESCALATED'] as const).map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              {
                backgroundColor: statusFilter === status ? colors.primary : colors.surface,
                borderColor: statusFilter === status ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setStatusFilter(status)}>
            <Text
              style={[
                styles.filterText,
                {
                  color: statusFilter === status ? colors.textInverse : colors.textSecondary,
                },
              ]}>
              {status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTickets}
        keyExtractor={item => item.id}
        renderItem={renderTicket}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            variant="no-results"
            customTitle="No tickets"
            customMessage="No tickets match your filters"
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
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.extrabold,
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.base,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.base,
  },
  summaryTile: {
    flex: 1,
  },
  filters: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    textTransform: 'uppercase',
  },
  listContent: {
    padding: Spacing.base,
  },
  card: {
    marginBottom: Spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.tight * Typography.fontSize.lg,
  },
  category: {
    fontSize: Typography.fontSize.xs,
    textTransform: 'uppercase',
    fontWeight: Typography.fontWeight.medium,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
    marginBottom: Spacing.base,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.base,
    borderTopWidth: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: Typography.fontSize.xs,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.base,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});

export default SupportDashboard;
