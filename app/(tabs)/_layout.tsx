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
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textMuted,
        tabBarStyle: {
          backgroundColor: 'rgba(18,10,3,0.95)',
          borderTopColor: C.border,
          borderTopWidth: 1,
          ...(Platform.OS === 'web' ? {} : {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
          }),
          elevation: 16,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '500' as const,
          letterSpacing: 1.2,
          textTransform: 'uppercase' as const,
        },
        tabBarIconStyle: {
          marginBottom: -2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
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
