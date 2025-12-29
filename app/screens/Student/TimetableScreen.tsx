import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {fetchStudentTimetable} from '../../redux/slices';
import {getTimetableForDay, DayOfWeek} from '../../services/timetable.service';
import {TimetableEntry, DayOfWeek} from '../../services/timetable.service';

const DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TimetableScreen = () => {
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);
  const {entries, loading} = useSelector((state: RootState) => state.timetable);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchStudentTimetable({studentId: user.id}) as any);
    }
  }, [dispatch, user]);

  const dayEntries = getTimetableForDay(entries, selectedDay);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
        {DAYS.map((day, index) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayButton, selectedDay === day && styles.dayButtonActive]}
            onPress={() => setSelectedDay(day)}>
            <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>
              {DAY_NAMES[index]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {dayEntries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No classes scheduled for {selectedDay}</Text>
          </View>
        ) : (
          dayEntries.map(entry => (
            <View key={entry.id} style={styles.classCard}>
              <View style={styles.timeContainer}>
                <Text style={styles.time}>{entry.startTime}</Text>
                <Text style={styles.time}>{entry.endTime}</Text>
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.courseName}>{entry.courseName}</Text>
                <Text style={styles.courseCode}>{entry.courseCode}</Text>
                <Text style={styles.faculty}>{entry.facultyName}</Text>
                <Text style={styles.location}>
                  {entry.building} - {entry.room}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySelector: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e8ec',
  },
  dayButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  dayButtonActive: {
    backgroundColor: '#1e3a5f',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7a8a9a',
  },
  dayTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timeContainer: {
    width: 60,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 2,
    borderRightColor: '#e4e8ec',
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a5f',
    marginVertical: 2,
  },
  classInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 12,
    color: '#7a8a9a',
    marginBottom: 4,
  },
  faculty: {
    fontSize: 14,
    color: '#5a6a7a',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: '#7a8a9a',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#7a8a9a',
  },
});

export default TimetableScreen;

