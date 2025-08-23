// app/account-verification.tsx
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export default function AccountVerificationScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    try {
      // Refresh user data to check if account has been verified
      if (user?.id) {
        const userData = await authService.getUserData(user.id);
        if (userData && userData.accountVerificationStatus === 'verified') {
          // Account is now verified, redirect to dashboard
          router.replace('/(tabs)/dashboard');
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    await authService.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-primary-dark">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor="#D4B896" 
          />
        }
      >
        <View className="flex-1 px-6 pt-20 pb-10">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="bg-yellow-500/20 rounded-full p-6 mb-6">
              <MaterialIcons name="pending-actions" size={64} color="#F59E0B" />
            </View>
            
            <Text className="text-3xl font-bold text-text-primary mb-2 text-center">
              Vérification en cours
            </Text>
            
            <Text className="text-text-primary/70 text-center text-lg">
              Bonjour {user?.name}
            </Text>
          </View>

          {/* Status Card */}
          <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mb-6">
            <View className="flex-row items-center mb-4">
              <MaterialIcons name="info" size={24} color="#F59E0B" />
              <Text className="text-yellow-400 text-lg font-semibold ml-3">
                Compte en attente de vérification
              </Text>
            </View>
            
            <Text className="text-text-primary/80 leading-6 mb-4">
              Votre compte professionnel est actuellement en cours de vérification par notre équipe. 
              Ce processus prend généralement entre 24 et 48 heures.
            </Text>
            
            <Text className="text-text-primary/70 text-sm">
              Nous vous notifierons dès que votre compte sera activé.
            </Text>
          </View>

          {/* What we're verifying */}
          <View className="mb-6">
            <Text className="text-xl font-semibold text-text-primary mb-4">
              Ce que nous vérifions
            </Text>
            
            <View className="space-y-3 gap-3">
              <View className="bg-primary-light/10 border border-primary-beige/20 rounded-xl p-4 flex-row items-start">
                <View className="bg-primary-beige/20 rounded-full p-2 mr-3 mt-1">
                  <MaterialIcons name="assignment-ind" size={20} color="#D4B896" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-medium mb-1">
                    Identité professionnelle
                  </Text>
                  <Text className="text-text-primary/60 text-sm">
                    Vérification de votre identité et de vos documents professionnels
                  </Text>
                </View>
              </View>
              
              <View className="bg-primary-light/10 border border-primary-beige/20 rounded-xl p-4 flex-row items-start">
                <View className="bg-primary-beige/20 rounded-full p-2 mr-3 mt-1">
                  <MaterialIcons name="business" size={20} color="#D4B896" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-medium mb-1">
                    Licence commerciale
                  </Text>
                  <Text className="text-text-primary/60 text-sm">
                    Validation de votre licence d'exploitation
                  </Text>
                </View>
              </View>
              
              <View className="bg-primary-light/10 border border-primary-beige/20 rounded-xl p-4 flex-row items-start">
                <View className="bg-primary-beige/20 rounded-full p-2 mr-3 mt-1">
                  <MaterialIcons name="security" size={20} color="#D4B896" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-medium mb-1">
                    Conformité
                  </Text>
                  <Text className="text-text-primary/60 text-sm">
                    Respect des normes et réglementations
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Refresh hint */}
          <View className="bg-primary-light/5 border border-primary-beige/10 rounded-xl p-4 mb-6">
            <View className="flex-row items-center">
              <MaterialIcons name="refresh" size={20} color="#D4B896" />
              <Text className="text-text-primary/70 text-sm ml-2 flex-1">
                Tirez vers le bas pour vérifier le statut de votre compte
              </Text>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity 
            className="py-4 px-6 flex-row items-center justify-center"
            onPress={handleSignOut}
          >
            <MaterialIcons name="logout" size={20} color="#EF4444" />
            <Text className="text-red-500 font-medium ml-2">
              Se déconnecter
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}