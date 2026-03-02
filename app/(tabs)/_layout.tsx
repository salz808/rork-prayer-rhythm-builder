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
          borderTopWidth: 1,
          ...(Platform.OS === 'web' ? {} : {
            shadowColor: C.text,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 12,
          }),
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          letterSpacing: 0.2,
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
