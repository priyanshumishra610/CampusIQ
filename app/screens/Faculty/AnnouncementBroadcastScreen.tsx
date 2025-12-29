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
import {useSelector} from 'react-redux';
import {RootState} from '../../redux/store';
import {Colors, Typography, Spacing, BorderRadius} from '../../theme/designTokens';
import {getCourses} from '../../services/courses.service';
import {createAnnouncement} from '../../services/communication.service';

const AnnouncementBroadcastScreen = ({navigation}: any) => {
  const {user} = useSelector((state: RootState) => state.auth);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<'ALL' | 'COURSE' | 'DEPARTMENT'>('ALL');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [user]);

  const loadCourses = async () => {
    if (!user?.id) return;
    try {
      const coursesData = await getCourses({facultyId: user.id});
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const handleBroadcast = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter announcement title');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Error', 'Please enter announcement content');
      return;
    }

    if (selectedAudience === 'COURSE' && !selectedCourseId) {
      Alert.alert('Error', 'Please select a course');
      return;
    }

    setBroadcasting(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        priority,
        audience: selectedAudience,
        courseId: selectedAudience === 'COURSE' ? selectedCourseId : undefined,
        createdBy: user?.id || '',
        createdByName: user?.name || '',
        campusId: user?.campusId || '',
      });

      Alert.alert('Success', 'Announcement broadcasted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setTitle('');
            setContent('');
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to broadcast announcement');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Broadcast Announcement</Text>
        <Text style={styles.headerSubtitle}>Share important information with students</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter announcement title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Content *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter announcement content"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityContainer}>
          {(['LOW', 'MEDIUM', 'HIGH'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityButton,
                priority === p && styles.priorityButtonActive,
                priority === 'HIGH' && priority === p && styles.priorityButtonHigh,
              ]}
              onPress={() => setPriority(p)}>
              <Text
                style={[
                  styles.priorityText,
                  priority === p && styles.priorityTextActive,
                ]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Audience *</Text>
        <View style={styles.audienceContainer}>
          {(['ALL', 'COURSE', 'DEPARTMENT'] as const).map(audience => (
            <TouchableOpacity
              key={audience}
              style={[
                styles.audienceButton,
                selectedAudience === audience && styles.audienceButtonActive,
              ]}
              onPress={() => {
                setSelectedAudience(audience);
                if (audience !== 'COURSE') {
                  setSelectedCourseId(null);
                }
              }}>
              <Text
                style={[
                  styles.audienceText,
                  selectedAudience === audience && styles.audienceTextActive,
                ]}>
                {audience === 'ALL'
                  ? 'All Students'
                  : audience === 'COURSE'
                  ? 'Specific Course'
                  : 'Department'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedAudience === 'COURSE' && (
        <View style={styles.section}>
          <Text style={styles.label}>Select Course *</Text>
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
      )}

      <TouchableOpacity
        style={[styles.broadcastButton, broadcasting && styles.broadcastButtonDisabled]}
        onPress={handleBroadcast}
        disabled={broadcasting}>
        {broadcasting ? (
          <ActivityIndicator color={Colors.textInverse} />
        ) : (
          <Text style={styles.broadcastButtonText}>📢 Broadcast Announcement</Text>
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
    minHeight: 150,
    paddingTop: Spacing.base,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityButton: {
    flex: 1,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priorityButtonHigh: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  priorityText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textSecondary,
  },
  priorityTextActive: {
    color: Colors.textInverse,
  },
  audienceContainer: {
    gap: Spacing.sm,
  },
  audienceButton: {
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  audienceButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  audienceText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  audienceTextActive: {
    color: Colors.textInverse,
  },
  courseSelector: {
    gap: Spacing.sm,
  },
  courseOption: {
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  courseOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  courseOptionText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textSecondary,
  },
  courseOptionTextActive: {
    color: Colors.textInverse,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  broadcastButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    marginTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  broadcastButtonDisabled: {
    opacity: 0.6,
  },
  broadcastButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default AnnouncementBroadcastScreen;

