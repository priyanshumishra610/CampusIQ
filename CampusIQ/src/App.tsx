import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {SafeAreaView, StatusBar, Text, TouchableOpacity, View} from 'react-native';
import {AppDispatch} from './redux/store';
import RootNavigator from './navigation/RootNavigator';
import {initAuthListener} from './redux/authSlice';
import {registerDeviceToken} from './services/notification.service';
import {seedDemoData} from './services/demoSeed.service';
import firebase from './services/firebase';

type BootState = 'booting' | 'ready' | 'error';

const Splash = ({message, onRetry}: {message?: string; onRetry: () => void}) => (
  <SafeAreaView
    style={{
      flex: 1,
      backgroundColor: '#0c1222',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    }}>
    <StatusBar barStyle="light-content" backgroundColor="#0c1222" />
    <View
      style={{
        width: 88,
        height: 88,
        borderRadius: 20,
        backgroundColor: '#1e3a5f',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#2d5a87',
      }}>
      <Text style={{fontSize: 32, fontWeight: '900', color: '#64b5f6'}}>IQ</Text>
    </View>
    <Text style={{color: '#e8eef4', fontSize: 26, fontWeight: '800', letterSpacing: 1}}>
      CampusIQ
    </Text>
    <Text style={{color: '#8ba4bc', fontSize: 13, marginTop: 6, textAlign: 'center'}}>
      College Operations Intelligence
    </Text>
    {message ? (
      <Text
        style={{
          color: '#c9d6e3',
          marginTop: 16,
          textAlign: 'center',
          lineHeight: 20,
          fontSize: 14,
        }}>
        {message}
      </Text>
    ) : null}
    <TouchableOpacity
      onPress={onRetry}
      style={{
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#1e3a5f',
        borderWidth: 1,
        borderColor: '#2d5a87',
      }}>
      <Text style={{color: '#64b5f6', fontWeight: '700'}}>Retry</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

const isFirebaseReady = () => {
  try {
    // Check if Firebase app is initialized
    const app = firebase.app();
    if (!app) {
      return false;
    }
    // Verify Firebase app name (default app should exist)
    const appName = app.name;
    return appName === '[DEFAULT]' || appName.length > 0;
  } catch (error) {
    console.warn('Firebase initialization check failed:', error);
    return false;
  }
};

const Bootstrapper = ({onError}: {onError: (message: string) => void}) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const start = async () => {
      try {
        await dispatch(initAuthListener()).unwrap();
      } catch (error) {
        onError('Startup failed. Check Firebase and restart the app.');
        return;
      }
      registerDeviceToken().catch(() => {});
      seedDemoData().catch(() => {});
    };
    start();
  }, [dispatch, onError]);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f4f6f9'}}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6f9" />
      <RootNavigator />
    </SafeAreaView>
  );
};

class AppBoundary extends React.Component<
  {children: React.ReactNode; onReset: () => void},
  {error?: string}
> {
  constructor(props: {children: React.ReactNode; onReset: () => void}) {
    super(props);
    this.state = {error: undefined};
  }

  static getDerivedStateFromError(error: Error) {
    return {error: error?.message || 'Unexpected error'};
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <Splash
          message="Something went wrong. Please reopen the app."
          onRetry={() => {
            this.setState({error: undefined});
            this.props.onReset();
          }}
        />
      );
    }
    return this.props.children;
  }
}

const App = (): React.JSX.Element => {
  const [bootState, setBootState] = useState<BootState>('booting');
  const [bootMessage, setBootMessage] = useState<string>();

  const handleError = useCallback((message: string) => {
    setBootMessage(message);
    setBootState('error');
  }, []);

  const handleReset = useCallback(() => {
    setBootMessage(undefined);
    setBootState('booting');
  }, []);

  useEffect(() => {
    if (bootState !== 'booting') {
      return;
    }
    if (!isFirebaseReady()) {
      setBootMessage('Firebase is not configured. Update google-services files and restart.');
      setBootState('error');
      return;
    }
    setBootState('ready');
  }, [bootState]);

  if (bootState !== 'ready') {
    return <Splash message={bootMessage || 'Initializing administrative systems...'} onRetry={handleReset} />;
  }

  return (
    <AppBoundary onReset={handleReset}>
      <Bootstrapper onError={handleError} />
      {/* Temporary Firebase verification - Remove after verification */}
      {bootState === 'ready' && (
        <Text
          style={{
            position: 'absolute',
            top: 50,
            left: 20,
            color: 'green',
            fontSize: 12,
            fontWeight: 'bold',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: 4,
            borderRadius: 4,
          }}>
          Firebase Configured!
        </Text>
      )}
    </AppBoundary>
  );
};

export default App;
