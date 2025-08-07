// app/(tabs)/salon.tsx - FIXED PROVIDER VERSION
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { salonOwnerService } from '../../services/salonOwnerService';
import { serviceService } from '../../services/serviceService';
import { categoryService } from '../../services/categoryService';
import { appointmentService } from '../../services/appointmentService';
import { Service, Category, Appointment } from '../../types';
import { router } from 'expo-router';

export default function SalonManagementScreen() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSalon, setHasSalon] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // FIXED: Enhanced data loading with better error handling
  const loadData = async () => {
    console.log('SalonScreen: Loading data for user:', user?.email);
    console.log('SalonScreen: User salonId:', user?.salonId);
    
    try {
      setIsLoading(true);
      
      // Load categories first (always available)
      const categoriesList = await categoryService.getAllCategories();
      setCategories(categoriesList);
      console.log('SalonScreen: Categories loaded:', categoriesList.length);

      // Check if user has a salon
      if (user?.salonId) {
        console.log('SalonScreen: User has salonId, loading salon data...');
        setHasSalon(true);
        
        // Load services and appointments in parallel
        const [servicesList, appointmentsList] = await Promise.allSettled([
          serviceService.getServicesBySalon(user.salonId),
          appointmentService.getSalonAppointments(user.salonId)
        ]);

        // Handle services
        if (servicesList.status === 'fulfilled') {
          setServices(servicesList.value);
          console.log('SalonScreen: Services loaded:', servicesList.value.length);
        } else {
          console.error('Failed to load services:', servicesList.reason);
          setServices([]);
        }

        // Handle appointments
        if (appointmentsList.status === 'fulfilled') {
          setAppointments(appointmentsList.value);
          console.log('SalonScreen: Appointments loaded:', appointmentsList.value.length);
        } else {
          console.error('Failed to load appointments:', appointmentsList.reason);
          setAppointments([]);
        }
      } else {
        console.log('SalonScreen: User has no salonId, showing create salon flow');
        setHasSalon(false);
        setServices([]);
        setAppointments([]);
      }
    } catch (error) {
      console.error('SalonScreen: Error loading data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // FIXED: Enhanced refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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

  // FIXED: Enhanced service creation with validation
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

    const priceNum = parseFloat(price);
    const durationNum = parseInt(duration);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre positif');
      return;
    }

    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Erreur', 'La durée doit être un nombre positif en minutes');
      return;
    }

    try {
      const result = await salonOwnerService.addService(user.salonId, {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        duration: durationNum,
        categoryId
      });

      if (result.success) {
        Alert.alert('Succès', 'Service ajouté avec succès');
        setShowAddServiceModal(false);
        resetForm();
        await loadData(); // Reload data to show new service
      } else {
        Alert.alert('Erreur', result.error || 'Impossible d\'ajouter le service');
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

    const priceNum = parseFloat(price);
    const durationNum = parseInt(duration);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre positif');
      return;
    }

    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Erreur', 'La durée doit être un nombre positif en minutes');
      return;
    }

    try {
      const result = await salonOwnerService.updateService(editingService.id, {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        duration: durationNum,
        categoryId
      });

      if (result.success) {
        Alert.alert('Succès', 'Service modifié avec succès');
        setShowAddServiceModal(false);
        resetForm();
        await loadData(); // Reload data to show updated service
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de modifier le service');
      }
    } catch (error) {
      console.error('Error updating service:', error);
      Alert.alert('Erreur', 'Impossible de modifier le service');
    }
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Supprimer le service',
      `Êtes-vous sûr de vouloir supprimer "${service.name}" ?\n\nCette action supprimera également tous les rendez-vous associés à ce service.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await salonOwnerService.deleteService(service.id);
              if (result.success) {
                Alert.alert('Succès', 'Service supprimé avec succès');
                await loadData(); // Reload data
              } else {
                Alert.alert('Erreur', result.error || 'Impossible de supprimer le service');
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

  // FIXED: Get pending appointments count
  const getPendingAppointmentsCount = () => {
    return appointments.filter(apt => apt.status === 'pending').length;
  };

  // FIXED: Get today's appointments count
  const getTodayAppointmentsCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointmentDate === today).length;
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
                onPress={() => router.push("/create-salon")}
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
      <ScrollView refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4B896" />
      }>
        {/* Header */}
        <View className="px-6 pt-16 pb-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-3xl font-bold text-text-primary">Mon Salon</Text>
            <TouchableOpacity
              onPress={() => setShowAddServiceModal(true)}
              className="bg-primary-beige rounded-xl px-4 py-2 flex-row items-center"
            >
              <MaterialIcons name="add" size={20} color="#2A2A2A" />
              <Text className="text-primary-dark font-semibold ml-1">Service</Text>
            </TouchableOpacity>
          </View>

          {/* ADDED: Stats Cards */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
              <Text className="text-text-primary text-2xl font-bold">{services.length}</Text>
              <Text className="text-text-primary/70 text-sm">Services</Text>
            </View>
            <View className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
              <Text className="text-primary-beige text-2xl font-bold">{getPendingAppointmentsCount()}</Text>
              <Text className="text-text-primary/70 text-sm">En attente</Text>
            </View>
            <View className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
              <Text className="text-text-primary text-2xl font-bold">{getTodayAppointmentsCount()}</Text>
              <Text className="text-text-primary/70 text-sm">Aujourd'hui</Text>
            </View>
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
                Commencez par ajouter vos premiers services pour que les clients puissent réserver
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

                  <Text className="text-text-primary/70 mb-3 text-sm">
                    {service.description}
                  </Text>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <MaterialIcons name="attach-money" size={16} color="#D4B896" />
                      <Text className="text-text-primary ml-1 font-semibold">
                        {service.price} DH
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

        {/* Recent Appointments Section */}
        {appointments.length > 0 && (
          <View className="px-6 mt-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-semibold text-text-primary">
                Rendez-vous récents
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/appointments')}>
                <Text className="text-primary-beige font-medium">Voir tout</Text>
              </TouchableOpacity>
            </View>

            {appointments.slice(0, 3).map((appointment) => (
              <View
                key={appointment.id}
                className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 mb-3"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-text-primary font-semibold">
                      {appointment.clientName}
                    </Text>
                    <Text className="text-text-primary/70 text-sm">
                      {appointment.appointmentDate} à {appointment.timeSlot}
                    </Text>
                    <Text className="text-primary-beige font-medium mt-1">
                      {appointment.totalPrice} DH
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${
                    appointment.status === 'pending' ? 'bg-amber-500/20' :
                    appointment.status === 'confirmed' ? 'bg-green-500/20' :
                    appointment.status === 'completed' ? 'bg-blue-500/20' :
                    'bg-red-500/20'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      appointment.status === 'pending' ? 'text-amber-500' :
                      appointment.status === 'confirmed' ? 'text-green-500' :
                      appointment.status === 'completed' ? 'text-blue-500' :
                      'text-red-500'
                    }`}>
                      {appointment.status === 'pending' ? 'En attente' :
                       appointment.status === 'confirmed' ? 'Confirmé' :
                       appointment.status === 'completed' ? 'Terminé' :
                       appointment.status === 'cancelled' ? 'Annulé' : 'Refusé'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

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
                  <Text className="text-text-primary mb-2 font-medium">Nom du service *</Text>
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
                  <Text className="text-text-primary mb-2 font-medium">Description *</Text>
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
                  <Text className="text-text-primary mb-2 font-medium">Catégorie *</Text>
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
                    <Text className="text-text-primary mb-2 font-medium">Prix (DH) *</Text>
                    <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
                      <TextInput
                        className="text-text-primary"
                        placeholder="150"
                        placeholderTextColor="rgba(245, 245, 245, 0.6)"
                        value={serviceForm.price}
                        onChangeText={(value) => updateServiceForm('price', value)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-text-primary mb-2 font-medium">Durée (min) *</Text>
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