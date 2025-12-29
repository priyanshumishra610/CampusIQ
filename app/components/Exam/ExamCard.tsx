import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Exam, ExamType} from '../../redux/slices/examSlice';

type Props = {
  exam: Exam;
  onPress?: () => void;
};

const examTypeConfig: Record<ExamType, {label: string; color: string}> = {
  MIDTERM: {label: 'Midterm', color: '#e74c3c'},
  FINAL: {label: 'Final', color: '#c0392b'},
  QUIZ: {label: 'Quiz', color: '#3498db'},
  ASSIGNMENT: {label: 'Assignment', color: '#9b59b6'},
  PROJECT: {label: 'Project', color: '#16a085'},
};

const ExamCard = ({exam, onPress}: Props) => {
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

  const statusColor = {
    DRAFT: '#95a5a6',
    SCHEDULED: '#3498db',
    IN_PROGRESS: '#f39c12',
    COMPLETED: '#27ae60',
    CANCELLED: '#e74c3c',
  }[exam.status];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>{exam.title}</Text>
          <Text style={styles.courseCode}>{exam.courseCode}</Text>
        </View>
        <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
          <Text style={styles.statusText}>{exam.status}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.typeBadge, {backgroundColor: typeConfig.color}]}>
          <Text style={styles.typeText}>{typeConfig.label}</Text>
        </View>
        <Text style={styles.meta}>
          {exam.courseName}
        </Text>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{examDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>
            {formatTime(exam.startTime)} - {formatTime(exam.endTime)}
          </Text>
        </View>
      </View>

      {exam.room && (
        <View style={styles.locationRow}>
          <Text style={styles.location}>
            📍 {exam.building ? `${exam.building} - ` : ''}{exam.room}
          </Text>
          <Text style={styles.capacity}>
            {exam.studentCount}/{exam.capacity} students
          </Text>
        </View>
      )}

      {exam.conflictWarnings && exam.conflictWarnings.length > 0 && (
        <View style={styles.conflictWarning}>
          <View style={styles.conflictTextContainer}>
            <Icon name="warning" size={16} color="#e74c3c" style={{marginRight: 4}} />
            <Text style={styles.conflictText}>
              {exam.conflictWarnings.length} conflict{exam.conflictWarnings.length > 1 ? 's' : ''} detected
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {exam.createdByName || 'Administrator'}
        </Text>
        <Text style={styles.footerDate}>
          {exam.createdAt instanceof Date
            ? exam.createdAt.toDateString()
            : new Date(exam.createdAt?.toDate?.() ?? Date.now()).toDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e4e8ec',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c1222',
    lineHeight: 22,
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 12,
    color: '#5a6a7a',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
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
  meta: {
    flex: 1,
    color: '#5a6a7a',
    fontSize: 12,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#7a8a9a',
    marginBottom: 2,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#2a3a4a',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f4',
  },
  location: {
    color: '#5a6a7a',
    fontSize: 12,
    fontWeight: '500',
  },
  capacity: {
    color: '#7a8a9a',
    fontSize: 11,
  },
  conflictWarning: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  conflictTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conflictText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    color: '#7a8a9a',
    fontSize: 12,
    fontWeight: '500',
  },
  footerDate: {
    color: '#9aaaba',
    fontSize: 11,
  },
});

export default ExamCard;


