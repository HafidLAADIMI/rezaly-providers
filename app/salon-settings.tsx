// app/salon-settings.tsx - SALON MODIFICATION SCREEN FOR PROVIDERS
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal,
  Platform,
  PermissionsAndroid,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { salonOwnerService } from '../services/salonOwnerService';
import { salonService } from '../services/salonService';
import * as Location from 'expo-location';

// Location interface
interface LocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
}

// Morocco cities
const MOROCCO_CITIES = [
  { id: 'casablanca', name: 'Casablanca', latitude: 33.5731, longitude: -7.5898 },
  { id: 'rabat', name: 'Rabat', latitude: 34.0209, longitude: -6.8416 },
  { id: 'marrakech', name: 'Marrakech', latitude: 31.6295, longitude: -7.9811 },
  { id: 'fes', name: 'Fès', latitude: 34.0181, longitude: -5.0078 },
  { id: 'tangier', name: 'Tanger', latitude: 35.7595, longitude: -5.8340 },
  { id: 'agadir', name: 'Agadir', latitude: 30.4278, longitude: -9.5981 }
];

const availableCategories = [
  { id: 'coiffure', name: 'Coiffure', icon: '💇' },
  { id: 'beaute', name: 'Beauté', icon: '💄' },
  { id: 'bien-etre', name: 'Bien-être', icon: '🧘' },
  { id: 'ongles', name: 'Ongles', icon: '💅' },
  { id: 'massage', name: 'Massage', icon: '💆' },
  { id: 'epilation', name: 'Épilation', icon: '🪒' }
];

export default function SalonSettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [salon, setSalon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('info'); // 'info', 'location', 'hours', 'categories'
  
  // Location states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(null);

  // Form state
  const [salonData, setSalonData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    cityId: 'casablanca',
    categories: [] as string[],
    operatingHours: {
      monday: { open: '09:00', close: '18:00', isClosed: false },
      tuesday: { open: '09:00', close: '18:00', isClosed: false },
      wednesday: { open: '09:00', close: '18:00', isClosed: false },
      thursday: { open: '09:00', close: '18:00', isClosed: false },
      friday: { open: '09:00', close: '18:00', isClosed: false },
      saturday: { open: '09:00', close: '17:00', isClosed: false },
      sunday: { open: '10:00', close: '16:00', isClosed: true }
    }
  });

  // Load current salon data
  useEffect(() => {
    loadSalonData();
  }, []);

  const loadSalonData = async () => {
    if (!user?.salonId) {
      Alert.alert('Erreur', 'Aucun salon trouvé');
      router.back();
      return;
    }

    try {
      setIsLoading(true);
      const salonInfo = await salonService.getSalonById(user.salonId);
      
      if (salonInfo) {
        setSalon(salonInfo);
        setSalonData({
          name: salonInfo.name || '',
          description: salonInfo.description || '',
          address: salonInfo.address || '',
          phone: salonInfo.phone || '',
          email: salonInfo.email || '',
          cityId: salonInfo.cityId || 'casablanca',
          categories: salonInfo.categories || [],
          operatingHours: salonInfo.operatingHours || salonData.operatingHours
        });
        
        // Set current location
        if (salonInfo.latitude && salonInfo.longitude) {
          setSelectedLocation({
            latitude: salonInfo.latitude,
            longitude: salonInfo.longitude,
            address: salonInfo.address
          });
        }
        
        console.log('Salon data loaded:', salonInfo.name);
      } else {
        Alert.alert('Erreur', 'Salon introuvable');
        router.back();
      }
    } catch (error) {
      console.error('Error loading salon:', error);
      Alert.alert('Erreur', 'Impossible de charger les données du salon');
    } finally {
      setIsLoading(false);
    }
  };

  // Location functions
  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
      }
    } catch (error) {
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission requise', 'La permission de localisation est nécessaire.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000,
      });

      const { latitude, longitude } = location.coords;

      try {
        const [addressResult] = await Location.reverseGeocodeAsync({ latitude, longitude });
        const address = `${addressResult.street || ''} ${addressResult.streetNumber || ''}, ${addressResult.city || ''}, ${addressResult.region || ''}`.trim();
        
        setSelectedLocation({ 
          latitude, 
          longitude, 
          address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
        });
        setSalonData(prev => ({ ...prev, address: address || prev.address }));
        
      } catch {
        setSelectedLocation({ 
          latitude, 
          longitude, 
          address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` 
        });
      }

      Alert.alert('Succès', 'Localisation mise à jour!');
      setShowLocationModal(false);

    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position.');
    } finally {
      setLocationLoading(false);
    }
  };

  const selectCityLocation = (city: typeof MOROCCO_CITIES[0]) => {
    setSelectedLocation({
      latitude: city.latitude + (Math.random() - 0.5) * 0.01,
      longitude: city.longitude + (Math.random() - 0.5) * 0.01,
      address: `${city.name}, Maroc`
    });
    
    setSalonData(prev => ({
      ...prev,
      cityId: city.id,
      address: prev.address || `${city.name}, Maroc`
    }));
    
    setShowLocationModal(false);
    Alert.alert('Succès', `Localisation mise à jour: ${city.name}`);
  };

  // Save changes
  const handleSave = async () => {
    if (!user?.salonId) {
      Alert.alert('Erreur', 'Aucun salon trouvé');
      return;
    }

    if (!salonData.name.trim() || !salonData.description.trim() || !salonData.address.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (salonData.categories.length === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins une catégorie');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Erreur', 'Veuillez définir la localisation de votre salon');
      return;
    }

    setIsSaving(true);

    try {
      const updateData = {
        ...salonData,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude
      };

      const result = await salonOwnerService.updateSalon(user.salonId, updateData);

      if (result.success) {
        Alert.alert(
          'Succès! ✅',
          'Les informations de votre salon ont été mises à jour.',
          [{ 
            text: 'OK', 
            onPress: () => router.back()
          }]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de mettre à jour le salon');
      }
    } catch (error) {
      console.error('Error updating salon:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSalonData = (field: string, value: any) => {
    setSalonData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    setSalonData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  // Section renderers
  const renderInfoSection = () => (
    <View className="space-y-4">
      <Text className="text-xl font-bold text-text-primary mb-4">Informations générales</Text>
      
      <View>
        <Text className="text-text-primary mb-2 font-medium">Nom du salon *</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="Nom de votre salon"
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            value={salonData.name}
            onChangeText={(value) => updateSalonData('name', value)}
          />
        </View>
      </View>

      <View>
        <Text className="text-text-primary mb-2 font-medium">Description *</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="Décrivez votre salon..."
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            value={salonData.description}
            onChangeText={(value) => updateSalonData('description', value)}
            multiline
            numberOfLines={4}
            style={{ minHeight: 100 }}
          />
        </View>
      </View>

      <View>
        <Text className="text-text-primary mb-2 font-medium">Téléphone</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="+212 5XX XXX XXX"
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            value={salonData.phone}
            onChangeText={(value) => updateSalonData('phone', value)}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View>
        <Text className="text-text-primary mb-2 font-medium">Email</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="email@salon.com"
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            value={salonData.email}
            onChangeText={(value) => updateSalonData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );

  const renderLocationSection = () => (
    <View className="space-y-4">
      <Text className="text-xl font-bold text-text-primary mb-4">Localisation</Text>
      
      <View>
        <Text className="text-text-primary mb-2 font-medium">Adresse complète *</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="123 Rue Mohammed V, Casablanca"
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            value={salonData.address}
            onChangeText={(value) => updateSalonData('address', value)}
            multiline
            numberOfLines={2}
          />
        </View>
        
        <TouchableOpacity
          onPress={() => setShowLocationModal(true)}
          className="mt-2 bg-primary-beige/20 border border-primary-beige/30 rounded-lg p-3 flex-row items-center justify-center"
        >
          <MaterialIcons name="location-on" size={20} color="#D4B896" />
          <Text className="text-primary-beige font-medium ml-2">
            Modifier la localisation GPS
          </Text>
        </TouchableOpacity>
        
        {selectedLocation && (
          <View className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Text className="text-green-400 text-sm font-medium mb-1">✓ Localisation GPS définie</Text>
            <Text className="text-text-primary/70 text-xs">
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderCategoriesSection = () => (
    <View className="space-y-4">
      <Text className="text-xl font-bold text-text-primary mb-4">Catégories de services</Text>
      
      <Text className="text-text-primary/70 mb-4">
        Sélectionnez les types de services que vous proposez:
      </Text>

      <View className="flex-row flex-wrap gap-3">
        {availableCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => toggleCategory(category.id)}
            className={`px-4 py-3 rounded-xl flex-row items-center ${
              salonData.categories.includes(category.id)
                ? 'bg-primary-beige'
                : 'bg-primary-light/10 border border-primary-beige/30'
            }`}
          >
            <Text className="text-lg mr-2">{category.icon}</Text>
            <Text className={`font-medium ${
              salonData.categories.includes(category.id)
                ? 'text-primary-dark'
                : 'text-text-primary'
            }`}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {salonData.categories.length > 0 && (
        <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-4">
          <Text className="text-primary-beige font-medium mb-2">
            Services sélectionnés ({salonData.categories.length}):
          </Text>
          <Text className="text-text-primary text-sm">
            {salonData.categories.map(catId => 
              availableCategories.find(cat => cat.id === catId)?.name
            ).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderHoursSection = () => (
    <View className="space-y-4">
      <Text className="text-xl font-bold text-text-primary mb-4">Horaires d'ouverture</Text>
      
      {Object.entries(salonData.operatingHours).map(([day, hours]) => (
        <View key={day} className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-text-primary font-medium text-lg">
              {day === 'monday' ? 'Lundi' :
               day === 'tuesday' ? 'Mardi' :
               day === 'wednesday' ? 'Mercredi' :
               day === 'thursday' ? 'Jeudi' :
               day === 'friday' ? 'Vendredi' :
               day === 'saturday' ? 'Samedi' : 'Dimanche'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                updateSalonData('operatingHours', {
                  ...salonData.operatingHours,
                  [day]: { ...hours, isClosed: !hours.isClosed }
                });
              }}
              className={`px-4 py-2 rounded-lg ${
                hours.isClosed ? 'bg-red-500/20' : 'bg-green-500/20'
              }`}
            >
              <Text className={`text-sm font-medium ${
                hours.isClosed ? 'text-red-500' : 'text-green-500'
              }`}>
                {hours.isClosed ? 'Fermé' : 'Ouvert'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {!hours.isClosed && (
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-text-primary/70 text-sm mb-2">Ouverture</Text>
                <View className="bg-primary-dark/50 rounded-lg px-3 py-3">
                  <TextInput
                    className="text-text-primary text-center font-medium"
                    value={hours.open}
                    onChangeText={(value) => {
                      updateSalonData('operatingHours', {
                        ...salonData.operatingHours,
                        [day]: { ...hours, open: value }
                      });
                    }}
                    placeholder="09:00"
                    placeholderTextColor="rgba(245, 245, 245, 0.6)"
                  />
                </View>
              </View>
              
              <View className="flex-1">
                <Text className="text-text-primary/70 text-sm mb-2">Fermeture</Text>
                <View className="bg-primary-dark/50 rounded-lg px-3 py-3">
                  <TextInput
                    className="text-text-primary text-center font-medium"
                    value={hours.close}
                    onChangeText={(value) => {
                      updateSalonData('operatingHours', {
                        ...salonData.operatingHours,
                        [day]: { ...hours, close: value }
                      });
                    }}
                    placeholder="18:00"
                    placeholderTextColor="rgba(245, 245, 245, 0.6)"
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-primary-dark items-center justify-center">
        <ActivityIndicator size="large" color="#D4B896" />
        <Text className="text-text-primary mt-4">Chargement...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary-dark">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-text-primary ml-4">Paramètres du salon</Text>
          </View>
        </View>

        {salon && (
          <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
            <Text className="text-text-primary font-semibold text-lg">{salon.name}</Text>
            <Text className="text-text-primary/70 text-sm">{salon.address}</Text>
          </View>
        )}
      </View>

      {/* Section Tabs */}
      <View className="px-6 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { key: 'info', label: 'Infos', icon: 'info' },
              { key: 'location', label: 'Localisation', icon: 'location-on' },
              { key: 'categories', label: 'Services', icon: 'category' },
              { key: 'hours', label: 'Horaires', icon: 'schedule' }
            ].map((section) => (
              <TouchableOpacity
                key={section.key}
                onPress={() => setActiveSection(section.key)}
                className={`px-4 py-2 rounded-lg flex-row items-center ${
                  activeSection === section.key
                    ? 'bg-primary-beige'
                    : 'bg-primary-light/10 border border-primary-beige/30'
                }`}
              >
                <MaterialIcons 
                  name={section.icon as any} 
                  size={16} 
                  color={activeSection === section.key ? "#2A2A2A" : "#D4B896"} 
                />
                <Text className={`ml-2 font-medium ${
                  activeSection === section.key
                    ? 'text-primary-dark'
                    : 'text-text-primary'
                }`}>
                  {section.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {activeSection === 'info' && renderInfoSection()}
        {activeSection === 'location' && renderLocationSection()}
        {activeSection === 'categories' && renderCategoriesSection()}
        {activeSection === 'hours' && renderHoursSection()}
        
        <View className="h-32" />
      </ScrollView>

      {/* Save Button */}
      <View className="p-6 bg-primary-dark border-t border-primary-beige/20">
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          className={`bg-primary-beige rounded-xl py-4 ${isSaving ? 'opacity-50' : ''}`}
        >
          {isSaving ? (
            <ActivityIndicator color="#2A2A2A" />
          ) : (
            <Text className="text-primary-dark text-center font-semibold text-lg">
              Sauvegarder les modifications
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Location Modal */}
      <Modal visible={showLocationModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-primary-dark">
          <View className="px-6 pt-16 pb-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-text-primary">Modifier la localisation</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <MaterialIcons name="close" size={24} color="#D4B896" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Current Location */}
              <TouchableOpacity
                onPress={getCurrentLocation}
                disabled={locationLoading}
                className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 mb-4"
              >
                <View className="flex-row items-center">
                  <MaterialIcons name="my-location" size={24} color="#D4B896" />
                  <View className="flex-1 ml-3">
                    <Text className="text-text-primary font-semibold">Position actuelle</Text>
                    <Text className="text-text-primary/70 text-sm">
                      {locationLoading ? 'Localisation en cours...' : 'Utiliser ma position GPS actuelle'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Cities */}
              <Text className="text-text-primary font-medium mb-3">Sélectionner une ville</Text>
              {MOROCCO_CITIES.map((city) => (
                <TouchableOpacity
                  key={city.id}
                  onPress={() => selectCityLocation(city)}
                  className="bg-primary-light/10 border border-primary-beige/30 rounded-lg p-3 mb-2 flex-row items-center"
                >
                  <MaterialIcons name="location-city" size={20} color="#D4B896" />
                  <Text className="text-text-primary ml-3">{city.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}