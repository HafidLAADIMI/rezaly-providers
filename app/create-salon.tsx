// app/create-salon.tsx - SIMPLIFIED WITH SINGLE COVER IMAGE
import { useState, useRef, useEffect } from 'react';
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
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { salonOwnerService } from '../services/salonOwnerService';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

const { height: screenHeight } = Dimensions.get('window');

interface LocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
}

const MOROCCO_CITIES = [
  { id: 'casablanca', name: 'Casablanca', latitude: 33.5731, longitude: -7.5898 },
  { id: 'rabat', name: 'Rabat', latitude: 34.0209, longitude: -6.8416 },
  { id: 'marrakech', name: 'Marrakech', latitude: 31.6295, longitude: -7.9811 },
  { id: 'fes', name: 'Fès', latitude: 34.0181, longitude: -5.0078 },
  { id: 'tangier', name: 'Tanger', latitude: 35.7595, longitude: -5.8340 },
  { id: 'agadir', name: 'Agadir', latitude: 30.4278, longitude: -9.5981 }
];

export default function CreateSalonScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(null);

  const [salonData, setSalonData] = useState({
    name: '',
    description: '',
    address: '',
    phone: user?.phone || '',
    email: user?.email || '',
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
    },
    coverImage: '' as string // CHANGED: Single cover image instead of array
  });

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  // Request camera/media permissions
  const requestMediaPermissions = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraStatus === 'granted' && mediaStatus === 'granted';
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  // SIMPLIFIED: Single image picker function
  const pickCoverImage = async () => {
    try {
      const hasPermissions = await requestMediaPermissions();
      if (!hasPermissions) {
        Alert.alert('Permissions requises', 'L\'accès à la galerie et à la caméra est nécessaire pour ajouter une photo.');
        return;
      }

      Alert.alert(
        'Photo de couverture',
        'Choisissez une belle photo qui représente votre salon',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Galerie', onPress: () => openImagePicker('library') },
          { text: 'Caméra', onPress: () => openImagePicker('camera') }
        ]
      );
    } catch (error) {
      console.error('Error in pickCoverImage:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder aux images');
    }
  };

  const openImagePicker = async (source: 'library' | 'camera') => {
    try {
      setImageUploading(true);
      
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9], // Good aspect ratio for salon cover
        quality: 0.8,
        allowsMultipleSelection: false
      };

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // SIMPLIFIED: Set single cover image
        setSalonData(prev => ({
          ...prev,
          coverImage: imageUri
        }));
        
        Alert.alert('Succès', 'Photo de couverture ajoutée!');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    } finally {
      setImageUploading(false);
    }
  };

  // SIMPLIFIED: Remove cover image function
  const removeCoverImage = () => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette photo de couverture?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => {
            setSalonData(prev => ({
              ...prev,
              coverImage: ''
            }));
          }
        }
      ]
    );
  };

  const scrollToInput = (yOffset: number) => {
    if (scrollViewRef.current && keyboardVisible) {
      const scrollOffset = Math.max(0, yOffset - (screenHeight - keyboardHeight - 200));
      scrollViewRef.current.scrollTo({
        y: scrollOffset,
        animated: true
      });
    }
  };

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
        
        setSelectedLocation({ latitude, longitude, address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
        setSalonData(prev => ({ ...prev, address: address || prev.address }));
        
      } catch {
        setSelectedLocation({ latitude, longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
      }

      Alert.alert('Succès', 'Localisation détectée!');
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
    Alert.alert('Succès', `Localisation définie sur ${city.name}`);
  };

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

    if (!selectedLocation) {
      Alert.alert('Erreur', 'Veuillez définir la localisation de votre salon');
      return;
    }

    // SIMPLIFIED: Check for cover image (optional but recommended)
    if (!salonData.coverImage) {
      Alert.alert(
        'Photo de couverture',
        'Ajouter une photo de couverture aidera à attirer plus de clients. Voulez-vous continuer sans photo?',
        [
          { text: 'Ajouter une photo', onPress: () => pickCoverImage() },
          { text: 'Continuer sans photo', onPress: () => proceedWithCreation() }
        ]
      );
      return;
    }

    await proceedWithCreation();
  };

  const proceedWithCreation = async () => {
    setIsLoading(true);

    try {
      const result = await salonOwnerService.createSalon(user.id, {
        ...salonData,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        imageUrl: salonData.coverImage // SIMPLIFIED: Send cover image as main image
      });

      if (result.success) {
        Alert.alert(
          'Félicitations! 🎉', 
          'Votre salon a été créé avec succès!',
          [{ 
            text: 'Accéder au tableau de bord', 
            onPress: () => {
              router.dismiss();
              router.replace('/(tabs)/dashboard');
            }
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
    <View style={{ paddingBottom: 20 }}>
      <Text className="text-2xl font-bold text-text-primary mb-4">Informations générales</Text>
      
      {/* SIMPLIFIED: Single Cover Image Section */}
      <View style={{ marginBottom: 16 }}>
        <Text className="text-text-primary mb-2 font-medium">Photo de couverture</Text>
        <Text className="text-text-primary/70 text-sm mb-3">
          Ajoutez une belle photo qui représente votre salon
        </Text>
        
        {salonData.coverImage ? (
          // Show selected cover image
          <View className="relative">
            <Image 
              source={{ uri: salonData.coverImage }}
              style={{ width: '100%', height: 200 }}
              className="rounded-xl"
            />
            <TouchableOpacity
              onPress={removeCoverImage}
              className="absolute top-3 right-3 bg-red-500 rounded-full w-8 h-8 items-center justify-center"
            >
              <MaterialIcons name="close" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickCoverImage}
              className="absolute bottom-3 right-3 bg-black/50 rounded-full w-10 h-10 items-center justify-center"
            >
              <MaterialIcons name="edit" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          // Show upload button when no image
          <TouchableOpacity
            onPress={pickCoverImage}
            disabled={imageUploading}
            className="bg-primary-beige/20 border-2 border-dashed border-primary-beige/50 rounded-xl p-8 items-center justify-center"
            style={{ height: 200 }}
          >
            {imageUploading ? (
              <View className="items-center">
                <MaterialIcons name="cloud-upload" size={40} color="#D4B896" />
                <Text className="text-primary-beige font-medium mt-3">Téléchargement...</Text>
              </View>
            ) : (
              <View className="items-center">
                <MaterialIcons name="add-a-photo" size={40} color="#D4B896" />
                <Text className="text-primary-beige font-medium mt-3 text-lg">Ajouter une photo</Text>
                <Text className="text-primary-beige/70 text-sm mt-1">Recommandé pour attirer les clients</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Rest of the form remains the same */}
      {/* Salon Name */}
      <View style={{ marginBottom: 16 }}>
        <Text className="text-text-primary mb-2 font-medium">Nom du salon *</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="Ex: Salon Rézaly"
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            value={salonData.name}
            onChangeText={(value) => updateSalonData('name', value)}
            onFocus={(e) => {
              setTimeout(() => {
                (e.target as any)?.measure?.((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                  scrollToInput(pageY);
                });
              }, 100);
            }}
            returnKeyType="next"
            style={{ fontSize: 16 }}
          />
        </View>
      </View>

      {/* Description */}
      <View style={{ marginBottom: 16 }}>
        <Text className="text-text-primary mb-2 font-medium">Description *</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="Décrivez votre salon, vos spécialités, votre ambiance..."
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            value={salonData.description}
            onChangeText={(value) => updateSalonData('description', value)}
            onFocus={(e) => {
              setTimeout(() => {
                (e.target as any)?.measure?.((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                  scrollToInput(pageY);
                });
              }, 100);
            }}
            multiline
            numberOfLines={4}
            style={{ 
              minHeight: 100, 
              textAlignVertical: 'top',
              fontSize: 16
            }}
            returnKeyType="next"
          />
        </View>
      </View>

      {/* Address */}
      <View style={{ marginBottom: 16 }}>
        <Text className="text-text-primary mb-2 font-medium">Adresse complète *</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="123 Rue Mohammed V, Casablanca"
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            value={salonData.address}
            onChangeText={(value) => updateSalonData('address', value)}
            onFocus={(e) => {
              setTimeout(() => {
                (e.target as any)?.measure?.((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                  scrollToInput(pageY);
                });
              }, 100);
            }}
            multiline
            numberOfLines={2}
            style={{ 
              textAlignVertical: 'top',
              fontSize: 16
            }}
            returnKeyType="next"
          />
        </View>
        
        <TouchableOpacity
          onPress={() => setShowLocationModal(true)}
          className="mt-2 bg-primary-beige/20 border border-primary-beige/30 rounded-lg p-3 flex-row items-center justify-center"
        >
          <MaterialIcons name="location-on" size={20} color="#D4B896" />
          <Text className="text-primary-beige font-medium ml-2">
            {selectedLocation ? 'Modifier la localisation' : 'Définir la localisation'}
          </Text>
        </TouchableOpacity>
        
        {selectedLocation && (
          <View className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Text className="text-green-400 text-sm font-medium mb-1">✓ Localisation définie</Text>
            <Text className="text-text-primary/70 text-xs">{selectedLocation.address}</Text>
          </View>
        )}
      </View>

      {/* Phone */}
      <View style={{ marginBottom: 16 }}>
        <Text className="text-text-primary mb-2 font-medium">Téléphone</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
          <TextInput
            className="text-text-primary"
            placeholder="+212 5XX XXX XXX"
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            value={salonData.phone}
            onChangeText={(value) => updateSalonData('phone', value)}
            onFocus={(e) => {
              setTimeout(() => {
                (e.target as any)?.measure?.((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                  scrollToInput(pageY);
                });
              }, 100);
            }}
            keyboardType="phone-pad"
            returnKeyType="done"
            style={{ fontSize: 16 }}
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={{ paddingBottom: 20 }}>
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
        <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-4 mt-4">
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
    <View style={{ paddingBottom: 20 }}>
      <Text className="text-2xl font-bold text-text-primary mb-4">Horaires d'ouverture</Text>
      
      {Object.entries(salonData.operatingHours).map(([day, hours], index) => (
        <View key={day} className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4" style={{ marginBottom: 12 }}>
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
                    onFocus={(e) => {
                      setTimeout(() => {
                        (e.target as any)?.measure?.((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                          scrollToInput(pageY);
                        });
                      }, 100);
                    }}
                    placeholder="09:00"
                    placeholderTextColor="rgba(245, 245, 245, 0.6)"
                    keyboardType="numeric"
                    returnKeyType="next"
                    style={{ fontSize: 16 }}
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
                    onFocus={(e) => {
                      setTimeout(() => {
                        (e.target as any)?.measure?.((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
                          scrollToInput(pageY);
                        });
                      }, 100);
                    }}
                    placeholder="18:00"
                    placeholderTextColor="rgba(245, 245, 245, 0.6)"
                    keyboardType="numeric"
                    returnKeyType={index === Object.entries(salonData.operatingHours).length - 1 ? "done" : "next"}
                    style={{ fontSize: 16 }}
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
    <View style={{ flex: 1, backgroundColor: '#2C2C2C' }}>
      {/* Header */}
      <View style={{ 
        paddingTop: 60, 
        paddingHorizontal: 24, 
        paddingBottom: 16,
        backgroundColor: '#2C2C2C',
        zIndex: 10
      }}>
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-text-primary ml-4">Créer mon salon</Text>
        </View>
        
        <View className="flex-row items-center justify-between">
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

      {/* Main Content */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingHorizontal: 24,
            paddingBottom: keyboardVisible ? keyboardHeight + 100 : 120
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fixed Bottom Buttons */}
      <View style={{ 
        paddingHorizontal: 24, 
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 16,
        backgroundColor: '#2C2C2C',
        borderTopWidth: 1,
        borderTopColor: 'rgba(212, 184, 150, 0.1)',
        marginBottom: keyboardVisible ? keyboardHeight : 0
      }}>
        <View className="flex-row gap-4">
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
                if (currentStep === 1) {
                  if (!salonData.name.trim() || !salonData.description.trim() || !salonData.address.trim()) {
                    Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
                    return;
                  }
                  if (!selectedLocation) {
                    Alert.alert('Erreur', 'Veuillez définir la localisation de votre salon');
                    return;
                  }
                }
                setCurrentStep(currentStep + 1);
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
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
      </View>

      {/* Location Modal */}
      <Modal visible={showLocationModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: '#2C2C2C' }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-text-primary">Localisation du salon</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <MaterialIcons name="close" size={24} color="#D4B896" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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
                      {locationLoading ? 'Localisation en cours...' : 'Utiliser ma position GPS'}
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
              
              <View style={{ height: 50 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}