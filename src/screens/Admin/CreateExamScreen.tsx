import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity, ActivityIndicator} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {createExam, checkExamConflicts, ExamType, clearConflicts} from '../../redux/examSlice';
import {RootState} from '../../redux/store';
import NetInfo from '@react-native-community/netinfo';
import PermissionGate from '../../components/PermissionGate';
import Button from '../../components/Button';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

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

        <Button
          title="🔍 Check for Conflicts"
          onPress={handleCheckConflicts}
          variant="secondary"
          size="md"
          disabled={conflictChecking}
          loading={conflictChecking}
          style={styles.checkConflictBtn}
        />

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

        <Button
          title="Create Exam"
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          disabled={creating}
          loading={creating}
          style={styles.submit}
        />
      </ScrollView>
    </PermissionGate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.background,
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
    marginBottom: spacing.lg,
    lineHeight: fontSize.sm * 1.5,
    fontWeight: fontWeight.normal,
  },
  label: {
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontSize: fontSize.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    minHeight: 40,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  typeRow: {
    marginVertical: spacing.sm,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    marginRight: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  typeChipTextActive: {
    color: colors.textInverse,
  },
  checkConflictBtn: {
    marginTop: spacing.lg,
  },
  conflictAlert: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  conflictTitle: {
    color: colors.warning,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.sm,
    fontSize: fontSize.sm,
  },
  conflictText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    fontWeight: fontWeight.normal,
  },
  submit: {
    marginTop: spacing.lg,
  },
});

export default CreateExamScreen;

