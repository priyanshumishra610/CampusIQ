import React, {useMemo, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView} from 'react-native';
import {useSelector} from 'react-redux';
import ExamScheduleCard from '../../components/ExamScheduleCard';
import EmptyState from '../../components/EmptyState';
import {Exam} from '../../redux/examSlice';
import {RootState} from '../../redux/store';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

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
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.sm * 1.5,
  },
  clearFilter: {
    backgroundColor: colors.primaryLighter,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearFilterText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  dateSection: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  dayLabel: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs / 2,
    fontWeight: fontWeight.medium,
  },
  examCountBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  examCountText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
});

export default ExamCalendarScreen;




