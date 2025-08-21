// app/(tabs)/dashboard.tsx - FIXED TO MATCH ACTUAL FLOW
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { salonOwnerService } from '../../services/salonOwnerService';
import { appointmentService } from '../../services/appointmentService';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [salon, setSalon] = useState<any>(null);
  
  const isSalonOwner = user?.role === 'salon_owner';
  const hasSalon = !!user?.salonId;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      if (isSalonOwner && hasSalon) {
        // Load salon info
        const userSalons = await salonOwnerService.getUserSalons(user.id);
        if (userSalons.length > 0) {
          setSalon(userSalons[0]);
          
          // Check if salon is verified/active
          if (userSalons[0].isActive && userSalons[0].isVerified !== false) {
            // Load salon stats only if verified
            const statsResult = await salonOwnerService.getSalonStats(userSalons[0].id);
            if (statsResult.success) {
              setStats(statsResult.data);
            }
            
            // Load recent appointments
            const appointments = await appointmentService.getSalonAppointments(userSalons[0].id);
            setRecentAppointments(appointments.slice(0, 5));
          }
        }
      } else if (!isSalonOwner) {
        // Regular client - load their appointments
        const appointments = await appointmentService.getClientAppointments(user.id);
        setRecentAppointments(appointments.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'confirmed': return 'text-green-500';
      case 'completed': return 'text-blue-500';
      case 'rejected': return 'text-red-500';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-text-primary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmé';
      case 'completed': return 'Terminé';
      case 'rejected': return 'Refusé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-service':
        router.push('/(tabs)/salon');
        break;
      case 'planning':
        router.push('/(tabs)/appointments');
        break;
      case 'view-analytics':
        router.push('/(tabs)/analytics');
        break;
      case 'search-salon':
        router.push('/(tabs)/search');
        break;
      case 'favorites':
        router.push('/(tabs)/favorites');
        break;
      default:
        console.log(`Action ${action} not implemented yet`);
    }
  };

  const handleCreateSalon = () => {
    router.push('/create-salon');
  };

  // Notification Icon Component
  const NotificationIcon = () => (
    <TouchableOpacity 
      onPress={() => router.push('/notifications')}
      className="relative p-2"
    >
      <MaterialIcons name="notifications" size={24} color="#D4B896" />
      <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
        <Text className="text-white text-xs font-bold">3</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-primary-dark items-center justify-center">
        <MaterialIcons name="hourglass-empty" size={48} color="#D4B896" />
        <Text className="text-text-primary mt-4 text-lg">Chargement...</Text>
      </View>
    );
  }

  // SALON OWNER WITHOUT SALON - Show create salon prompt
  if (isSalonOwner && !hasSalon) {
    return (
      <View className="flex-1 bg-primary-dark">
        <ScrollView 
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
                  Bienvenue dans votre espace professionnel
                </Text>
              </View>
              <NotificationIcon />
            </View>
          </View>

          {/* Create Salon Prompt */}
          <View className="px-6 mb-6">
            <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-6 items-center">
              <MaterialIcons name="store" size={64} color="#D4B896" />
              <Text className="text-text-primary text-xl font-semibold mt-4 mb-2 text-center">
                Créez votre salon
              </Text>
              <Text className="text-text-primary/70 text-center mb-6">
                Pour commencer à recevoir des clients et gérer vos rendez-vous, vous devez d'abord créer votre fiche salon.
              </Text>
              
              <TouchableOpacity 
                className="bg-primary-beige rounded-xl px-6 py-3 mb-4"
                onPress={handleCreateSalon}
              >
                <Text className="text-primary-dark font-semibold">Créer mon salon maintenant</Text>
              </TouchableOpacity>

              {/* Features Preview */}
              <View className="bg-primary-light/10 border border-primary-beige/20 rounded-xl p-4 mt-4 w-full">
                <Text className="text-primary-beige text-sm font-medium mb-3 text-center">
                  Ce que vous pourrez faire:
                </Text>
                <View className="space-y-2">
                  <Text className="text-text-primary/70 text-xs">• Recevoir des demandes de rendez-vous</Text>
                  <Text className="text-text-primary/70 text-xs">• Gérer vos services et tarifs</Text>
                  <Text className="text-text-primary/70 text-xs">• Suivre vos statistiques de vente</Text>
                  <Text className="text-text-primary/70 text-xs">• Communiquer avec vos clients</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Getting Started Steps */}
          <View className="px-6 mb-6">
            <Text className="text-xl font-semibold text-text-primary mb-4">Premiers pas</Text>
            <View className="space-y-3">
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-row items-center">
                <View className="bg-primary-beige rounded-full w-8 h-8 items-center justify-center mr-4">
                  <Text className="text-primary-dark font-bold">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-medium">Créer votre salon</Text>
                  <Text className="text-text-primary/70 text-sm">Informations, catégories, horaires</Text>
                </View>
              </View>
              
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-row items-center opacity-50">
                <View className="bg-primary-light/20 rounded-full w-8 h-8 items-center justify-center mr-4">
                  <Text className="text-text-primary/50 font-bold">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary/50 font-medium">Ajouter vos services</Text>
                  <Text className="text-text-primary/50 text-sm">Prix, durées, descriptions</Text>
                </View>
              </View>
              
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-row items-center opacity-50">
                <View className="bg-primary-light/20 rounded-full w-8 h-8 items-center justify-center mr-4">
                  <Text className="text-text-primary/50 font-bold">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary/50 font-medium">Recevoir des clients</Text>
                  <Text className="text-text-primary/50 text-sm">Accepter les demandes de RDV</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      </View>
    );
  }

  // SALON OWNER WITH SALON BUT PENDING VERIFICATION - Show verification message
  if (isSalonOwner && hasSalon && salon && (!salon.isActive || salon.isVerified === false)) {
    return (
      <View className="flex-1 bg-primary-dark">
        <ScrollView 
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
                  Votre salon est en cours de vérification
                </Text>
              </View>
              <NotificationIcon />
            </View>
          </View>

          {/* Verification Status */}
          <View className="px-6 mb-6">
            <View className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-6">
              <View className="flex-row items-center mb-4">
                <View className="bg-yellow-500/30 rounded-full p-3 mr-4">
                  <MaterialIcons name="pending" size={32} color="#F59E0B" />
                </View>
                <View className="flex-1">
                  <Text className="text-yellow-400 text-xl font-bold">
                    Vérification en cours
                  </Text>
                  <Text className="text-text-primary/70 text-sm mt-1">
                    {salon.name}
                  </Text>
                </View>
              </View>
              
              <Text className="text-text-primary/80 mb-4 leading-6">
                Votre salon a été soumis pour vérification. Notre équipe examine votre dossier et vous contactera sous 24-48h.
              </Text>

              <View className="bg-primary-dark/20 rounded-lg p-3 mb-4">
                <Text className="text-text-primary font-semibold mb-2">Salon soumis :</Text>
                <Text className="text-text-primary/70 text-sm">• {salon.name}</Text>
                <Text className="text-text-primary/70 text-sm">• {salon.address}</Text>
                <Text className="text-text-primary/70 text-sm">• Photo : {salon.imageUrl ? 'Oui' : 'Non'}</Text>
                <Text className="text-text-primary/70 text-sm">• Catégories : {salon.categories?.join(', ')}</Text>
              </View>
              
              <TouchableOpacity 
                className="bg-primary-beige/20 border border-primary-beige/30 rounded-xl py-3 px-6 flex-row items-center justify-center"
                onPress={() => router.push('/help')}
              >
                <MaterialIcons name="help-outline" size={18} color="#D4B896" />
                <Text className="text-primary-beige font-medium ml-2">
                  Questions sur la vérification
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* What happens next */}
          <View className="px-6 mb-6">
            <Text className="text-xl font-semibold text-text-primary mb-4">
              Prochaines étapes
            </Text>
            
            <View className="space-y-3">
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-row items-center">
                <View className="bg-blue-500/20 rounded-full p-3 mr-4">
                  <MaterialIcons name="search" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-semibold">Vérification des informations</Text>
                  <Text className="text-text-primary/70 text-sm">
                    Notre équipe vérifie vos informations
                  </Text>
                </View>
              </View>
              
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-row items-center">
                <View className="bg-green-500/20 rounded-full p-3 mr-4">
                  <MaterialIcons name="check-circle" size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-semibold">Activation du salon</Text>
                  <Text className="text-text-primary/70 text-sm">
                    Votre salon sera activé et visible aux clients
                  </Text>
                </View>
              </View>
              
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-row items-center">
                <View className="bg-purple-500/20 rounded-full p-3 mr-4">
                  <MaterialIcons name="notifications-active" size={24} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-text-primary font-semibold">Notification de confirmation</Text>
                  <Text className="text-text-primary/70 text-sm">
                    Vous recevrez une notification de confirmation
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // SALON OWNER WITH VERIFIED SALON - Show full dashboard
  if (isSalonOwner && hasSalon && salon && salon.isActive && salon.isVerified !== false) {
    return (
      <ScrollView 
        className="flex-1 bg-primary-dark"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#D4B896" />
        }
      >
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-text-primary mb-2">
                Bonjour, {user?.name}
              </Text>
              <Text className="text-text-primary/70">
                {salon?.name || 'Votre salon'} - Tableau de bord
              </Text>
            </View>
            <NotificationIcon />
          </View>
        </View>

        {/* Salon Info Banner */}
        {salon && (
          <View className="px-6 mb-6">
            <TouchableOpacity 
              className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-4 flex-row items-center"
              onPress={() => router.push('/(tabs)/salon')}
            >
              <View className="bg-primary-beige/20 rounded-full p-3 mr-4">
                <MaterialIcons name="store" size={24} color="#D4B896" />
              </View>
              <View className="flex-1">
                <Text className="text-primary-beige font-semibold text-lg">{salon.name}</Text>
                <Text className="text-text-primary/70 text-sm">
                  {salon.categories?.length || 0} catégories • {salon.address?.substring(0, 30)}...
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#D4B896" />
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Cards */}
        {stats && (
          <View className="px-6 mb-6">
            <Text className="text-xl font-semibold text-text-primary mb-4">Statistiques</Text>
            <View className="flex-row flex-wrap gap-3">
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]">
                <View className="flex-row items-center justify-between mb-2">
                  <MaterialIcons name="event" size={24} color="#D4B896" />
                  <Text className="text-green-500 text-xs">Total</Text>
                </View>
                <Text className="text-2xl font-bold text-text-primary">{stats.totalAppointments || 0}</Text>
                <Text className="text-text-primary/70">Rendez-vous</Text>
              </View>
              
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]">
                <View className="flex-row items-center justify-between mb-2">
                  <MaterialIcons name="pending" size={24} color="#F59E0B" />
                  <Text className="text-yellow-500 text-xs">En attente</Text>
                </View>
                <Text className="text-2xl font-bold text-text-primary">{stats.pendingAppointments || 0}</Text>
                <Text className="text-text-primary/70">À traiter</Text>
              </View>
              
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]">
                <View className="flex-row items-center justify-between mb-2">
                  <MaterialIcons name="attach-money" size={24} color="#10B981" />
                  <Text className="text-green-500 text-xs">Ce mois</Text>
                </View>
                <Text className="text-2xl font-bold text-text-primary">{stats.thisMonthRevenue || 0} DH</Text>
                <Text className="text-text-primary/70">Revenus</Text>
              </View>
              
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]">
                <View className="flex-row items-center justify-between mb-2">
                  <MaterialIcons name="star" size={24} color="#F59E0B" />
                  <Text className="text-blue-500 text-xs">Moyenne</Text>
                </View>
                <Text className="text-2xl font-bold text-text-primary">{stats.averageRating?.toFixed(1) || '0.0'}</Text>
                <Text className="text-text-primary/70">Note clients</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-semibold text-text-primary mb-4">Actions rapides</Text>
          <View className="flex-row flex-wrap gap-3">
            <TouchableOpacity 
              className="bg-primary-beige rounded-xl p-4 flex-1 min-w-[150px] items-center"
              onPress={() => handleQuickAction('add-service')}
            >
              <MaterialIcons name="build" size={28} color="#2A2A2A" />
              <Text className="text-primary-dark font-semibold mt-2">Gérer services</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px] items-center"
              onPress={() => handleQuickAction('planning')}
            >
              <MaterialIcons name="schedule" size={28} color="#D4B896" />
              <Text className="text-text-primary font-semibold mt-2">Planning RDV</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px] items-center"
              onPress={() => handleQuickAction('view-analytics')}
            >
              <MaterialIcons name="analytics" size={28} color="#D4B896" />
              <Text className="text-text-primary font-semibold mt-2">Statistiques</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Appointments */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-text-primary">Demandes récentes</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/appointments')}
              className="bg-primary-beige/20 px-3 py-1 rounded-lg"
            >
              <Text className="text-primary-beige text-sm font-medium">Voir tout</Text>
            </TouchableOpacity>
          </View>
          
          {recentAppointments.length === 0 ? (
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-6 items-center">
              <MaterialIcons name="event-busy" size={48} color="#D4B896" />
              <Text className="text-text-primary mt-3 text-center font-semibold">
                Aucune demande récente
              </Text>
              <Text className="text-text-primary/70 text-center mt-1 mb-4">
                Les nouvelles demandes apparaîtront ici
              </Text>
              <TouchableOpacity 
                className="bg-primary-beige rounded-lg px-4 py-2"
                onPress={() => handleQuickAction('add-service')}
              >
                <Text className="text-primary-dark font-semibold">Ajouter des services</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-3">
              {recentAppointments.map((appointment) => (
                <TouchableOpacity
                  key={appointment.id}
                  className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4"
                  onPress={() => router.push(`/appointment/${appointment.id}`)}
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-text-primary font-semibold">
                        {appointment.clientName}
                      </Text>
                      <Text className="text-text-primary/70">
                        {formatDate(appointment.appointmentDate)} à {appointment.timeSlot}
                      </Text>
                    </View>
                    <View className="bg-primary-beige/20 px-3 py-1 rounded-full">
                      <Text className={`text-sm font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-text-primary/70 text-sm mb-3">
                    {appointment.services?.length || 0} service(s) • {appointment.totalPrice || 0} DH
                  </Text>
                  
                  <View className="flex-row gap-2">
                    <View className="bg-primary-beige/10 px-3 py-1 rounded-lg">
                      <Text className="text-primary-beige text-xs">
                        {appointment.clientPhone}
                      </Text>
                    </View>
                    
                    {appointment.status === 'pending' && (
                      <View className="bg-yellow-500/20 px-3 py-1 rounded-lg">
                        <Text className="text-yellow-600 text-xs">À traiter</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View className="h-20" />
      </ScrollView>
    );
  }

  // REGULAR CLIENT - Show client dashboard
  return (
    <ScrollView 
      className="flex-1 bg-primary-dark"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#D4B896" />
      }
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-3xl font-bold text-text-primary mb-2">
          Bonjour, {user?.name}
        </Text>
        <Text className="text-text-primary/70">
          Vos rendez-vous et réservations
        </Text>
      </View>

      {/* Quick Actions for Clients */}
      <View className="px-6 mb-6">
        <Text className="text-xl font-semibold text-text-primary mb-4">Actions rapides</Text>
        <View className="flex-row flex-wrap gap-3">
          <TouchableOpacity 
            className="bg-primary-beige rounded-xl p-4 flex-1 min-w-[150px] items-center"
            onPress={() => handleQuickAction('search-salon')}
          >
            <MaterialIcons name="search" size={28} color="#2A2A2A" />
            <Text className="text-primary-dark font-semibold mt-2">Trouver salon</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px] items-center"
            onPress={() => handleQuickAction('favorites')}
          >
            <MaterialIcons name="bookmark" size={28} color="#D4B896" />
            <Text className="text-text-primary font-semibold mt-2">Favoris</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Appointments for Clients */}
      <View className="px-6 mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-semibold text-text-primary">Mes rendez-vous</Text>
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/appointments')}
            className="bg-primary-beige/20 px-3 py-1 rounded-lg"
          >
            <Text className="text-primary-beige text-sm font-medium">Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {recentAppointments.length === 0 ? (
          <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-6 items-center">
            <MaterialIcons name="event-busy" size={48} color="#D4B896" />
            <Text className="text-text-primary mt-3 text-center font-semibold">
              Aucun rendez-vous
            </Text>
            <Text className="text-text-primary/70 text-center mt-1 mb-4">
              Réservez votre premier rendez-vous
            </Text>
            <TouchableOpacity 
              className="bg-primary-beige rounded-lg px-4 py-2"
              onPress={() => handleQuickAction('search-salon')}
            >
              <Text className="text-primary-dark font-semibold">Chercher un salon</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-3">
            {recentAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4"
                onPress={() => router.push(`/appointment/${appointment.id}`)}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-text-primary font-semibold">
                      {appointment.salonName || 'Salon'}
                    </Text>
                    <Text className="text-text-primary/70">
                      {formatDate(appointment.appointmentDate)} à {appointment.timeSlot}
                    </Text>
                  </View>
                  <View className="bg-primary-beige/20 px-3 py-1 rounded-full">
                    <Text className={`text-sm font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </Text>
                  </View>
                </View>
                
                <Text className="text-text-primary/70 text-sm mb-3">
                  {appointment.services?.length || 0} service(s) • {appointment.totalPrice || 0} DH
                </Text>
                
                <View className="flex-row gap-2">
                  <View className="bg-primary-beige/10 px-3 py-1 rounded-lg">
                    <Text className="text-primary-beige text-xs">
                      {appointment.contactPhone}
                    </Text>
                  </View>
                  
                  {appointment.status === 'confirmed' && (
                    <View className="bg-green-500/20 px-3 py-1 rounded-lg">
                      <Text className="text-green-600 text-xs">Confirmé</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View className="h-20" />
    </ScrollView>
  );
}