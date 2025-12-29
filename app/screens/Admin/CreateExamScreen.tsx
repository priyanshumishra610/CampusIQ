import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {createExam, checkExamConflicts, ExamType, clearConflicts} from '../../redux/slices/examSlice';
import {RootState} from '../../redux/store';
import NetInfo from '@react-native-community/netinfo';
import {PermissionGate} from '../../components/Common';

const examTypes: {value: ExamType; label: string}[] = [
  {value: 'MIDTERM', label: 'Midterm'},
  {value: 'FINAL', label: 'Final'},
  {value: 'QUIZ', label: 'Quiz'},
  {value: 'ASSIGNMENT', label: 'Assignment'},
  {value: 'PROJECT', label: 'Project'},
];

const CreateExamScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {creating, error, conflicts, conflictChecking} = useSelector((state: RootState) => state.exams);
  const user = useSelector((state: RootState) => state.auth.user);

  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [examType, setExamType] = useState<ExamType>('MIDTERM');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [duration, setDuration] = useState('120');
  const [room, setRoom] = useState('');
  const [building, setBuilding] = useState('');
  const [capacity, setCapacity] = useState('');
  const [instructions, setInstructions] = useState('');
  const [enrolledStudents, setEnrolledStudents] = useState<string[]>([]);
  const [studentIdsInput, setStudentIdsInput] = useState('');

  useEffect(() => {
    return () => {
      dispatch(clearConflicts());
    };
  }, [dispatch]);

  const handleDateChange = (text: string) => {
    // Simple date input validation (YYYY-MM-DD format)
    const dateMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateMatch) {
      const newDate = new Date(text);
      if (!isNaN(newDate.getTime())) {
        setScheduledDate(newDate);
      }
    }
  };

  const calculateDuration = () => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const diff = endMinutes - startMinutes;
    if (diff > 0) {
      setDuration(diff.toString());
    }
  };

  useEffect(() => {
    if (startTime && endTime) {
      calculateDuration();
    }
  }, [startTime, endTime]);

  const handleCheckConflicts = async () => {
    if (!scheduledDate || !startTime || !endTime) {
      Alert.alert('Error', 'Please fill in date and time fields first');
      return;
    }

    const studentIds = studentIdsInput
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    dispatch(checkExamConflicts({
      scheduledDate,
      startTime,
      endTime,
      room: room || undefined,
      enrolledStudents: studentIds.length > 0 ? studentIds : undefined,
    }) as any).then((result: any) => {
      if (result.payload && Array.isArray(result.payload) && result.payload.length > 0) {
        const conflictMessages = result.payload.map((c: any) => `• ${c.message}`).join('\n');
        Alert.alert('Conflicts Detected', conflictMessages);
      } else {
        Alert.alert('No Conflicts', 'No scheduling conflicts detected.');
      }
    });
  };

  const handleSubmit = async () => {
    if (!title || !courseCode || !courseName || !startTime || !endTime || !capacity) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) return;

    const net = await NetInfo.fetch();
    const isOnline =
      net.isConnected && (net.isInternetReachable === null || net.isInternetReachable);

    const studentIds = studentIdsInput
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    dispatch(
      createExam({
        title,
        courseCode,
        courseName,
        examType,
        scheduledDate,
        startTime,
        endTime,
        duration: parseInt(duration, 10),
        room: room || undefined,
        building: building || undefined,
        capacity: parseInt(capacity, 10),
        instructions: instructions || undefined,
        enrolledStudents: studentIds,
      }) as any,
    ).then((res: any) => {
      if (!res.error) {
        if (!isOnline) {
          Alert.alert('Saved Locally', 'Exam will sync when connected to network.');
        }
        navigation.goBack();
      } else {
        const message = res.payload || error || 'Could not create exam';
        Alert.alert('Error', message);
      }
    });
  };

  const dateString = scheduledDate.toISOString().split('T')[0];

  return (
    <PermissionGate permissions={['exam:create']}>
      <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
        <Text style={styles.title}>Create Exam Schedule</Text>
        <Text style={styles.subtitle}>
          Schedule exams with room assignments and student enrollment
        </Text>

        <Text style={styles.label}>Exam Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., CS101 Midterm Exam"
          placeholderTextColor="#9aaaba"
          style={styles.input}
        />

        <Text style={styles.label}>Course Code *</Text>
        <TextInput
          value={courseCode}
          onChangeText={setCourseCode}
          placeholder="e.g., CS101"
          placeholderTextColor="#9aaaba"
          style={styles.input}
        />

        <Text style={styles.label}>Course Name *</Text>
        <TextInput
          value={courseName}
          onChangeText={setCourseName}
          placeholder="e.g., Introduction to Computer Science"
          placeholderTextColor="#9aaaba"
          style={styles.input}
        />

        <Text style={styles.label}>Exam Type *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
          {examTypes.map(type => (
            <TouchableOpacity
              key={type.value}
              onPress={() => setExamType(type.value)}
              style={[
                styles.typeChip,
                examType === type.value && styles.typeChipActive,
              ]}>
              <Text
                style={[
                  styles.typeChipText,
                  examType === type.value && styles.typeChipTextActive,
                ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Scheduled Date * (YYYY-MM-DD)</Text>
        <TextInput
          value={dateString}
          onChangeText={handleDateChange}
          placeholder="2024-12-15"
          placeholderTextColor="#9aaaba"
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Start Time * (HH:mm)</Text>
            <TextInput
              value={startTime}
              onChangeText={setStartTime}
              placeholder="09:00"
              placeholderTextColor="#9aaaba"
              style={styles.input}
            />
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>End Time * (HH:mm)</Text>
            <TextInput
              value={endTime}
              onChangeText={setEndTime}
              placeholder="11:00"
              placeholderTextColor="#9aaaba"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>Duration (minutes)</Text>
        <TextInput
          value={duration}
          onChangeText={setDuration}
          placeholder="120"
          placeholderTextColor="#9aaaba"
          style={styles.input}
          keyboardType="numeric"
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Building</Text>
            <TextInput
              value={building}
              onChangeText={setBuilding}
              placeholder="Science Building"
              placeholderTextColor="#9aaaba"
              style={styles.input}
            />
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Room</Text>
            <TextInput
              value={room}
              onChangeText={setRoom}
              placeholder="A101"
              placeholderTextColor="#9aaaba"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>Capacity *</Text>
        <TextInput
          value={capacity}
          onChangeText={setCapacity}
          placeholder="50"
          placeholderTextColor="#9aaaba"
          style={styles.input}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Student IDs (comma-separated)</Text>
        <TextInput
          value={studentIdsInput}
          onChangeText={setStudentIdsInput}
          placeholder="student1, student2, student3"
          placeholderTextColor="#9aaaba"
          style={[styles.input, styles.multiline]}
          multiline
        />

        <Text style={styles.label}>Instructions</Text>
        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Additional instructions for students..."
          placeholderTextColor="#9aaaba"
          style={[styles.input, styles.multiline]}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.checkConflictBtn, conflictChecking && {opacity: 0.7}]}
          onPress={handleCheckConflicts}
          disabled={conflictChecking}>
          {conflictChecking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkConflictText}>🔍 Check for Conflicts</Text>
          )}
        </TouchableOpacity>

        {conflicts.length > 0 && (
          <View style={styles.conflictAlert}>
            <Text style={styles.conflictTitle}>⚠️ Conflicts Detected:</Text>
            {conflicts.map((conflict, idx) => (
              <Text key={idx} style={styles.conflictText}>
                • {conflict.message}
              </Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submit, creating && {opacity: 0.7}]}
          onPress={handleSubmit}
          disabled={creating}>
          {creating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Create Exam</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </PermissionGate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f6f9',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0c1222',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#5a6a7a',
    marginBottom: 20,
    lineHeight: 18,
  },
  label: {
    fontWeight: '600',
    color: '#3a4a5a',
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4dce6',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#fff',
    color: '#0c1222',
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  typeRow: {
    marginVertical: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4dce6',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  typeChipText: {
    color: '#3a4a5a',
    fontWeight: '600',
    fontSize: 13,
  },
  typeChipTextActive: {
    color: '#fff',
  },
  checkConflictBtn: {
    backgroundColor: '#f39c12',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  checkConflictText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  conflictAlert: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  conflictTitle: {
    color: '#856404',
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 13,
  },
  conflictText: {
    color: '#856404',
    fontSize: 12,
    lineHeight: 18,
  },
  submit: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default CreateExamScreen;

