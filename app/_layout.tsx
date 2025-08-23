// app/_layout.tsx - Fixed navigation timing issue
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { notificationService } from '../services/notificationService';
import '../global.css';

function RootLayoutNav() {
  const { user, isLoading, isInitialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // Don't navigate until auth is initialized and we haven't navigated yet
    if (!isInitialized || hasNavigated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const inVerificationScreen = segments[0] === 'account-verification';

    console.log('Navigation check:', {
      user: user?.email,
      role: user?.role,
      accountVerified: user?.accountVerificationStatus,
      isVerified: user?.isVerified,
      hasSalon: !!user?.salonId,
      currentSegment: segments[0],
      isInitialized
    });

    // Use setTimeout to ensure navigation happens after layout is mounted
    const navigationTimer = setTimeout(() => {
      if (!user && !inAuthGroup) {
        // No user, redirect to auth
        console.log('Redirecting to login - no user');
        router.replace('/(auth)/login');
        setHasNavigated(true);
      } else if (user) {
        // User is logged in
        const isSalonOwner = user.role === 'salon_owner';
        const isAccountVerified = user.accountVerificationStatus === 'verified' || 
                                  user.accountVerificationStatus === 'approved' || 
                                  user.isVerified === true;

        if (isSalonOwner && !isAccountVerified && !inVerificationScreen) {
          // Salon owner but account not verified - show verification pending screen
          console.log('Redirecting to account verification');
          router.replace('/account-verification');
          setHasNavigated(true);
        } else if (isAccountVerified && (inAuthGroup || inVerificationScreen)) {
          // User is verified and in auth/verification screens - redirect to tabs
          console.log('Redirecting to dashboard - user verified');
          router.replace('/(tabs)/dashboard');
          setHasNavigated(true);
        }
      }
    }, 0);

    return () => clearTimeout(navigationTimer);
  }, [user, segments, isInitialized, hasNavigated]);

  // Reset navigation flag when user changes
  useEffect(() => {
    setHasNavigated(false);
  }, [user?.id]);

  useEffect(() => {
    console.log('🚀 App started - RootLayout mounted');
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      console.log('Initializing notification system...');
      
      const hasPermissions = await notificationService.requestPermissions();
      if (hasPermissions) {
        console.log('Notification permissions granted');
        await notificationService.getExpoPushToken();
      } else {
        console.log('Notification permissions denied');
      }

      const notificationListener = notificationService.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received while app is open:', notification);
          
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
                    router.push('/(tabs)/appointments');
                  }
                }
              ]
            );
          } else if (data?.type === 'account_verified') {
            Alert.alert(
              '✅ Compte vérifié', 
              'Votre compte a été vérifié ! Vous pouvez maintenant créer votre salon.',
              [
                { 
                  text: 'Créer mon salon', 
                  onPress: () => {
                    router.replace('/(tabs)/dashboard');
                    setHasNavigated(false); // Reset to allow navigation
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
          
          const { data } = response.notification.request.content;
          
          if (data?.type === 'new_appointment') {
            router.push('/(tabs)/appointments');
          } else if (data?.type === 'account_verified') {
            router.replace('/(tabs)/dashboard');
            setHasNavigated(false); // Reset to allow navigation
          } else if (data?.appointmentId) {
            router.push('/(tabs)/appointments');
          }
        }
      );

      console.log('Notification listeners set up successfully');

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
    <>
      <View className="bg-primary-dark" style={{ flex: 0 }}>
        <StatusBar style="light" />
      </View>
      
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="account-verification" options={{ headerShown: false }} />
        <Stack.Screen name="create-salon" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RootLayoutNav />
      </NotificationProvider>
    </AuthProvider>
  );
}