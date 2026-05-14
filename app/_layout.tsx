import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthGate } from '@/components/AuthGate';

import '../global.css';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false
        }}
      />
      <AuthGate />
      <StatusBar style="auto" />
    </>
  );
}
