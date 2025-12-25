import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Role, signUp} from '../../redux/slices/authSlice';
import {RootState} from '../../redux/store';
import {AdminRole, getRoleDisplayName} from '../../config/permissions';

const adminRoles: {value: AdminRole; label: string; description: string}[] = [
  {value: 'REGISTRAR', label: 'Registrar', description: 'Records & enrollment'},
  {value: 'DEAN', label: 'Dean', description: 'Academic oversight'},
  {value: 'DIRECTOR', label: 'Director', description: 'Full operations'},
  {value: 'EXECUTIVE', label: 'Executive', description: 'View-only access'},
];

const RegisterScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {loading, error} = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('REGISTRAR');

  const handleRegister = () => {
    const role: Role = 'ADMIN';
    dispatch(signUp({
      email,
      password,
      name,
      role,
      adminRole: selectedRole,
      department,
    }) as any);
  };

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Administrator Registration</Text>
        <Text style={styles.subtitle}>
          Request access to CampusIQ administrative portal
        </Text>
      </View>
      
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Dr. Jane Smith"
        placeholderTextColor="#7a8a9a"
        value={name}
        onChangeText={setName}
      />
      
      <Text style={styles.label}>Department / Office</Text>
      <TextInput
        style={styles.input}
        placeholder="Office of the Registrar"
        placeholderTextColor="#7a8a9a"
        value={department}
        onChangeText={setDepartment}
      />
      
      <Text style={styles.label}>Institutional Email</Text>
      <TextInput
        style={styles.input}
        placeholder="jane.smith@university.edu"
        placeholderTextColor="#7a8a9a"
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Create secure password"
        placeholderTextColor="#7a8a9a"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <Text style={styles.label}>Administrative Role</Text>
      <View style={styles.roleGrid}>
        {adminRoles.map(role => (
          <TouchableOpacity
            key={role.value}
            style={[
              styles.roleButton,
              selectedRole === role.value && styles.roleActive,
            ]}
            onPress={() => setSelectedRole(role.value)}>
            <Text
              style={[
                styles.roleText,
                selectedRole === role.value && styles.roleTextActive,
              ]}>
              {role.label}
            </Text>
            <Text
              style={[
                styles.roleDescription,
                selectedRole === role.value && styles.roleDescriptionActive,
              ]}>
              {role.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TouchableOpacity
        style={[styles.button, loading && {opacity: 0.8}]}
        onPress={handleRegister}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit Registration</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Return to sign in</Text>
      </TouchableOpacity>
      
      <Text style={styles.notice}>
        Registration requires institutional email verification. Access is
        granted by system administrators.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
  container: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0c1222',
  },
  subtitle: {
    fontSize: 14,
    color: '#5a6a7a',
    marginTop: 6,
    lineHeight: 20,
  },
  label: {
    fontWeight: '600',
    color: '#3a4a5a',
    marginBottom: 6,
    marginTop: 8,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4dce6',
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
    backgroundColor: '#fff',
    color: '#0c1222',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
    color: '#1e3a5f',
    fontWeight: '600',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  roleButton: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#d4dce6',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  roleActive: {
    borderColor: '#1e3a5f',
    backgroundColor: '#e8f0f8',
  },
  roleText: {
    fontWeight: '600',
    color: '#3a4a5a',
    fontSize: 14,
  },
  roleTextActive: {
    color: '#1e3a5f',
  },
  roleDescription: {
    fontSize: 11,
    color: '#7a8a9a',
    marginTop: 2,
  },
  roleDescriptionActive: {
    color: '#4a6a8a',
  },
  error: {
    color: '#c0392b',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 13,
  },
  notice: {
    marginTop: 32,
    textAlign: 'center',
    color: '#8a9aaa',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});

export default RegisterScreen;
