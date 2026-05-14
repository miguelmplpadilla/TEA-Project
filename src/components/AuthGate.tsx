import { router, usePathname, type Href } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { getFirebaseAuth, hasFirebaseConfig } from '@/services/firebase';

type AuthStatus = 'checking' | 'guest' | 'authenticated' | 'unconfigured';
const publicRoutes = ['/Onboarding', '/Register'];
const onboardingRoute = '/Onboarding' as Href;

export function AuthGate() {
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>(hasFirebaseConfig ? 'checking' : 'unconfigured');

  useEffect(() => {
    if (!hasFirebaseConfig) {
      setStatus('unconfigured');
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (currentUser) => {
      setStatus(currentUser ? 'authenticated' : 'guest');
    });
  }, []);

  useEffect(() => {
    if (status === 'checking') {
      return;
    }

    const isPublicRoute = publicRoutes.includes(pathname);

    if (status === 'authenticated' && isPublicRoute) {
      router.replace('/');
      return;
    }

    if (status !== 'authenticated' && !isPublicRoute) {
      router.replace(onboardingRoute);
    }
  }, [pathname, status]);

  if (status === 'checking') {
    return (
      <View style={styles.overlay}>
        <ActivityIndicator color="#20352b" size="large" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: '#f4f6f3',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
