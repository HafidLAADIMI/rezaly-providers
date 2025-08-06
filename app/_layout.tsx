// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import '../global.css';
export default function RootLayout() {
  useEffect(() => {
    console.log('🚀 App started - RootLayout mounted');
  }, []);

  return (
    <AuthProvider>
      {/* Status bar background view */}
      <View className="bg-primary-dark" style={{ flex: 0 }}>
        <StatusBar style="light" />
      </View>
      
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}