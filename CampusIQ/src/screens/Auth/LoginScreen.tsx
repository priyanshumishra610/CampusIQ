import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {signIn, signUp, setUser} from '../../redux/authSlice';
import {RootState} from '../../redux/store';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {colors} from '../../theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from '../../theme/spacing';
import {shadows} from '../../theme/shadows';

const LoginScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {loading, error} = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);

  const handleLogin = () => {
    dispatch(signIn({email, password}) as any);
  };

  // Quick login for development - bypasses Firebase if not configured
  const handleQuickLogin = async () => {
    if (quickLoginLoading) return;
    
    setQuickLoginLoading(true);
    const demoEmail = 'admin@campusiq.edu';
    const demoPassword = 'admin123';
    
    // Mock user profile for development (works even without Firebase)
    const mockProfile: any = {
      id: 'dev-admin-001',
      email: demoEmail,
      name: 'Admin User',
      role: 'ADMIN',
      adminRole: 'EXECUTIVE',
      department: 'Administration',
    };

    try {
      // Try Firebase login first
      try {
        await auth().signInWithEmailAndPassword(demoEmail, demoPassword);
        // If login succeeds, dispatch signIn which will fetch the profile
        dispatch(signIn({email: demoEmail, password: demoPassword}) as any);
        setQuickLoginLoading(false);
        return;
      } catch (signInError: any) {
        console.log('Sign in error:', signInError.code, signInError.message);
        
        // If user doesn't exist, try to create
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/invalid-email') {
          try {
            const credential = await auth().createUserWithEmailAndPassword(demoEmail, demoPassword);
            const userProfile = {
              id: credential.user.uid,
              email: demoEmail,
              name: 'Admin User',
              role: 'ADMIN',
              adminRole: 'EXECUTIVE',
              department: 'Administration',
            };
            await firestore().collection('users').doc(credential.user.uid).set(userProfile);
            // Use setUser directly after creating
            dispatch(setUser(userProfile));
            setQuickLoginLoading(false);
            return;
          } catch (createError: any) {
            console.log('Create user error:', createError.code, createError.message);
            // If creation fails (API key error, etc.), use mock
            console.log('Firebase not configured, using mock login');
            dispatch(setUser(mockProfile));
            setQuickLoginLoading(false);
            return;
          }
        } else {
          // Any other Firebase error (API key, network, etc.) - use mock
          console.log('Firebase error, using mock login:', signInError.code);
          dispatch(setUser(mockProfile));
          setQuickLoginLoading(false);
          return;
        }
      }
    } catch (error: any) {
      // Any error - use mock login (works without Firebase)
      console.log('Using mock login (Firebase not available):', error.message);
      dispatch(setUser(mockProfile));
      setQuickLoginLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>IQ</Text>
          </View>
          <Text style={styles.title}>CampusIQ</Text>
          <Text style={styles.subtitle}>Administrative Portal</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              autoCapitalize="none"
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Quick Login for Development */}
          <TouchableOpacity
            style={[styles.quickLoginButton, (loading || quickLoginLoading) && styles.buttonDisabled]}
            onPress={handleQuickLogin}
            disabled={loading || quickLoginLoading}
            activeOpacity={0.8}>
            {quickLoginLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.quickLoginText}>⚡ Quick Login (Dev Mode)</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.linkContainer}
            activeOpacity={0.7}>
            <Text style={styles.link}>Request administrator access</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>For authorized personnel only</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing['5xl'],
    paddingBottom: spacing['4xl'],
    justifyContent: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing['4xl'],
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.normal,
    lineHeight: fontSize.sm * 1.5,
  },
  formContainer: {
    marginBottom: spacing['3xl'],
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
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
  quickLoginButton: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    minHeight: 40,
    justifyContent: 'center',
    ...shadows.sm,
  },
  quickLoginText: {
    color: colors.textInverse,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 2,
    borderColor: '#fecaca',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.error,
    textAlign: 'center',
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * 1.5,
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
  footer: {
    marginTop: spacing['4xl'],
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * 1.5,
  },
});

export default LoginScreen;
