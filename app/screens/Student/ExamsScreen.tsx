import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {EmptyState, SkeletonList} from '../../components/Common';
import {Exam} from '../../redux/slices/examSlice';

const ExamsScreen = ({navigation}: any) => {
  const {items: exams, loading} = useSelector((state: RootState) => state.exams);
  const [filter, setFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');

  const filteredExams = useMemo(() => {
    const now = Date.now();
    return exams.filter(exam => {
      const examDate = exam.scheduledDate instanceof Date
        ? exam.scheduledDate.getTime()
        : exam.scheduledDate?.toDate?.().getTime() || 0;

      if (filter === 'UPCOMING') return examDate > now;
      if (filter === 'PAST') return examDate < now;
      return true;
    }).sort((a, b) => {
      const aDate = a.scheduledDate instanceof Date
        ? a.scheduledDate.getTime()
        : a.scheduledDate?.toDate?.().getTime() || 0;
      const bDate = b.scheduledDate instanceof Date
        ? b.scheduledDate.getTime()
        : b.scheduledDate?.toDate?.().getTime() || 0;
      return aDate - bDate;
    });
  }, [exams, filter]);

  const getTimeUntil = (exam: Exam) => {
    const examDate = exam.scheduledDate instanceof Date
      ? exam.scheduledDate
      : exam.scheduledDate?.toDate?.() || new Date();
    const now = new Date();
    const diff = examDate.getTime() - now.getTime();

    if (diff < 0) return 'Past';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderExam = ({item}: {item: Exam}) => {
    const examDate = item.scheduledDate instanceof Date
      ? item.scheduledDate
      : item.scheduledDate?.toDate?.() || new Date();
    const timeUntil = getTimeUntil(item);
    const isUpcoming = examDate.getTime() > Date.now();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ExamDetail', {examId: item.id})}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.courseCode}>{item.courseCode}</Text>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
          {isUpcoming && (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{timeUntil}</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.dateTimeRow}>
            <Text style={styles.date}>
              {examDate.toLocaleDateString()}
            </Text>
            <Text style={styles.time}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
          {item.room && item.building && (
            <Text style={styles.location}>
              📍 {item.building} - {item.room}
            </Text>
          )}
          <View style={styles.metaRow}>
            <Text style={styles.type}>{item.examType}</Text>
            <Text style={styles.duration}>{item.duration} min</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && exams.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exams</Text>
        </View>
        <SkeletonList count={5} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Exams</Text>
        <Text style={styles.headerSubtitle}>Your exam schedule</Text>
      </View>

      <View style={styles.filters}>
        {(['ALL', 'UPCOMING', 'PAST'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredExams}
        keyExtractor={item => item.id}
        renderItem={renderExam}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            variant="no-exams"
            customMessage={
              filter === 'UPCOMING'
                ? 'No upcoming exams scheduled'
                : filter === 'PAST'
                ? 'No past exams'
                : 'No exams scheduled'
            }
          />
        }
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#a8c4e0',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7a8a9a',
    textTransform: 'uppercase',
  },
  filterTextActive: {
    color: '#fff',
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
  countdownBadge: {
    backgroundColor: '#fef5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e74c3c',
    textTransform: 'uppercase',
  },
  cardBody: {
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c1222',
  },
  time: {
    fontSize: 14,
    color: '#5a6a7a',
    fontWeight: '500',
  },
  location: {
    fontSize: 13,
    color: '#7a8a9a',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e4e8ec',
  },
  type: {
    fontSize: 12,
    color: '#1e3a5f',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  duration: {
    fontSize: 12,
    color: '#7a8a9a',
  },
});

export default ExamsScreen;

