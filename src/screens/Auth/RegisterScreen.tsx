import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {Role, signUp} from '../../redux/authSlice';
import {RootState} from '../../redux/store';
import {AdminRole, getRoleDisplayName} from '../../config/permissions';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

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
    <KeyboardAvoidingView
      style={styles.scrollContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Administrator Registration</Text>
          <Text style={styles.subtitle}>
            Request access to CampusIQ administrative portal
          </Text>
        </View>
        
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Dr. Jane Smith"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Department / Office</Text>
            <TextInput
              style={styles.input}
              placeholder="Office of the Registrar"
              placeholderTextColor={colors.textTertiary}
              value={department}
              onChangeText={setDepartment}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Institutional Email</Text>
            <TextInput
              style={styles.input}
              placeholder="jane.smith@university.edu"
              placeholderTextColor={colors.textTertiary}
              value={email}
              autoCapitalize="none"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create secure password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Administrative Role</Text>
            <View style={styles.roleGrid}>
              {adminRoles.map(role => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleButton,
                    selectedRole === role.value && styles.roleActive,
                  ]}
                  onPress={() => setSelectedRole(role.value)}
                  activeOpacity={0.7}>
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
          </View>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Submit Registration</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.linkContainer}
            activeOpacity={0.7}>
            <Text style={styles.link}>Return to sign in</Text>
          </TouchableOpacity>
          
          <View style={styles.noticeContainer}>
            <Text style={styles.notice}>
              Registration requires institutional email verification. Access is
              granted by system administrators.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing['2xl'],
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['5xl'],
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: spacing['4xl'],
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
    lineHeight: fontSize.sm * 1.5,
    fontWeight: fontWeight.normal,
  },
  formSection: {
    gap: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  label: {
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
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
    minHeight: 40,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  roleButton: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    minHeight: 80,
    justifyContent: 'center',
  },
  roleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLighter,
    ...shadows.md,
  },
  roleText: {
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    marginBottom: spacing.xs,
    letterSpacing: -0.2,
  },
  roleTextActive: {
    color: colors.primary,
  },
  roleDescription: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * 1.4,
  },
  roleDescriptionActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * 1.5,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.base,
  },
  linkContainer: {
    marginTop: spacing['2xl'],
    alignItems: 'center',
  },
  link: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.base,
  },
  noticeContainer: {
    marginTop: spacing['4xl'],
    padding: spacing.xl,
    backgroundColor: colors.backgroundTertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notice: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.6,
    fontWeight: fontWeight.medium,
  },
});

export default RegisterScreen;
