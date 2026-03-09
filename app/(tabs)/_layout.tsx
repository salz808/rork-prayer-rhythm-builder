import { Tabs } from 'expo-router';
import { Home, BookOpen, BarChart3, Heart } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C8894A',
        tabBarInactiveTintColor: 'rgba(244,237,224,0.28)',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'web' ? 12 : 18,
          left: 24,
          right: 24,
          backgroundColor: 'rgba(18,10,3,0.95)',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(200,137,74,0.13)',
          borderRadius: 22,
          ...(Platform.OS !== 'web' ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.5,
            shadowRadius: 32,
          } : {}),
          elevation: 16,
        },
        tabBarItemStyle: {
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '500' as const,
          letterSpacing: 1.2,
          textTransform: 'uppercase' as const,
          marginTop: 2,
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
          tabBarIcon: ({ color, size }) => <Home size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => <BookOpen size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size - 4} color={color} />,
        }}
      />
      <Tabs.Screen
        name="give"
        options={{
          title: 'Give',
          tabBarIcon: ({ color, size }) => <Heart size={size - 4} color={color} />,
        }}
      />
    </Tabs>
  );
}
