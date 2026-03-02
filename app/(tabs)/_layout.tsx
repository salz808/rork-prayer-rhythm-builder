import { Tabs } from 'expo-router';
import { Home, Map } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';
import { useColors } from '@/hooks/useColors';

export default function TabLayout() {
  const C = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.accentDark,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: {
          backgroundColor: C.surfaceElevated,
          borderTopColor: C.borderLight,
          borderTopWidth: 0.5,
          ...(Platform.OS === 'web' ? {} : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
          }),
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, size }) => <Map size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
