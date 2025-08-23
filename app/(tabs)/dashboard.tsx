// app/(tabs)/dashboard.tsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { salonOwnerService } from '../../services/salonOwnerService';

export default function DashboardScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCheckedSalon, setHasCheckedSalon] = useState(false);
  
  const isSalonOwner = user?.role === 'salon_owner';
  
  // Check if user has salon by either having salonId OR by checking the database
  const hasSalon = !!user?.salonId || !!salon;

  useEffect(() => {
    if (isSalonOwner) {
      loadSalonData();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, isSalonOwner]);

  const loadSalonData = async () => {
    if (!user || !isSalonOwner) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading salon data for user:', user.id);
      
      // Always check database for user's salons
      const userSalons = await salonOwnerService.getUserSalons(user.id);
      console.log('Found salons:', userSalons.length);
      
      if (userSalons.length > 0) {
        const userSalon = userSalons[0];
        setSalon(userSalon);
        console.log('Salon found:', userSalon.name, 'Active:', userSalon.isActive);
        
        // If user doesn't have salonId in their profile but has a salon, refresh user data
        if (!user.salonId && userSalon.id) {
          console.log('Refreshing user data to update salonId');
          await refreshUser();
        }
      } else {
        setSalon(null);
        console.log('No salon found for user');
      }
      
      setHasCheckedSalon(true);
    } catch (error) {
      console.error('Error loading salon data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser(); // Refresh user data first
    await loadSalonData(); // Then load salon data
    setIsRefreshing(false);
  };

  const handleCreateSalon = () => {
    router.push('/create-salon');
  };

  // Loading state
  if (isLoading || !hasCheckedSalon) {
    return (
      <View className="flex-1 bg-primary-dark items-center justify-center">
        <MaterialIcons name="hourglass-empty" size={48} color="#D4B896" />
        <Text className="text-text-primary mt-4 text-lg">Chargement...</Text>
      </View>
    );
  }

  // SALON OWNER WITHOUT SALON - Show create salon screen
  if (isSalonOwner && !hasSalon) {
    return (
      <View className="flex-1 bg-primary-dark">
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#D4B896" />
          }
        >
          <View className="flex-1 px-6 pt-20 justify-center">
            {/* Welcome Header */}
            <Text className="text-3xl font-bold text-text-primary mb-2 text-center">
              Bienvenue, {user?.name}
            </Text>
            <Text className="text-text-primary/70 text-center mb-8">
              Votre compte est vérifié !
            </Text>

            {/* Create Salon Card */}
            <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-8 items-center">
              <View className="bg-primary-beige/20 rounded-full p-6 mb-6">
                <MaterialIcons name="store" size={64} color="#D4B896" />
              </View>
              
              <Text className="text-2xl font-bold text-text-primary mb-3 text-center">
                Créez votre salon
              </Text>
              
              <Text className="text-text-primary/70 text-center mb-8 leading-6">
                Pour commencer à recevoir des clients, créez votre fiche salon avec vos informations professionnelles.
              </Text>
              
              <TouchableOpacity 
                className="bg-primary-beige rounded-xl px-8 py-4 w-full"
                onPress={handleCreateSalon}
              >
                <Text className="text-primary-dark font-bold text-center text-lg">
                  Créer mon salon
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // SALON OWNER WITH PENDING SALON - Show waiting for verification
  if (isSalonOwner && hasSalon && salon && (!salon.isActive || salon.isVerified === false)) {
    return (
      <View className="flex-1 bg-primary-dark">
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#D4B896" />
          }
        >
          <View className="flex-1 px-6 pt-20 justify-center">
            {/* Header */}
            <Text className="text-3xl font-bold text-text-primary mb-2 text-center">
              Bonjour, {user?.name}
            </Text>
            <Text className="text-text-primary/70 text-center mb-8">
              Salon en cours de vérification
            </Text>

            {/* Verification Status Card */}
            <View className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-8">
              <View className="items-center mb-6">
                <View className="bg-yellow-500/20 rounded-full p-6">
                  <MaterialIcons name="pending" size={48} color="#F59E0B" />
                </View>
              </View>
              
              <Text className="text-2xl font-bold text-yellow-400 mb-3 text-center">
                Vérification en cours
              </Text>
              
              <Text className="text-lg text-text-primary mb-2 text-center font-semibold">
                {salon.name}
              </Text>
              
              <Text className="text-text-primary/70 text-center leading-6">
                Votre salon est en cours de vérification. Vous serez notifié dès qu'il sera activé (24-48h).
              </Text>
            </View>

            {/* Refresh Hint */}
            <View className="mt-8 items-center">
              <Text className="text-text-primary/50 text-sm">
                Tirez vers le bas pour actualiser
              </Text>
            </View>

          </View>
        </ScrollView>
      </View>
    );
  }

  // SALON OWNER WITH VERIFIED SALON - Show full dashboard
  if (isSalonOwner && hasSalon && salon?.isActive && salon?.isVerified !== false) {
    return (
      <ScrollView 
        className="flex-1 bg-primary-dark"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#D4B896" />
        }
      >
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-text-primary mb-2">
                Bonjour, {user?.name}
              </Text>
              <Text className="text-text-primary/70">
                {salon?.name}
              </Text>
            </View>
            <TouchableOpacity 
              className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-3"
              onPress={() => router.push('/notifications')}
            >
              <MaterialIcons name="notifications" size={24} color="#D4B896" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Salon Active Banner */}
        <View className="px-6 mb-6">
          <View className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex-row items-center">
            <View className="bg-green-500/20 rounded-full p-3 mr-4">
              <MaterialIcons name="check-circle" size={24} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-green-400 font-bold text-lg">Salon actif</Text>
              <Text className="text-text-primary/70 text-sm">
                Votre salon est visible aux clients
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-semibold text-text-primary mb-4">Vue d'ensemble</Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity 
              className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]"
              onPress={() => router.push('/(tabs)/appointments')}
            >
              <MaterialIcons name="event" size={32} color="#D4B896" />
              <Text className="text-lg font-bold text-text-primary mt-2">Rendez-vous</Text>
              <Text className="text-text-primary/70 text-sm">Gérer les demandes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]"
              onPress={() => router.push('/(tabs)/salon')}
            >
              <MaterialIcons name="store" size={32} color="#D4B896" />
              <Text className="text-lg font-bold text-text-primary mt-2">Mon Salon</Text>
              <Text className="text-text-primary/70 text-sm">Services & infos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6 ">
          <Text className="text-xl font-semibold text-text-primary mb-4">Actions rapides</Text>
          <View className="space-y-3 gap-4">
            <TouchableOpacity 
              className="bg-primary-beige rounded-xl p-4 flex-row items-center"
              onPress={() => router.push('/(tabs)/salon')}
            >
              <MaterialIcons name="add-circle" size={24} color="#2A2A2A" />
              <Text className="text-primary-dark font-semibold ml-3 flex-1">
                Ajouter un service
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#2A2A2A" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-row items-center"
              onPress={() => router.push('/(tabs)/analytics')}
            >
              <MaterialIcons name="analytics" size={24} color="#D4B896" />
              <Text className="text-text-primary font-semibold ml-3 flex-1">
                Voir les statistiques
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#D4B896" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
    );
  }

  // REGULAR CLIENT - Not a salon owner
  return (
    <View className="flex-1 bg-primary-dark items-center justify-center px-6">
      <MaterialIcons name="error-outline" size={64} color="#D4B896" />
      <Text className="text-text-primary text-xl font-bold mt-4 text-center">
        Espace réservé aux professionnels
      </Text>
      <Text className="text-text-primary/70 text-center mt-2">
        Cette section est destinée aux propriétaires de salon
      </Text>
    </View>
  );
}