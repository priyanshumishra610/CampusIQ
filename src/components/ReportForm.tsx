import React, {useState} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {getCurrentLocation} from '../services/maps.service';
import {colors} from '../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../theme/spacing';
import {shadows} from '../theme/shadows';

type Props = {
  onSubmit: (payload: {
    title: string;
    description: string;
    location?: {lat: number; lng: number};
    imageBase64?: string;
  }) => void;
  loading?: boolean;
};

const ReportForm = ({onSubmit, loading}: Props) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{lat: number; lng: number} | undefined>();
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [locating, setLocating] = useState(false);

  const handleLocation = async () => {
    setLocating(true);
    const coords = await getCurrentLocation();
    if (coords) {
      setLocation(coords);
    }
    setLocating(false);
  };

  const handleImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.7,
    });
    const asset = result?.assets?.[0];
    if (asset?.base64) {
      setImageBase64(asset.base64);
    }
  };

  const submit = () => {
    if (!title || !description) {
      return;
    }
    onSubmit({title, description, location, imageBase64});
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Task Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Brief summary of the task"
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
      />
      <Text style={styles.label}>Details</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Provide context, stakeholders, deadlines, or compliance requirements"
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={5}
      />
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, location && {backgroundColor: colors.success}]}
          onPress={handleLocation}
          activeOpacity={0.8}
          disabled={locating}>
          {locating ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {location ? '✓ Location Added' : '📍 Add Location'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, imageBase64 && {backgroundColor: colors.success}]}
          onPress={handleImage}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>
            {imageBase64 ? '✓ Photo Added' : '📷 Add Photo'}
          </Text>
        </TouchableOpacity>
      </View>
      {imageBase64 && (
        <Image
          source={{uri: `data:image/jpeg;base64,${imageBase64}`}}
          style={styles.preview}
        />
      )}
      <TouchableOpacity
        style={[styles.submit, loading && {opacity: 0.6}]}
        onPress={submit}
        disabled={loading || !title || !description}
        activeOpacity={0.8}>
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <Text style={styles.submitText}>Create Task</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  label: {
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    fontSize: fontSize.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    color: colors.textPrimary,
    fontSize: fontSize.base,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    backgroundColor: colors.info,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
  preview: {
    height: 180,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submit: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  submitText: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.base,
  },
});

export default ReportForm;
