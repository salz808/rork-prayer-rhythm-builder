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
          backgroundColor: 'rgba(18,10,3,0.95)',
          borderTopColor: 'rgba(200,137,74,0.13)',
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
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, size }) => <BookOpen size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="give"
        options={{
          title: 'Give',
          tabBarIcon: ({ color, size }) => <Heart size={size - 2} color={color} />,
        }}
      />
    </Tabs>
  );
}
