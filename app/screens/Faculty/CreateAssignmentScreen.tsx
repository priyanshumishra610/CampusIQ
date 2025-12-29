import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {createAssignment} from '../../services/assignment.service';
import {Colors, Typography, Spacing, BorderRadius} from '../../theme/designTokens';
import {getCourses} from '../../services/courses.service';

const CreateAssignmentScreen = ({route, navigation}: any) => {
  const {courseId} = route.params || {};
  const dispatch = useDispatch();
  const {user} = useSelector((state: RootState) => state.auth);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxMarks, setMaxMarks] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId || '');
  const [courses, setCourses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    if (!user?.id) return;
    try {
      const coursesData = await getCourses({facultyId: user.id});
      setCourses(coursesData);
      if (coursesData.length > 0 && !selectedCourseId) {
        setSelectedCourseId(coursesData[0].id);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(dueDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDueDate(newDate);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter assignment title');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter assignment description');
      return;
    }

    if (!maxMarks || isNaN(Number(maxMarks)) || Number(maxMarks) <= 0) {
      Alert.alert('Error', 'Please enter valid maximum marks');
      return;
    }

    if (!selectedCourseId) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    if (dueDate.getTime() <= Date.now()) {
      Alert.alert('Error', 'Due date must be in the future');
      return;
    }

    setSubmitting(true);
    try {
      await createAssignment({
        courseId: selectedCourseId,
        title: title.trim(),
        description: description.trim(),
        maxMarks: Number(maxMarks),
        dueDate: dueDate.getTime(),
        facultyId: user?.id || '',
        facultyName: user?.name || '',
      });

      Alert.alert('Success', 'Assignment created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Assignment</Text>
        <Text style={styles.headerSubtitle}>Fill in the details below</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Course *</Text>
        {courses.length > 0 ? (
          <View style={styles.courseSelector}>
            {courses.map(course => (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseOption,
                  selectedCourseId === course.id && styles.courseOptionActive,
                ]}
                onPress={() => setSelectedCourseId(course.id)}>
                <Text
                  style={[
                    styles.courseOptionText,
                    selectedCourseId === course.id && styles.courseOptionTextActive,
                  ]}>
                  {course.code || course.name} - {course.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.errorText}>No courses available</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter assignment title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter assignment description and instructions"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Maximum Marks *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter maximum marks"
          value={maxMarks}
          onChangeText={setMaxMarks}
          keyboardType="numeric"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Due Date & Time *</Text>
        <View style={styles.dateTimeContainer}>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateTimeText}>
              Date: {dueDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dateTimeButton}
            onPress={() => setShowTimePicker(true)}>
            <Text style={styles.dateTimeText}>
              Time: {dueDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={handleDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={dueDate}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={Colors.textInverse} />
        ) : (
          <Text style={styles.submitButtonText}>Create Assignment</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    padding: Spacing.base,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryAccentLight,
  },
  section: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.base,
  },
  courseSelector: {
    gap: Spacing.sm,
  },
  courseOption: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
  },
  courseOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  courseOptionText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  courseOptionTextActive: {
    color: Colors.textInverse,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    marginTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default CreateAssignmentScreen;

