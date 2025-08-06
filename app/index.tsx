// app/index.tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/LoadingScreen';

export default function Index() {
  const { user, isLoading, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized) {
      console.log('Index: Waiting for auth to initialize...');
      return;
    }
    
    console.log('Index: Auth initialized, user:', user?.email || 'No user');
    
    // Small delay to ensure navigation works properly
    const navigateTimeout = setTimeout(() => {
      if (user) {
        console.log('Index: User found, navigating to dashboard');
        router.replace('/(tabs)/dashboard');
      } else {
        console.log('Index: No user, navigating to login');
        router.replace('/(auth)/login');
      }
    }, 100);

    return () => clearTimeout(navigateTimeout);
  }, [user, isInitialized, router]);

  // Show loading screen while auth initializes or during navigation
  if (!isInitialized || isLoading) {
    return <LoadingScreen message={!isInitialized ? "Initialisation..." : "Chargement..."} />;
  }

  // Fallback loading screen during navigation
  return <LoadingScreen message="Navigation..." />;
}
