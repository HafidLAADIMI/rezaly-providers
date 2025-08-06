// components/LoadingScreen.tsx
import { View, Text, ActivityIndicator } from 'react-native';

export default function LoadingScreen() {
  return (
    <View className="flex-1 bg-primary-dark items-center justify-center">
      <Text className="text-4xl font-bold text-primary-beige mb-8">Rézaly</Text>
      <ActivityIndicator size="large" color="#D4B896" />
      <Text className="text-text-primary mt-4">Chargement...</Text>
    </View>
  );
}