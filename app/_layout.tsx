import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '@/providers/AppProvider';
import Colors from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

try {
  const Purchases = require('react-native-purchases').default;
  const getRCToken = () => {
    if (__DEV__ || Platform.OS === 'web') return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? '';
    return Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? '',
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY ?? '',
      default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY ?? '',
    });
  };
  const rcToken = getRCToken();
  if (rcToken) {
    Purchases.configure({ apiKey: rcToken });
    console.log('[RevenueCat] Configured');
  }
} catch (e) {
  console.log('[RevenueCat] Failed to configure:', e);
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen
        name="session"
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProvider>
          <RootLayoutNav />
        </AppProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
