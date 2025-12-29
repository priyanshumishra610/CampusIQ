import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {
  fetchAnnouncements,
  markAnnouncementAsRead,
} from '../../redux/slices/announcementSlice';
import {EmptyState, SkeletonList, RetryButton} from '../../components/Common';

const AnnouncementsScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {announcements, unreadCount, loading, error} = useSelector(
    (state: RootState) => state.announcement,
  );

  useEffect(() => {
    if (user?.id) {
      dispatch(
        fetchAnnouncements({
          userId: user.id,
          role: user.role,
          campusId: user.campusId,
          departmentId: user.department,
        }) as any,
      );
    }
  }, [dispatch, user]);

  const handlePress = async (announcement: typeof announcements[0]) => {
    if (user?.id && (!announcement.readBy || !announcement.readBy.includes(user.id))) {
      dispatch(markAnnouncementAsRead({announcementId: announcement.id, userId: user.id}) as any);
    }
    navigation.navigate('AnnouncementDetail', {announcementId: announcement.id});
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return '#e74c3c';
      case 'HIGH':
        return '#f39c12';
      case 'MEDIUM':
        return '#3498db';
      default:
        return '#7a8a9a';
    }
  };

  const renderAnnouncement = ({item}: {item: typeof announcements[0]}) => {
    const isUnread = !item.readBy || !item.readBy.includes(user?.id || '');
    const priorityColor = getPriorityColor(item.priority);

    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        onPress={() => handlePress(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {isUnread && <View style={styles.unreadDot} />}
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          <View style={[styles.priorityBadge, {backgroundColor: `${priorityColor}15`}]}>
            <Text style={[styles.priorityText, {color: priorityColor}]}>
              {item.priority}
            </Text>
          </View>
        </View>
        <Text style={styles.content} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.author}>{item.authorName}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleRetry = () => {
    if (user?.id) {
      dispatch(
        fetchAnnouncements({
          userId: user.id,
          role: user.role,
          campusId: user.campusId,
          departmentId: user.department,
        }) as any,
      );
    }
  };

  if (loading && announcements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Announcements</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  if (error && announcements.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Announcements</Text>
        </View>
        <RetryButton onPress={handleRetry} message={error} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Announcements</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <Text style={styles.headerSubtitle}>
          Stay updated with campus news and important information
        </Text>
      </View>

      <FlatList
        data={announcements}
        keyExtractor={item => item.id}
        renderItem={renderAnnouncement}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            variant="no-results"
            customTitle="No announcements"
            customMessage="You're all caught up! No new announcements."
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginRight: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#a8c4e0',
  },
  badge: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
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
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#1e3a5f',
    backgroundColor: '#f8fafc',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e3a5f',
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    lineHeight: 22,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    fontSize: 14,
    color: '#5a6a7a',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e4e8ec',
  },
  author: {
    fontSize: 12,
    color: '#7a8a9a',
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#7a8a9a',
  },
});

export default AnnouncementsScreen;

