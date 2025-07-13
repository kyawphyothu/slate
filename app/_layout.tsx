import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="todo-thihathu.db">
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: '#0d0d0d',
            },
            headerTintColor: '#f5f5f5',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="index" 
            options={{ 
              title: 'To Do List',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="all-tasks" 
            options={{ 
              title: 'All Tasks',
              presentation: 'modal'
            }} 
          />
          <Stack.Screen 
            name="future-tasks" 
            options={{ 
              title: 'Future Tasks',
              presentation: 'modal'
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" backgroundColor="#0d0d0d" />
      </ThemeProvider>
    </SQLiteProvider>
  );
}
