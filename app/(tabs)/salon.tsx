
// app/(tabs)/salon.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { salonOwnerService } from '../../services/salonOwnerService';
import { serviceService } from '../../services/serviceService';
import { categoryService } from '../../services/categoryService';
import { Service, Category } from '../../types';
import { router } from 'expo-router';

export default function SalonManagementScreen() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSalon, setHasSalon] = useState(false);

  // Form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    categoryId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('SalonScreen: Loading data for user:', user?.email);
    console.log('SalonScreen: User salonId:', user?.salonId);
    
    try {
      // Load categories first (always available)
      const categoriesList = await categoryService.getAllCategories();
      setCategories(categoriesList);
      console.log('SalonScreen: Categories loaded:', categoriesList.length);

      // Check if user has a salon
      if (user?.salonId) {
        console.log('SalonScreen: User has salonId, loading services...');
        setHasSalon(true);
        
        // Load services for this salon
        const servicesList = await serviceService.getServicesBySalon(user.salonId);
        setServices(servicesList);
        console.log('SalonScreen: Services loaded:', servicesList.length);
      } else {
        console.log('SalonScreen: User has no salonId, showing create salon flow');
        setHasSalon(false);
        setServices([]);
      }
    } catch (error) {
      console.error('SalonScreen: Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setServiceForm({
      name: '',
      description: '',
      price: '',
      duration: '',
      categoryId: ''
    });
    setEditingService(null);
  };

  const handleAddService = async () => {
    if (!user?.salonId) {
      Alert.alert('Erreur', 'Vous devez d\'abord créer votre salon');
      return;
    }

    const { name, description, price, duration, categoryId } = serviceForm;

    if (!name.trim() || !description.trim() || !price || !duration || !categoryId) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const result = await salonOwnerService.addService(user.salonId, {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        duration: parseInt(duration),
        categoryId
      });

      if (result.success) {
        Alert.alert('Succès', 'Service ajouté avec succès');
        setShowAddServiceModal(false);
        resetForm();
        loadData();
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      console.error('Error adding service:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le service');
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;

    const { name, description, price, duration, categoryId } = serviceForm;

    if (!name.trim() || !description.trim() || !price || !duration || !categoryId) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const result = await salonOwnerService.updateService(editingService.id, {
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        duration: parseInt(duration),
        categoryId
      });

      if (result.success) {
        Alert.alert('Succès', 'Service modifié avec succès');
        setShowAddServiceModal(false);
        resetForm();
        loadData();
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      console.error('Error updating service:', error);
      Alert.alert('Erreur', 'Impossible de modifier le service');
    }
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Supprimer le service',
      `Êtes-vous sûr de vouloir supprimer "${service.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await salonOwnerService.deleteService(service.id);
              if (result.success) {
                Alert.alert('Succès', 'Service supprimé');
                loadData();
              } else {
                Alert.alert('Erreur', result.error);
              }
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le service');
            }
          }
        }
      ]
    );
  };

  const openEditService = (service: Service) => {
    setServiceForm({
      name: service.name,
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      categoryId: service.categoryId
    });
    setEditingService(service);
    setShowAddServiceModal(true);
  };

  const updateServiceForm = (field: string, value: string) => {
    setServiceForm(prev => ({ ...prev, [field]: value }));
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'Catégorie inconnue';
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-primary-dark items-center justify-center">
        <Text className="text-text-primary">Chargement...</Text>
      </View>
    );
  }

  // If user doesn't have a salon yet, show create salon flow
  if (!hasSalon) {
    return (
      <View className="flex-1 bg-primary-dark">
        <ScrollView>
          {/* Header */}
          <View className="px-6 pt-16 pb-6">
            <Text className="text-3xl font-bold text-text-primary mb-4">Mon Salon</Text>
          </View>

          {/* Create Salon Prompt */}
          <View className="px-6">
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-6 items-center">
              <MaterialIcons name="store" size={64} color="#D4B896" />
              <Text className="text-text-primary text-xl font-semibold mt-4 mb-2 text-center">
                Créez votre fiche salon
              </Text>
              <Text className="text-text-primary/70 text-center mb-6">
                Vous devez d'abord créer votre fiche salon pour pouvoir gérer vos services et rendez-vous.
              </Text>
              
              <TouchableOpacity 
                className="bg-primary-beige rounded-xl px-6 py-3 mb-4"
                onPress={() => {
                     router.push("/create-salon")
                }}
              >
                <Text className="text-primary-dark font-semibold">Créer ma fiche salon</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Normal salon management interface
  return (
    <View className="flex-1 bg-primary-dark">
      <ScrollView>
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-3xl font-bold text-text-primary">Mon Salon</Text>
            <TouchableOpacity
              onPress={() => setShowAddServiceModal(true)}
              className="bg-primary-beige rounded-xl px-4 py-2 flex-row items-center"
            >
              <MaterialIcons name="add" size={20} color="#2A2A2A" />
              <Text className="text-primary-dark font-semibold ml-1">Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Services Section */}
        <View className="px-6">
          <Text className="text-xl font-semibold text-text-primary mb-4">
            Services ({services.length})
          </Text>
          
          {services.length === 0 ? (
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-6 items-center">
              <MaterialIcons name="spa" size={48} color="#D4B896" />
              <Text className="text-text-primary mt-3 text-center font-semibold">
                Aucun service ajouté
              </Text>
              <Text className="text-text-primary/70 text-center mt-1 mb-4">
                Commencez par ajouter vos premiers services
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddServiceModal(true)}
                className="bg-primary-beige rounded-lg px-4 py-2"
              >
                <Text className="text-primary-dark font-semibold">Ajouter un service</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-3">
              {services.map((service) => (
                <View
                  key={service.id}
                  className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1">
                      <Text className="text-text-primary font-semibold text-lg">
                        {service.name}
                      </Text>
                      <Text className="text-text-primary/70 text-sm">
                        {getCategoryName(service.categoryId)}
                      </Text>
                    </View>
                    <View className="flex-row gap-2">
                      <TouchableOpacity
                        onPress={() => openEditService(service)}
                        className="bg-primary-beige/20 p-2 rounded-lg"
                      >
                        <MaterialIcons name="edit" size={20} color="#D4B896" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteService(service)}
                        className="bg-red-500/20 p-2 rounded-lg"
                      >
                        <MaterialIcons name="delete" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text className="text-text-primary/70 mb-3">
                    {service.description}
                  </Text>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <MaterialIcons name="attach-money" size={16} color="#D4B896" />
                      <Text className="text-text-primary ml-1 font-semibold">
                        {service.price}€
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialIcons name="schedule" size={16} color="#D4B896" />
                      <Text className="text-text-primary ml-1">
                        {service.duration} min
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Padding */}
        <View className="h-20" />
      </ScrollView>

      {/* Add/Edit Service Modal */}
      <Modal
        visible={showAddServiceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-primary-dark">
          <View className="px-6 pt-16 pb-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-text-primary">
                {editingService ? 'Modifier le service' : 'Ajouter un service'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddServiceModal(false);
                  resetForm();
                }}
              >
                <MaterialIcons name="close" size={24} color="#D4B896" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="space-y-4">
                {/* Service Name */}
                <View>
                  <Text className="text-text-primary mb-2 font-medium">Nom du service</Text>
                  <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
                    <TextInput
                      className="text-text-primary"
                      placeholder="Ex: Coupe homme"
                      placeholderTextColor="rgba(245, 245, 245, 0.6)"
                      value={serviceForm.name}
                      onChangeText={(value) => updateServiceForm('name', value)}
                    />
                  </View>
                </View>

                {/* Description */}
                <View>
                  <Text className="text-text-primary mb-2 font-medium">Description</Text>
                  <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
                    <TextInput
                      className="text-text-primary"
                      placeholder="Décrivez votre service..."
                      placeholderTextColor="rgba(245, 245, 245, 0.6)"
                      value={serviceForm.description}
                      onChangeText={(value) => updateServiceForm('description', value)}
                      multiline
                      numberOfLines={3}
                      style={{ minHeight: 80 }}
                    />
                  </View>
                </View>

                {/* Category */}
                <View>
                  <Text className="text-text-primary mb-2 font-medium">Catégorie</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          onPress={() => updateServiceForm('categoryId', category.id)}
                          className={`px-4 py-2 rounded-lg ${
                            serviceForm.categoryId === category.id
                              ? 'bg-primary-beige'
                              : 'bg-primary-light/10 border border-primary-beige/30'
                          }`}
                        >
                          <Text className={`font-medium ${
                            serviceForm.categoryId === category.id
                              ? 'text-primary-dark'
                              : 'text-text-primary'
                          }`}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Price and Duration */}
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-text-primary mb-2 font-medium">Prix (€)</Text>
                    <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
                      <TextInput
                        className="text-text-primary"
                        placeholder="25"
                        placeholderTextColor="rgba(245, 245, 245, 0.6)"
                        value={serviceForm.price}
                        onChangeText={(value) => updateServiceForm('price', value)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-text-primary mb-2 font-medium">Durée (min)</Text>
                    <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
                      <TextInput
                        className="text-text-primary"
                        placeholder="30"
                        placeholderTextColor="rgba(245, 245, 245, 0.6)"
                        value={serviceForm.duration}
                        onChangeText={(value) => updateServiceForm('duration', value)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={editingService ? handleEditService : handleAddService}
                  className="bg-primary-beige rounded-xl py-4 mt-6"
                >
                  <Text className="text-primary-dark text-center font-semibold text-lg">
                    {editingService ? 'Modifier le service' : 'Ajouter le service'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}