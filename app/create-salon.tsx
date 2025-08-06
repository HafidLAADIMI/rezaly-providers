// app/create-salon.tsx
import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { salonOwnerService } from '../services/salonOwnerService';

export default function CreateSalonScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [salonData, setSalonData] = useState({
    name: '',
    description: '',
    address: '',
    phone: user?.phone || '',
    email: user?.email || '',
    cityId: 'casablanca', // Default city
    categories: [] as string[],
    operatingHours: {
      monday: { open: '09:00', close: '18:00', isClosed: false },
      tuesday: { open: '09:00', close: '18:00', isClosed: false },
      wednesday: { open: '09:00', close: '18:00', isClosed: false },
      thursday: { open: '09:00', close: '18:00', isClosed: false },
      friday: { open: '09:00', close: '18:00', isClosed: false },
      saturday: { open: '09:00', close: '17:00', isClosed: false },
      sunday: { open: '10:00', close: '16:00', isClosed: true }
    },
    images: [] as string[]
  });

  const handleCreateSalon = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
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

    setIsLoading(true);

    try {
      // Generate mock coordinates for Morocco (Casablanca area)
      const mockCoordinates = {
        latitude: 33.5731 + (Math.random() - 0.5) * 0.2,
        longitude: -7.5898 + (Math.random() - 0.5) * 0.2
      };

      const result = await salonOwnerService.createSalon(user.id, {
        ...salonData,
        latitude: mockCoordinates.latitude,
        longitude: mockCoordinates.longitude
      });

      if (result.success) {
        Alert.alert(
          'Félicitations! 🎉', 
          'Votre salon a été créé avec succès! Vous pouvez maintenant ajouter vos services et recevoir des demandes de rendez-vous.',
          [{ 
            text: 'Commencer', 
            onPress: () => router.replace('/(tabs)/salon') 
          }]
        );
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de créer le salon');
      }
    } catch (error) {
      console.error('Error creating salon:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la création');
    } finally {
      setIsLoading(false);
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

  const availableCategories = [
    { id: 'coiffure', name: 'Coiffure', icon: '💇' },
    { id: 'beaute', name: 'Beauté', icon: '💄' },
    { id: 'bien-etre', name: 'Bien-être', icon: '🧘' },
    { id: 'ongles', name: 'Ongles', icon: '💅' },
    { id: 'massage', name: 'Massage', icon: '💆' },
    { id: 'epilation', name: 'Épilation', icon: '🪒' }
  ];

  const renderStep1 = () => (
    <View className="space-y-4">
      <Text className="text-2xl font-bold text-text-primary mb-4">Informations générales</Text>
      
      <View>
        <Text className="text-text-primary mb-2 font-medium">Nom du salon *</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="Ex: Salon Rézaly"
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
    </View>
  );

  const renderStep2 = () => (
    <View className="space-y-4">
      <Text className="text-2xl font-bold text-text-primary mb-4">Catégories de services</Text>
      
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
          <Text className="text-primary-beige font-medium mb-2">Services sélectionnés:</Text>
          <Text className="text-text-primary text-sm">
            {salonData.categories.map(catId => 
              availableCategories.find(cat => cat.id === catId)?.name
            ).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View className="space-y-4">
      <Text className="text-2xl font-bold text-text-primary mb-4">Horaires d'ouverture</Text>
      
      {Object.entries(salonData.operatingHours).map(([day, hours]) => (
        <View key={day} className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-text-primary font-medium capitalize">
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
              className={`px-3 py-1 rounded-lg ${
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
                <Text className="text-text-primary/70 text-sm mb-1">Ouverture</Text>
                <View className="bg-primary-dark/50 rounded-lg px-3 py-2">
                  <TextInput
                    className="text-text-primary text-center"
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
                <Text className="text-text-primary/70 text-sm mb-1">Fermeture</Text>
                <View className="bg-primary-dark/50 rounded-lg px-3 py-2">
                  <TextInput
                    className="text-text-primary text-center"
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

  return (
    <View className="flex-1 bg-primary-dark">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="pt-16 pb-6">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
            </TouchableOpacity>
            <Text className="text-3xl font-bold text-text-primary ml-4">Créer mon salon</Text>
          </View>
          
          <View className="flex-row items-center justify-between mt-4">
            {[1, 2, 3].map((step) => (
              <View key={step} className="flex-row items-center flex-1">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${
                  currentStep >= step ? 'bg-primary-beige' : 'bg-primary-light/20'
                }`}>
                  <Text className={`font-semibold ${
                    currentStep >= step ? 'text-primary-dark' : 'text-text-primary/50'
                  }`}>
                    {step}
                  </Text>
                </View>
                {step < 3 && (
                  <View className={`flex-1 h-1 mx-2 ${
                    currentStep > step ? 'bg-primary-beige' : 'bg-primary-light/20'
                  }`} />
                )}
              </View>
            ))}
          </View>
        </View>

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <View className="flex-row gap-4 mt-8 mb-8">
          {currentStep > 1 && (
            <TouchableOpacity
              onPress={() => setCurrentStep(currentStep - 1)}
              className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl py-4"
            >
              <Text className="text-text-primary text-center font-semibold">Précédent</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={() => {
              if (currentStep < 3) {
                setCurrentStep(currentStep + 1);
              } else {
                handleCreateSalon();
              }
            }}
            disabled={isLoading}
            className={`flex-1 bg-primary-beige rounded-xl py-4 ${isLoading ? 'opacity-50' : ''}`}
          >
            <Text className="text-primary-dark text-center font-semibold text-lg">
              {isLoading ? 'Création...' : currentStep === 3 ? 'Créer mon salon' : 'Suivant'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}