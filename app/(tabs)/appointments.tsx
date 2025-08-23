// app/(tabs)/appointments.tsx - FIXED VERSION WITH BETTER DEBUGGING
import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { serviceService } from '../../services/serviceService';
import { Appointment, AppointmentStatus, Service } from '../../types';
import { useFocusEffect } from '@react-navigation/native';

interface AppointmentWithServices extends Appointment {
  serviceDetails?: Service[];
}

export default function ProviderAppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithServices[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'history'>('pending');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ENHANCED: Load appointments when screen focuses (important for real-time updates)
  useFocusEffect(
    useCallback(() => {
      console.log('AppointmentScreen: Screen focused, reloading appointments');
      if (user?.salonId) {
        loadAppointments();
      }
    }, [user?.salonId])
  );

  useEffect(() => {
    if (user?.salonId) {
      loadAppointments();
    } else {
      console.log('AppointmentScreen: No salonId available');
      setIsLoading(false);
    }
  }, [user?.salonId]);

  // ENHANCED: Appointment loading with better error handling and logging
  const loadAppointments = useCallback(async (isRefreshing = false) => {
    if (!user?.salonId) {
      console.log('AppointmentScreen: No salon ID available');
      setIsLoading(false);
      return;
    }

    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }

      console.log('AppointmentScreen: Loading appointments for salon:', user.salonId);

      const appointmentsData = await appointmentService.getSalonAppointments(user.salonId);
      console.log('AppointmentScreen: Raw appointments loaded:', appointmentsData.length);
      
      // Log each appointment for debugging
      appointmentsData.forEach((apt, index) => {
        console.log(`Appointment ${index + 1}:`, {
          id: apt.id,
          clientName: apt.clientName,
          date: apt.appointmentDate,
          time: apt.timeSlot,
          status: apt.status,
          services: apt.services?.length || 0
        });
      });

      if (appointmentsData.length === 0) {
        console.log('AppointmentScreen: No appointments found for salon');
        setAppointments([]);
        return;
      }

      // Load service details for each appointment
      console.log('AppointmentScreen: Loading service details...');
      const appointmentsWithServices = await Promise.allSettled(
        appointmentsData.map(async (appointment) => {
          try {
            if (!appointment.services || appointment.services.length === 0) {
              console.log(`Appointment ${appointment.id}: No services`);
              return { ...appointment, serviceDetails: [] };
            }

            console.log(`Appointment ${appointment.id}: Loading ${appointment.services.length} services`);
            const services = await serviceService.getServicesByIds(appointment.services);
            console.log(`Appointment ${appointment.id}: Loaded ${services.length} service details`);
            return { ...appointment, serviceDetails: services };
          } catch (error) {
            console.error(`Error loading services for appointment ${appointment.id}:`, error);
            return { ...appointment, serviceDetails: [] };
          }
        })
      );

      // Filter successful results
      const successfulAppointments = appointmentsWithServices
        .filter((result): result is PromiseFulfilledResult<AppointmentWithServices> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      // Sort by date and time (most recent first for pending, oldest first for confirmed)
      const sortedAppointments = successfulAppointments.sort((a, b) => {
        const dateA = new Date(a.appointmentDate + 'T' + a.timeSlot);
        const dateB = new Date(b.appointmentDate + 'T' + b.timeSlot);
        
        // For pending appointments, show newest first
        if (a.status === 'pending' || b.status === 'pending') {
          return dateB.getTime() - dateA.getTime();
        }
        // For others, show chronologically
        return dateA.getTime() - dateB.getTime();
      });

      console.log('AppointmentScreen: Final processed appointments:', sortedAppointments.length);
      setAppointments(sortedAppointments);

    } catch (error) {
      console.error('AppointmentScreen: Error loading appointments:', error);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
    } finally {
      if (!isRefreshing) {
        setIsLoading(false);
      }
    }
  }, [user?.salonId]);

  const onRefresh = async () => {
    console.log('AppointmentScreen: Manual refresh triggered');
    setRefreshing(true);
    await loadAppointments(true);
    setRefreshing(false);
  };

  // ENHANCED: Appointment status update with loading states
  const handleConfirmAppointment = (appointment: Appointment) => {
    if (isSubmitting) return;
    
    Alert.alert(
      'Confirmer le rendez-vous',
      `Confirmer le rendez-vous de ${appointment.clientName} pour le ${appointment.appointmentDate} à ${appointment.timeSlot} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Confirmer', 
          onPress: () => confirmAppointment(appointment.id)
        }
      ]
    );
  };

  const confirmAppointment = async (appointmentId: string) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log('AppointmentScreen: Confirming appointment:', appointmentId);
      
      const result = await appointmentService.confirmAppointment(appointmentId, '');
      
      if (result.success) {
        console.log('AppointmentScreen: Appointment confirmed successfully');
        Alert.alert('Succès', 'Rendez-vous confirmé avec succès');
        await loadAppointments();
      } else {
        console.error('AppointmentScreen: Failed to confirm appointment:', result.error);
        Alert.alert('Erreur', result.error || 'Impossible de confirmer le rendez-vous');
      }
    } catch (error) {
      console.error('AppointmentScreen: Error confirming appointment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAppointment = (appointment: Appointment) => {
    if (isSubmitting) return;
    
    setSelectedAppointment(appointment);
    setNoteText('');
    setShowNoteModal(true);
  };

  const rejectAppointment = async () => {
    if (!selectedAppointment || isSubmitting) return;

    if (!noteText.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer une raison pour le refus');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('AppointmentScreen: Rejecting appointment:', selectedAppointment.id);
      
      const result = await appointmentService.rejectAppointment(
        selectedAppointment.id, 
        noteText.trim()
      );
      
      if (result.success) {
        console.log('AppointmentScreen: Appointment rejected successfully');
        Alert.alert('Rendez-vous refusé', 'Le client sera notifié du refus');
        setShowNoteModal(false);
        setSelectedAppointment(null);
        setNoteText('');
        await loadAppointments();
      } else {
        console.error('AppointmentScreen: Failed to reject appointment:', result.error);
        Alert.alert('Erreur', result.error || 'Impossible de refuser le rendez-vous');
      }
    } catch (error) {
      console.error('AppointmentScreen: Error rejecting appointment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteAppointment = (appointment: Appointment) => {
    if (isSubmitting) return;
    
    Alert.alert(
      'Marquer comme terminé',
      `Marquer le rendez-vous de ${appointment.clientName} comme terminé ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Terminer', 
          onPress: () => completeAppointment(appointment.id)
        }
      ]
    );
  };

  const completeAppointment = async (appointmentId: string) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      console.log('AppointmentScreen: Completing appointment:', appointmentId);
      
      const result = await appointmentService.updateAppointmentStatus(appointmentId, 'completed');
      
      if (result.success) {
        console.log('AppointmentScreen: Appointment completed successfully');
        Alert.alert('Succès', 'Rendez-vous marqué comme terminé');
        await loadAppointments();
      } else {
        console.error('AppointmentScreen: Failed to complete appointment:', result.error);
        Alert.alert('Erreur', result.error || 'Impossible de terminer le rendez-vous');
      }
    } catch (error) {
      console.error('AppointmentScreen: Error completing appointment:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced date formatting
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: 'numeric', 
        month: 'short'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Filter appointments based on active tab
  const filteredAppointments = appointments.filter(apt => {
    switch (activeTab) {
      case 'pending':
        return apt.status === 'pending';
      case 'confirmed':
        return apt.status === 'confirmed';
      case 'history':
        return ['completed', 'cancelled', 'rejected'].includes(apt.status);
      default:
        return false;
    }
  });

  const getTabCount = (tab: string) => {
    return appointments.filter(apt => {
      switch (tab) {
        case 'pending': return apt.status === 'pending';
        case 'confirmed': return apt.status === 'confirmed';
        case 'history': return ['completed', 'cancelled', 'rejected'].includes(apt.status);
        default: return false;
      }
    }).length;
  };

  const renderAppointmentCard = ({ item: appointment }: { item: AppointmentWithServices }) => {
    const getStatusColor = () => {
      switch (appointment.status) {
        case 'pending': return 'bg-amber-500/20 text-amber-600';
        case 'confirmed': return 'bg-green-500/20 text-green-600';
        case 'completed': return 'bg-blue-500/20 text-blue-600';
        case 'cancelled': return 'bg-red-500/20 text-red-600';
        case 'rejected': return 'bg-red-500/20 text-red-600';
        default: return 'bg-gray-500/20 text-gray-600';
      }
    };

    return (
      <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 mb-4">
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <Text className="text-text-primary font-semibold text-lg">
              {appointment.clientName}
            </Text>
            <Text className="text-text-primary/70 text-sm">
              {appointment.clientPhone}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-full ${getStatusColor()}`}>
            <Text className="text-xs font-medium">
              {appointment.status === 'pending' ? 'En attente' :
               appointment.status === 'confirmed' ? 'Confirmé' :
               appointment.status === 'completed' ? 'Terminé' :
               appointment.status === 'cancelled' ? 'Annulé' : 'Refusé'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <MaterialIcons name="schedule" size={16} color="#D4B896" />
          <Text className="text-text-primary ml-2">
            {formatDate(appointment.appointmentDate)} à {appointment.timeSlot}
          </Text>
        </View>

        <View className="flex-row items-center mb-3">
          <MaterialIcons name="attach-money" size={16} color="#D4B896" />
          <Text className="text-text-primary ml-2 font-medium">
            {appointment.totalPrice} DH ({appointment.totalDuration} min)
          </Text>
        </View>

        {appointment.serviceDetails && appointment.serviceDetails.length > 0 && (
          <View className="mb-3">
            <Text className="text-text-primary/70 text-sm mb-1">Services:</Text>
            {appointment.serviceDetails.map((service) => (
              <Text key={service.id} className="text-text-primary text-sm">
                • {service.name} ({service.price} DH - {service.duration} min)
              </Text>
            ))}
          </View>
        )}

        {appointment.notes && (
          <View className="mb-3 p-2 bg-primary-dark/30 rounded-lg">
            <Text className="text-text-primary/70 text-xs mb-1">Notes du client:</Text>
            <Text className="text-text-primary text-sm">{appointment.notes}</Text>
          </View>
        )}

        {/* Action Buttons with Loading States */}
        {appointment.status === 'pending' && (
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => handleConfirmAppointment(appointment)}
              className="flex-1 bg-green-500/20 py-2 rounded-lg flex-row items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <>
                  <MaterialIcons name="check" size={16} color="#10B981" />
                  <Text className="text-green-500 font-medium ml-1 text-sm">Confirmer</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleRejectAppointment(appointment)}
              className="flex-1 bg-red-500/20 py-2 rounded-lg flex-row items-center justify-center"
              disabled={isSubmitting}
            >
              <MaterialIcons name="close" size={16} color="#EF4444" />
              <Text className="text-red-500 font-medium ml-1 text-sm">Refuser</Text>
            </TouchableOpacity>
          </View>
        )}

        {appointment.status === 'confirmed' && (
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity
              onPress={() => handleCompleteAppointment(appointment)}
              className="flex-1 bg-blue-500/20 py-2 rounded-lg flex-row items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <>
                  <MaterialIcons name="done" size={16} color="#3B82F6" />
                  <Text className="text-blue-500 font-medium ml-1 text-sm">Marquer terminé</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {(appointment.rejectionReason || appointment.cancellationReason) && (
          <View className="mt-3 p-2 bg-red-500/10 rounded-lg">
            <Text className="text-red-500 text-xs mb-1">
              {appointment.rejectionReason ? 'Raison du refus:' : 'Raison de l\'annulation:'}
            </Text>
            <Text className="text-red-500 text-sm">
              {appointment.rejectionReason || appointment.cancellationReason}
            </Text>
          </View>
        )}

        
      </View>
    );
  };

  // Show loading screen
  if (isLoading) {
    return (
      <View className="flex-1 bg-primary-dark items-center justify-center">
        <ActivityIndicator size="large" color="#D4B896" />
        <Text className="text-text-primary mt-4">Chargement des rendez-vous...</Text>
      </View>
    );
  }

  // Show no salon message
  if (!user?.salonId) {
    return (
      <View className="flex-1 bg-primary-dark items-center justify-center px-6">
        <MaterialIcons name="store" size={64} color="#D4B896" />
        <Text className="text-text-primary text-xl font-bold mt-4 text-center">
          Aucun salon configuré
        </Text>
        <Text className="text-text-primary/70 text-center mt-2">
          Vous devez d'abord créer votre salon pour voir les rendez-vous
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary-dark">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text className="text-3xl font-bold text-text-primary mb-6">Rendez-vous</Text>
        {/* Tabs */}
        <View className="flex-row bg-primary-light/10 rounded-xl p-1">
          {[
            { key: 'pending', label: 'En attente' },
            { key: 'confirmed', label: 'Confirmés' },
            { key: 'history', label: 'Historique' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              className={`flex-1 py-2 px-3 rounded-lg ${
                activeTab === tab.key ? 'bg-primary-beige' : ''
              }`}
            >
              <Text className={`text-center font-medium text-sm ${
                activeTab === tab.key ? 'text-primary-dark' : 'text-text-primary/70'
              }`}>
                {tab.label} ({getTabCount(tab.key)})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6">
        {filteredAppointments.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <MaterialIcons 
              name={
                activeTab === 'pending' ? 'schedule' :
                activeTab === 'confirmed' ? 'event-available' : 'history'
              } 
              size={64} 
              color="#D4B896" 
            />
            <Text className="text-text-primary text-lg font-medium mt-4 mb-2">
              {activeTab === 'pending' ? 'Aucune demande en attente' :
               activeTab === 'confirmed' ? 'Aucun rendez-vous confirmé' :
               'Aucun historique'}
            </Text>
            <Text className="text-text-primary/70 text-center">
              {activeTab === 'pending' ? 'Les nouvelles demandes de rendez-vous apparaîtront ici' :
               activeTab === 'confirmed' ? 'Vos rendez-vous confirmés apparaîtront ici' :
               'L\'historique de vos rendez-vous apparaîtra ici'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredAppointments}
            keyExtractor={(item) => item.id}
            renderItem={renderAppointmentCard}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#D4B896"
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      {/* Rejection Note Modal */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-primary-dark">
          <View className="px-6 pt-16 pb-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-text-primary">
                Refuser le rendez-vous
              </Text>
              <TouchableOpacity
                onPress={() => {
                  if (!isSubmitting) {
                    setShowNoteModal(false);
                    setSelectedAppointment(null);
                    setNoteText('');
                  }
                }}
                disabled={isSubmitting}
              >
                <MaterialIcons name="close" size={24} color="#D4B896" />
              </TouchableOpacity>
            </View>

            {selectedAppointment && (
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 mb-6">
                <Text className="text-text-primary font-semibold mb-1">
                  {selectedAppointment.clientName}
                </Text>
                <Text className="text-text-primary/70 text-sm">
                  {formatDate(selectedAppointment.appointmentDate)} à {selectedAppointment.timeSlot}
                </Text>
                <Text className="text-primary-beige font-medium mt-1">
                  {selectedAppointment.totalPrice} DH
                </Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="text-text-primary mb-3 font-medium">
                Raison du refus (obligatoire)
              </Text>
              <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
                <TextInput
                  className="text-text-primary"
                  placeholder="Ex: Créneau non disponible, salon fermé ce jour..."
                  placeholderTextColor="rgba(245, 245, 245, 0.6)"
                  value={noteText}
                  onChangeText={setNoteText}
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 100 }}
                  editable={!isSubmitting}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  if (!isSubmitting) {
                    setShowNoteModal(false);
                    setSelectedAppointment(null);
                    setNoteText('');
                  }
                }}
                className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl py-4"
                disabled={isSubmitting}
              >
                <Text className="text-text-primary text-center font-semibold">Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={rejectAppointment}
                disabled={!noteText.trim() || isSubmitting}
                className={`flex-1 rounded-xl py-4 flex-row items-center justify-center ${
                  (!noteText.trim() || isSubmitting) ? 'bg-red-500/50' : 'bg-red-500'
                }`}
              >
                {isSubmitting && (
                  <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                )}
                <Text className="text-white font-semibold">
                  {isSubmitting ? 'Refus...' : 'Refuser le rendez-vous'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}