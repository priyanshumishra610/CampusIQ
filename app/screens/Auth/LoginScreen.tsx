import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {signIn} from '../../redux/slices/authSlice';
import {RootState} from '../../redux/store';

const LoginScreen = ({navigation}: any) => {
  const dispatch = useDispatch();
  const {loading, error} = useSelector((state: RootState) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    dispatch(signIn({email, password}) as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>IQ</Text>
        </View>
        <Text style={styles.title}>CampusIQ</Text>
        <Text style={styles.subtitle}>Administrative Portal</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#7a8a9a"
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#7a8a9a"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.button, loading && {opacity: 0.8}]}
        onPress={handleLogin}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Request administrator access</Text>
      </TouchableOpacity>
      <Text style={styles.footer}>
        For authorized personnel only
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f4f6f9',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#64b5f6',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0c1222',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#5a6a7a',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4dce6',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
    color: '#0c1222',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
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
  error: {
    color: '#c0392b',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 13,
  },
  footer: {
    marginTop: 40,
    textAlign: 'center',
    color: '#8a9aaa',
    fontSize: 12,
  },
});

export default LoginScreen;
