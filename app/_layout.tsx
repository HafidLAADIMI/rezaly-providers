// app/_layout.tsx - Updated Provider Version
import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { notificationService } from '../services/notificationService';
import '../global.css';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 App started - RootLayout mounted');
    
    // Initialize notifications when app starts
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      console.log('Initializing notification system...');
      
      // Request permissions and get token
      const hasPermissions = await notificationService.requestPermissions();
      if (hasPermissions) {
        console.log('Notification permissions granted');
        await notificationService.getExpoPushToken();
      } else {
        console.log('Notification permissions denied');
      }

      // Set up notification listeners
      const notificationListener = notificationService.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received while app is open:', notification);
          
          // Handle notification received while app is in foreground
          const { title, body, data } = notification.request.content;
          
          if (data?.type === 'new_appointment') {
            Alert.alert(
              title || '🗓️ Nouvelle demande', 
              body || 'Vous avez une nouvelle demande de rendez-vous',
              [
                { text: 'Ignorer', style: 'cancel' },
                { 
                  text: 'Voir les rendez-vous', 
                  onPress: () => {
                    // Navigate to appointments tab
                    router.push('/(tabs)/appointments');
                  }
                }
              ]
            );
          }
        }
      );

      const responseListener = notificationService.addNotificationResponseReceivedListener(
        (response) => {
          console.log('Notification tapped:', response);
          
          // Handle notification tap when app is closed/background
          const { data } = response.notification.request.content;
          
          if (data?.type === 'new_appointment') {
            // Navigate to appointments when notification is tapped
            router.push('/(tabs)/appointments');
          } else if (data?.appointmentId) {
            // Navigate to specific appointment if needed
            router.push('/(tabs)/appointments');
          }
        }
      );

      console.log('Notification listeners set up successfully');

      // Cleanup listeners on unmount
      return () => {
        console.log('Cleaning up notification listeners');
        notificationService.removeNotificationListener(notificationListener);
        notificationService.removeNotificationListener(responseListener);
      };
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  return (
    <AuthProvider>
      <NotificationProvider>
        {/* Status bar background view */}
        <View className="bg-primary-dark" style={{ flex: 0 }}>
          <StatusBar style="light" />
        </View>
        
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </NotificationProvider>
    </AuthProvider>
  );
}