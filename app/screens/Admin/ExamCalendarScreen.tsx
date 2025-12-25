import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';
import {ExamScheduleCard} from '../../components/Exam';
import {EmptyState} from '../../components/Common';
import {Exam} from '../../redux/slices/examSlice';
import {RootState} from '../../redux/store';

const ExamCalendarScreen = ({navigation}: any) => {
  const {items} = useSelector((state: RootState) => state.exams);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group exams by date
  const examsByDate = useMemo(() => {
    const grouped: Record<string, Exam[]> = {};
    items.forEach(exam => {
      const examDate = exam.scheduledDate instanceof Date
        ? exam.scheduledDate
        : exam.scheduledDate?.toDate?.() || new Date();
      const dateKey = examDate.toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(exam);
    });
    return grouped;
  }, [items]);

  // Get unique dates sorted
  const sortedDates = useMemo(() => {
    return Object.keys(examsByDate).sort();
  }, [examsByDate]);

  // Get exams for selected date or all upcoming
  const displayedExams = useMemo(() => {
    if (selectedDate) {
      const dateKey = selectedDate.toISOString().split('T')[0];
      return examsByDate[dateKey] || [];
    }
    // Show all exams sorted by date
    return sortedDates.flatMap(dateKey => examsByDate[dateKey]);
  }, [selectedDate, examsByDate, sortedDates]);

  // Get unique month-year combinations for filtering
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    sortedDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const monthYear = `${date.toLocaleString('default', {month: 'long'})} ${date.getFullYear()}`;
      months.add(monthYear);
    });
    return Array.from(months).sort();
  }, [sortedDates]);

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDay = new Date(date);
    examDay.setHours(0, 0, 0, 0);

    const diffTime = examDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let dayLabel = '';
    if (diffDays === 0) dayLabel = 'Today';
    else if (diffDays === 1) dayLabel = 'Tomorrow';
    else if (diffDays === -1) dayLabel = 'Yesterday';
    else if (diffDays > 0 && diffDays <= 7) dayLabel = `In ${diffDays} days`;
    else if (diffDays < 0) dayLabel = `${Math.abs(diffDays)} days ago`;

    return {
      dateStr: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      dayLabel,
    };
  };

  const renderDateSection = ({item: dateStr}: {item: string}) => {
    const exams = examsByDate[dateStr];
    if (!exams || exams.length === 0) return null;

    const {dateStr: formattedDate, dayLabel} = formatDateHeader(dateStr);

    return (
      <View style={styles.dateSection}>
        <View style={styles.dateHeader}>
          <View>
            <Text style={styles.dateTitle}>{formattedDate}</Text>
            {dayLabel && <Text style={styles.dayLabel}>{dayLabel}</Text>}
          </View>
          <View style={styles.examCountBadge}>
            <Text style={styles.examCountText}>{exams.length}</Text>
          </View>
        </View>
        {exams.map(exam => (
          <ExamScheduleCard
            key={exam.id}
            exam={exam}
            compact={false}
          />
        ))}
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState variant="no-exam-schedule" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exam Calendar</Text>
        <Text style={styles.subtitle}>
          {items.length} exam{items.length !== 1 ? 's' : ''} scheduled
        </Text>
      </View>

      {selectedDate && (
        <TouchableOpacity
          style={styles.clearFilter}
          onPress={() => setSelectedDate(null)}>
          <Text style={styles.clearFilterText}>
            Clear filter: {selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={sortedDates}
        keyExtractor={item => item}
        renderItem={renderDateSection}
        ListEmptyComponent={
          selectedDate ? (
            <EmptyState
              variant="no-exam-schedule"
              customMessage="No exams scheduled for this date"
            />
          ) : (
            <EmptyState variant="no-exam-schedule" />
          )
        }
        contentContainerStyle={{paddingBottom: 40}}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f6f9',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c1222',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#5a6a7a',
  },
  clearFilter: {
    backgroundColor: '#e8f0f8',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d0e0f0',
  },
  clearFilterText: {
    color: '#1e3a5f',
    fontSize: 13,
    fontWeight: '600',
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
  },
  dateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
  },
  dayLabel: {
    fontSize: 12,
    color: '#1e3a5f',
    marginTop: 2,
    fontWeight: '600',
  },
  examCountBadge: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  examCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default ExamCalendarScreen;


