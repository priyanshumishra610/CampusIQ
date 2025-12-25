import React, {useCallback, useEffect, useState} from 'react';
import {useDispatch} from 'react-redux';
import {SafeAreaView, StatusBar, Text, TouchableOpacity, View} from 'react-native';
import {AppDispatch} from './redux/store';
import RootNavigator from './navigation/RootNavigator';
import {initAuthListener} from './redux/authSlice';
import {registerDeviceToken} from './services/notification.service';
import {seedDemoData} from './services/demoSeed.service';
import firebase from './services/firebase';
import {colors} from './theme/colors';
import {spacing, borderRadius, fontSize, fontWeight} from './theme/spacing';
import {shadows} from './theme/shadows';

type BootState = 'booting' | 'ready' | 'error';

const Splash = ({message, onRetry}: {message?: string; onRetry: () => void}) => (
  <SafeAreaView
    style={{
      flex: 1,
      backgroundColor: colors.primaryDark,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing['2xl'],
    }}>
    <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />
    <View
      style={{
        width: 96,
        height: 96,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
        ...shadows.xl,
      }}>
      <Text style={{fontSize: fontSize['4xl'], fontWeight: fontWeight.extrabold, color: colors.textInverse, letterSpacing: 2}}>IQ</Text>
    </View>
    <Text style={{color: colors.textInverse, fontSize: fontSize['3xl'], fontWeight: fontWeight.extrabold, letterSpacing: 1.5, marginBottom: spacing.xs}}>
      CampusIQ
    </Text>
    <Text style={{color: colors.textInverse + 'CC', fontSize: fontSize.base, marginTop: spacing.xs, textAlign: 'center', fontWeight: fontWeight.medium}}>
      College Operations Intelligence
    </Text>
    {message ? (
      <View style={{
        marginTop: spacing.xl,
        padding: spacing.md,
        backgroundColor: colors.error + '20',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.error + '40',
        maxWidth: 320,
      }}>
        <Text
          style={{
            color: colors.textInverse + 'E6',
            textAlign: 'center',
            lineHeight: fontSize.base * 1.5,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
          }}>
          {message}
        </Text>
      </View>
    ) : null}
    {message && (
      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        style={{
          marginTop: spacing.xl,
          paddingHorizontal: spacing['2xl'],
          paddingVertical: spacing.md,
          borderRadius: borderRadius.md,
          backgroundColor: colors.primary,
          borderWidth: 1,
          borderColor: colors.primaryLight,
          ...shadows.md,
        }}>
        <Text style={{color: colors.textInverse, fontWeight: fontWeight.bold, fontSize: fontSize.base, letterSpacing: 0.3}}>Retry</Text>
      </TouchableOpacity>
    )}
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
    <SafeAreaView style={{flex: 1, backgroundColor: colors.background}}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
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
    </AppBoundary>
  );
};

export default App;
