// app/(tabs)/analytics.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useAuth } from '../../contexts/AuthContext';
import { salonOwnerService } from '../../services/salonOwnerService';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [hasSalon, setHasSalon] = useState(false);

  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    console.log('AnalyticsScreen: Loading analytics for user:', user?.email);
    console.log('AnalyticsScreen: User salonId:', user?.salonId);

    try {
      if (user?.salonId) {
        console.log('AnalyticsScreen: User has salonId, loading analytics...');
        setHasSalon(true);

        const statsResult = await salonOwnerService.getSalonStats(user.salonId);
        if (statsResult.success) {
          setStats(statsResult.data);
          console.log('AnalyticsScreen: Stats loaded:', statsResult.data);
        }

        const revenueResult = await salonOwnerService.getMonthlyRevenue(user.salonId, currentYear);
        if (revenueResult.success) {
          setMonthlyRevenue(revenueResult.data);
        }

        const reviewsResult = await salonOwnerService.getRecentReviews(user.salonId, 5);
        if (reviewsResult.success) {
          setRecentReviews(reviewsResult.data);
        }
      } else {
        console.log('AnalyticsScreen: User has no salonId');
        setHasSalon(false);
        setStats(null);
        setMonthlyRevenue([]);
        setRecentReviews([]);
      }
    } catch (error) {
      console.error('AnalyticsScreen: Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: '#2A2A2A',
    backgroundGradientFrom: '#2A2A2A',
    backgroundGradientTo: '#2A2A2A',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(212, 184, 150, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(245, 245, 245, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#D4B896',
    },
  };

  const appointmentStatusData = stats ? [
    {
      name: 'Confirmés',
      population: stats.confirmedAppointments || 0,
      color: '#10B981',
      legendFontColor: '#F5F5F5',
      legendFontSize: 12,
    },
    {
      name: 'En attente',
      population: stats.pendingAppointments || 0,
      color: '#F59E0B',
      legendFontColor: '#F5F5F5',
      legendFontSize: 12,
    },
    {
      name: 'Terminés',
      population: stats.completedAppointments || 0,
      color: '#3B82F6',
      legendFontColor: '#F5F5F5',
      legendFontSize: 12,
    },
    {
      name: 'Annulés',
      population: stats.cancelledAppointments || 0,
      color: '#EF4444',
      legendFontColor: '#F5F5F5',
      legendFontSize: 12,
    },
  ] : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-primary-dark items-center justify-center">
        <Text className="text-text-primary">Chargement des statistiques...</Text>
      </View>
    );
  }

  if (!hasSalon) {
    return (
      <View className="flex-1 bg-primary-dark">
        <ScrollView>
          <View className="px-6 pt-16 pb-6">
            <Text className="text-3xl font-bold text-text-primary mb-2">Statistiques</Text>
          </View>

          <View className="px-6">
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-6 items-center">
              <MaterialIcons name="analytics" size={64} color="#D4B896" />
              <Text className="text-text-primary text-xl font-semibold mt-4 mb-2 text-center">
                Statistiques non disponibles
              </Text>
              <Text className="text-text-primary/70 text-center mb-6">
                Vous devez d'abord créer votre salon pour accéder aux statistiques et analyser vos performances.
              </Text>
              
              <TouchableOpacity 
                className="bg-primary-beige rounded-xl px-6 py-3 mb-4"
                onPress={() => {
                  Alert.alert('Bientôt disponible', 'La création de salon sera disponible prochainement');
                }}
              >
                <Text className="text-primary-dark font-semibold">Créer ma fiche salon</Text>
              </TouchableOpacity>

              <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-4 mt-4 w-full">
                <Text className="text-primary-beige text-sm font-medium mb-2 text-center">
                  📊 Aperçu des statistiques disponibles
                </Text>
                <View className="space-y-2">
                  <Text className="text-text-primary/70 text-xs">• Chiffre d'affaires mensuel et annuel</Text>
                  <Text className="text-text-primary/70 text-xs">• Nombre de rendez-vous par statut</Text>
                  <Text className="text-text-primary/70 text-xs">• Évolution de la note moyenne</Text>
                  <Text className="text-text-primary/70 text-xs">• Avis clients récents</Text>
                  <Text className="text-text-primary/70 text-xs">• Conseils d'amélioration personnalisés</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-primary-dark">
      <View className="px-6 pt-16 pb-6">
        <Text className="text-3xl font-bold text-text-primary mb-2">Statistiques</Text>
        <Text className="text-text-primary/70">Analysez les performances de votre salon</Text>
      </View>

      <View className="px-6 mb-6">
        <View className="flex-row bg-primary-light/10 rounded-xl p-1">
          <TouchableOpacity
            onPress={() => setSelectedPeriod('month')}
            className={`flex-1 py-2 rounded-lg ${
              selectedPeriod === 'month' ? 'bg-primary-beige' : ''
            }`}
          >
            <Text className={`text-center font-medium ${
              selectedPeriod === 'month' ? 'text-primary-dark' : 'text-text-primary'
            }`}>
              Ce mois
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedPeriod('year')}
            className={`flex-1 py-2 rounded-lg ${
              selectedPeriod === 'year' ? 'bg-primary-beige' : ''
            }`}
          >
            <Text className={`text-center font-medium ${
              selectedPeriod === 'year' ? 'text-primary-dark' : 'text-text-primary'
            }`}>
              Cette année
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {stats && (
        <View className="px-6 mb-6">
          <Text className="text-xl font-semibold text-text-primary mb-4">Métriques clés</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]">
              <View className="flex-row items-center justify-between mb-2">
                <MaterialIcons name="trending-up" size={24} color="#10B981" />
                <Text className="text-green-500 text-xs">+12%</Text>
              </View>
              <Text className="text-2xl font-bold text-text-primary">{formatCurrency(stats.totalRevenue || 0)}</Text>
              <Text className="text-text-primary/70">Chiffre d'affaires total</Text>
            </View>
            
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]">
              <View className="flex-row items-center justify-between mb-2">
                <MaterialIcons name="event" size={24} color="#D4B896" />
                <Text className="text-blue-500 text-xs">+8%</Text>
              </View>
              <Text className="text-2xl font-bold text-text-primary">{stats.totalAppointments || 0}</Text>
              <Text className="text-text-primary/70">Total rendez-vous</Text>
            </View>
            
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]">
              <View className="flex-row items-center justify-between mb-2">
                <MaterialIcons name="star" size={24} color="#F59E0B" />
                <Text className="text-green-500 text-xs">+0.2</Text>
              </View>
              <Text className="text-2xl font-bold text-text-primary">{(stats.averageRating || 0).toFixed(1)}</Text>
              <Text className="text-text-primary/70">Note moyenne</Text>
            </View>
            
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 flex-1 min-w-[150px]">
              <View className="flex-row items-center justify-between mb-2">
                <MaterialIcons name="attach-money" size={24} color="#3B82F6" />
                <Text className="text-green-500 text-xs">+5%</Text>
              </View>
              <Text className="text-2xl font-bold text-text-primary">{formatCurrency(stats.thisMonthRevenue || 0)}</Text>
              <Text className="text-text-primary/70">Ce mois-ci</Text>
            </View>
          </View>
        </View>
      )}

      {monthlyRevenue.length > 0 && (
        <View className="px-6 mb-6">
          <Text className="text-xl font-semibold text-text-primary mb-4">Évolution du chiffre d'affaires</Text>
          <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
            <LineChart
              data={{
                labels: months.slice(0, new Date().getMonth() + 1),
                datasets: [
                  {
                    data: monthlyRevenue.slice(0, new Date().getMonth() + 1),
                  },
                ],
              }}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </View>
      )}

      {stats && appointmentStatusData.length > 0 && appointmentStatusData.some(item => item.population > 0) && (
        <View className="px-6 mb-6">
          <Text className="text-xl font-semibold text-text-primary mb-4">Répartition des rendez-vous</Text>
          <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
            <PieChart
              data={appointmentStatusData}
              width={screenWidth - 80}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 50]}
              absolute
            />
          </View>
        </View>
      )}

      <View className="px-6 mb-6">
        <Text className="text-xl font-semibold text-text-primary mb-4">Avis récents</Text>
        {recentReviews.length === 0 ? (
          <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-6 items-center">
            <MaterialIcons name="rate-review" size={48} color="#D4B896" />
            <Text className="text-text-primary mt-3 text-center">Aucun avis récent</Text>
            <Text className="text-text-primary/70 text-center mt-1">
              Les avis de vos clients apparaîtront ici
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {recentReviews.map((review, index) => (
              <View
                key={index}
                className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-text-primary font-semibold">{review.clientName}</Text>
                  <View className="flex-row">
                    {[...Array(5)].map((_, i) => (
                      <MaterialIcons
                        key={i}
                        name="star"
                        size={16}
                        color={i < review.rating ? '#F59E0B' : '#374151'}
                      />
                    ))}
                  </View>
                </View>
                <Text className="text-text-primary/70">{review.comment}</Text>
                <Text className="text-text-primary/50 text-xs mt-2">
                  {new Date(review.createdAt.seconds * 1000).toLocaleDateString('fr-FR')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* <View className="px-6 mb-8">
        <Text className="text-xl font-semibold text-text-primary mb-4">Conseils d'amélioration</Text>
        <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-4">
          <View className="flex-row items-start">
            <MaterialIcons name="lightbulb" size={24} color="#D4B896" />
            <View className="flex-1 ml-3">
              <Text className="text-text-primary font-semibold mb-2">Optimisez votre profil</Text>
              <Text className="text-text-primary/70 text-sm mb-3">
                {stats?.totalAppointments === 0 
                  ? "Créez vos premiers services et commencez à recevoir des réservations."
                  : "Ajoutez plus de photos et améliorez vos descriptions de services pour attirer plus de clients."
                }
              </Text>
              <TouchableOpacity className="bg-primary-beige rounded-lg px-3 py-2 self-start">
                <Text className="text-primary-dark font-medium text-sm">
                  {stats?.totalAppointments === 0 ? "Ajouter des services" : "Améliorer le profil"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View> */}

      {(!stats || stats.totalAppointments === 0) && (
        <View className="px-6 mb-8">
          <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-6 items-center">
            <MaterialIcons name="insights" size={48} color="#D4B896" />
            <Text className="text-text-primary mt-3 text-center font-semibold">
              Pas encore de données
            </Text>
            <Text className="text-text-primary/70 text-center mt-1">
              Les statistiques apparaîtront une fois que vous aurez des rendez-vous et des clients
            </Text>
          </View>
        </View>
      )}

      <View className="h-20" />
    </ScrollView>
  );
}