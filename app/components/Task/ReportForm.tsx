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
import {getCurrentLocation} from '../../services/maps.service';

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
        placeholderTextColor="#9aaaba"
        style={styles.input}
      />
      <Text style={styles.label}>Details</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Provide context, stakeholders, deadlines, or compliance requirements"
        placeholderTextColor="#9aaaba"
        style={[styles.input, styles.multiline]}
        multiline
        numberOfLines={5}
      />
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={handleLocation}>
          {locating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {location ? '✓ Location Added' : '📍 Add Location'}
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleImage}>
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
        style={[styles.submit, loading && {opacity: 0.7}]}
        onPress={submit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Create Task</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontWeight: '600',
    color: '#3a4a5a',
    marginTop: 8,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    backgroundColor: '#2980b9',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  preview: {
    height: 160,
    borderRadius: 10,
    marginTop: 8,
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

export default ReportForm;
