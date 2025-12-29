import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {fetchAnnouncements} from '../../redux/slices/announcementSlice';
import {EmptyState, SkeletonList, RetryButton} from '../../components/Common';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '../../theme/designTokens';
import moment from 'moment';

type NotificationType = 'announcement' | 'assignment' | 'exam' | 'attendance' | 'grade';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

const NotificationCenterScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {announcements, loading, error} = useSelector(
    (state: RootState) => state.announcement,
  );

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (user?.id) {
      dispatch(
        fetchAnnouncements({
          userId: user.id,
          role: user.role,
          campusId: user.campusId,
        }) as any,
      );
    }
  }, [dispatch, user]);

  // Transform announcements into notifications
  const notifications = useMemo<Notification[]>(() => {
    return announcements.map(ann => ({
      id: ann.id,
      type: 'announcement' as NotificationType,
      title: ann.title,
      message: ann.content || ann.description || '',
      timestamp: ann.createdAt,
      read: ann.read || false,
      actionUrl: ann.id,
    }));
  }, [announcements]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'announcement':
        return 'campaign';
      case 'assignment':
        return 'assignment';
      case 'exam':
        return 'quiz';
      case 'attendance':
        return 'check-circle';
      case 'grade':
        return 'assessment';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'announcement':
        return Colors.info;
      case 'assignment':
        return Colors.warning;
      case 'exam':
        return Colors.error;
      case 'attendance':
        return Colors.primary;
      case 'grade':
        return Colors.success;
      default:
        return Colors.textMuted;
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (notification.actionUrl) {
      navigation.navigate('AnnouncementDetail', {id: notification.actionUrl});
    }
  };

  const handleRetry = () => {
    if (user?.id) {
      dispatch(
        fetchAnnouncements({
          userId: user.id,
          role: user.role,
          campusId: user.campusId,
        }) as any,
      );
    }
  };

  const renderNotification = ({item}: {item: Notification}) => {
    const icon = getNotificationIcon(item.type);
    const color = getNotificationColor(item.type);
    const timeAgo = moment(item.timestamp).fromNow();

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.notificationCardUnread]}
        onPress={() => handleNotificationPress(item)}>
        <View style={[styles.notificationIcon, {backgroundColor: `${color}15`}]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <RetryButton onPress={handleRetry} message={error} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount} unread</Text>
          </View>
        )}
      </View>

      <View style={styles.filters}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}>
          <Text
            style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'unread' && styles.filterChipActive]}
          onPress={() => setFilter('unread')}>
          <Text
            style={[
              styles.filterText,
              filter === 'unread' && styles.filterTextActive,
            ]}>
            Unread
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            variant="no-notifications"
            customTitle={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            customMessage={
              filter === 'unread'
                ? 'You\'re all caught up!'
                : 'You\'ll see notifications here when there are updates'
            }
          />
        }
        refreshing={loading}
        onRefresh={handleRetry}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRetry} />
        }
      />
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
  unreadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  unreadBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },
  filters: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textMuted,
  },
  filterTextActive: {
    color: Colors.textInverse,
  },
  listContent: {
    padding: Spacing.base,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.backgroundLight,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.base,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.xs,
  },
  notificationMessage: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
});

export default NotificationCenterScreen;

