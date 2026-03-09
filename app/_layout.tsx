import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Font from 'expo-font';
import { AppProvider } from '@/providers/AppProvider';
import DarkColors from '@/constants/darkColors';

void SplashScreen.preventAutoHideAsync();

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
        contentStyle: { backgroundColor: DarkColors.background },
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
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          Montserrat_100Thin: require('@expo-google-fonts/montserrat/100Thin/Montserrat_100Thin.ttf'),
          Montserrat_200ExtraLight: require('@expo-google-fonts/montserrat/200ExtraLight/Montserrat_200ExtraLight.ttf'),
          Montserrat_300Light: require('@expo-google-fonts/montserrat/Montserrat_300Light.ttf'),
          Montserrat_400Regular: require('@expo-google-fonts/montserrat/Montserrat_400Regular.ttf'),
          Montserrat_500Medium: require('@expo-google-fonts/montserrat/Montserrat_500Medium.ttf'),
          Montserrat_600SemiBold: require('@expo-google-fonts/montserrat/Montserrat_600SemiBold.ttf'),
          Montserrat_700Bold: require('@expo-google-fonts/montserrat/Montserrat_700Bold.ttf'),
          CormorantGaramond_300Light: require('@expo-google-fonts/cormorant-garamond/300Light/CormorantGaramond_300Light.ttf'),
          CormorantGaramond_400Regular: require('@expo-google-fonts/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf'),
          CormorantGaramond_500Medium: require('@expo-google-fonts/cormorant-garamond/500Medium/CormorantGaramond_500Medium.ttf'),
          CormorantGaramond_600SemiBold: require('@expo-google-fonts/cormorant-garamond/600SemiBold/CormorantGaramond_600SemiBold.ttf'),
          CormorantGaramond_700Bold: require('@expo-google-fonts/cormorant-garamond/700Bold/CormorantGaramond_700Bold.ttf'),
          CormorantGaramond_300Light_Italic: require('@expo-google-fonts/cormorant-garamond/300Light_Italic/CormorantGaramond_300Light_Italic.ttf'),
          CormorantGaramond_400Regular_Italic: require('@expo-google-fonts/cormorant-garamond/400Regular_Italic/CormorantGaramond_400Regular_Italic.ttf'),
          CormorantGaramond_500Medium_Italic: require('@expo-google-fonts/cormorant-garamond/500Medium_Italic/CormorantGaramond_500Medium_Italic.ttf'),
          CormorantGaramond_600SemiBold_Italic: require('@expo-google-fonts/cormorant-garamond/600SemiBold_Italic/CormorantGaramond_600SemiBold_Italic.ttf'),
        });
      } catch (e) {
        console.log('[Fonts] Failed to load custom fonts:', e);
      }
      setFontsLoaded(true);
    };
    void loadFonts();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
