import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import {Exam, ExamType} from '../../redux/slices/examSlice';

type Props = {
  exam: Exam;
  compact?: boolean;
};

const examTypeConfig: Record<ExamType, {label: string; color: string; short: string}> = {
  MIDTERM: {label: 'Midterm', color: '#e74c3c', short: 'MT'},
  FINAL: {label: 'Final', color: '#c0392b', short: 'F'},
  QUIZ: {label: 'Quiz', color: '#3498db', short: 'Q'},
  ASSIGNMENT: {label: 'Assignment', color: '#9b59b6', short: 'A'},
  PROJECT: {label: 'Project', color: '#16a085', short: 'P'},
};

const ExamScheduleCard = ({exam, compact = false}: Props) => {
  const examDate = exam.scheduledDate instanceof Date
    ? exam.scheduledDate
    : exam.scheduledDate?.toDate?.() || new Date();

  const typeConfig = examTypeConfig[exam.examType];

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={[styles.compactTypeBadge, {backgroundColor: typeConfig.color}]}>
          <Text style={styles.compactTypeText}>{typeConfig.short}</Text>
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle} numberOfLines={1}>{exam.title}</Text>
          <Text style={styles.compactMeta}>
            {exam.courseCode} • {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
            {exam.room ? ` • ${exam.room}` : ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, {backgroundColor: typeConfig.color}]}>
          <Text style={styles.typeText}>{typeConfig.label}</Text>
        </View>
        <Text style={styles.courseCode}>{exam.courseCode}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>{exam.title}</Text>
      <Text style={styles.courseName}>{exam.courseName}</Text>

      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Date</Text>
          <Text style={styles.timeValue}>{examDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Time</Text>
          <Text style={styles.timeValue}>
            {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
          </Text>
        </View>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Duration</Text>
          <Text style={styles.timeValue}>{exam.duration} min</Text>
        </View>
      </View>

      {exam.room && (
        <View style={styles.locationRow}>
          <Text style={styles.location}>
            📍 {exam.building ? `${exam.building} - ` : ''}{exam.room}
          </Text>
          <Text style={styles.students}>{exam.studentCount} students</Text>
        </View>
      )}

      {exam.instructions && (
        <Text style={styles.instructions} numberOfLines={2}>
          {exam.instructions}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  compactCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  compactTypeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTypeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  courseCode: {
    fontSize: 12,
    color: '#1e3a5f',
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    marginBottom: 4,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0c1222',
    flex: 1,
  },
  courseName: {
    fontSize: 13,
    color: '#5a6a7a',
    marginBottom: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactMeta: {
    fontSize: 11,
    color: '#7a8a9a',
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 10,
    color: '#7a8a9a',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timeValue: {
    fontSize: 13,
    color: '#2a3a4a',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f4',
    marginTop: 8,
  },
  location: {
    color: '#5a6a7a',
    fontSize: 12,
    fontWeight: '500',
  },
  students: {
    color: '#7a8a9a',
    fontSize: 11,
    fontWeight: '600',
  },
  instructions: {
    marginTop: 12,
    fontSize: 12,
    color: '#5a6a7a',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});

export default ExamScheduleCard;


