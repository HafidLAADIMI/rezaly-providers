// app/(tabs)/appointments.tsx
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { notificationService } from '../../services/notificationService';
import { Appointment, AppointmentStatus } from '../../types';

export default function AppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<'all' | AppointmentStatus>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  const isSalonOwner = user?.role === 'salon_owner';

  useEffect(() => {
    loadAppointments();
  }, [filterStatus]);

  const loadAppointments = async () => {
    if (!user) return;

    try {
      let appointmentsList: Appointment[];
      
      if (isSalonOwner && user.salonId) {
        // Load salon appointments for salon owners
        if (filterStatus === 'all') {
          appointmentsList = await appointmentService.getSalonAppointments(user.salonId);
        } else {
          appointmentsList = await appointmentService.getSalonAppointments(user.salonId, filterStatus);
        }
      } else if (isSalonOwner && !user.salonId) {
        // Salon owner without salon
        appointmentsList = [];
      } else {
        // Load client appointments for regular users
        appointmentsList = await appointmentService.getClientAppointments(user.id);
        if (filterStatus !== 'all') {
          appointmentsList = appointmentsList.filter(apt => apt.status === filterStatus);
        }
      }

      setAppointments(appointmentsList);
      console.log('Appointments loaded:', appointmentsList.length);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Erreur', 'Impossible de charger les rendez-vous');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
  };

  const handleStatusUpdate = async (appointmentId: string, status: AppointmentStatus, reason?: string) => {
    try {
      let result;
      
      switch (status) {
        case 'confirmed':
          result = await appointmentService.confirmAppointment(appointmentId);
          if (result.success) {
            const appointment = appointments.find(apt => apt.id === appointmentId);
            if (appointment) {
              await notificationService.notifyAppointmentConfirmed(appointment.clientId, appointment);
            }
          }
          break;
        case 'rejected':
          result = await appointmentService.rejectAppointment(appointmentId, reason || 'Non spécifié');
          if (result.success) {
            const appointment = appointments.find(apt => apt.id === appointmentId);
            if (appointment) {
              await notificationService.notifyAppointmentRejected(appointment.clientId, appointment);
            }
          }
          break;
        case 'cancelled':
          result = await appointmentService.cancelAppointment(appointmentId, reason || 'Annulé par le client');
          break;
        default:
          result = await appointmentService.updateAppointmentStatus(appointmentId, status);
      }

      if (result.success) {
        await loadAppointments();
        Alert.alert('Succès', 'Statut du rendez-vous mis à jour');
      } else {
        Alert.alert('Erreur', result.error);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le rendez-vous');
    }
  };

  const showStatusActions = (appointment: Appointment) => {
    if (!isSalonOwner) return;
    
    const actions = [];
    
    if (appointment.status === 'pending') {
      actions.push(
        { 
          text: 'Confirmer', 
          onPress: () => handleStatusUpdate(appointment.id, 'confirmed'),
          style: 'default'
        },
        { 
          text: 'Refuser', 
          onPress: () => {
            Alert.alert(
              'Motif du refus',
              'Pourquoi refusez-vous ce rendez-vous ?',
              [
                { text: 'Créneaux non disponible', onPress: () => handleStatusUpdate(appointment.id, 'rejected', 'Créneaux non disponible') },
                { text: 'Service non proposé', onPress: () => handleStatusUpdate(appointment.id, 'rejected', 'Service non proposé') },
                { text: 'Salon fermé', onPress: () => handleStatusUpdate(appointment.id, 'rejected', 'Salon fermé') },
                { text: 'Autre raison', onPress: () => handleStatusUpdate(appointment.id, 'rejected', 'Autre raison') },
                { text: 'Annuler', style: 'cancel' }
              ]
            );
          },
          style: 'destructive'
        }
      );
    }
    
    if (appointment.status === 'confirmed') {
      actions.push(
        { 
          text: 'Marquer terminé', 
          onPress: () => handleStatusUpdate(appointment.id, 'completed'),
          style: 'default'
        }
      );
    }

    actions.push({ text: 'Annuler', style: 'cancel' });

    Alert.alert('Actions sur le rendez-vous', 'Que souhaitez-vous faire ?', actions);
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-600';
      case 'confirmed': return 'bg-green-500/20 text-green-600';
      case 'completed': return 'bg-blue-500/20 text-blue-600';
      case 'rejected': return 'bg-red-500/20 text-red-600';
      case 'cancelled': return 'bg-gray-500/20 text-gray-600';
    }
  };

  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmé';
      case 'completed': return 'Terminé';
      case 'rejected': return 'Refusé';
      case 'cancelled': return 'Annulé';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getMarkedDates = () => {
    const marked: any = {};
    appointments.forEach(appointment => {
      marked[appointment.appointmentDate] = {
        marked: true,
        dotColor: appointment.status === 'confirmed' ? '#10B981' : '#D4B896'
      };
    });
    return marked;
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (showCalendar && selectedDate) {
      return appointment.appointmentDate === selectedDate;
    }
    return true;
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-primary-dark items-center justify-center">
        <Text className="text-text-primary">Chargement des rendez-vous...</Text>
      </View>
    );
  }

  // Show no salon message for salon owners without salon
  if (isSalonOwner && !user?.salonId) {
    return (
      <View className="flex-1 bg-primary-dark">
        <View className="px-6 pt-16 pb-6">
          <Text className="text-3xl font-bold text-text-primary mb-4">Rendez-vous</Text>
        </View>
        
        <View className="px-6">
          <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-6 items-center">
            <MaterialIcons name="event-busy" size={64} color="#D4B896" />
            <Text className="text-text-primary text-xl font-semibold mt-4 mb-2 text-center">
              Aucun rendez-vous disponible
            </Text>
            <Text className="text-text-primary/70 text-center mb-6">
              Vous devez d'abord créer votre salon pour recevoir des demandes de rendez-vous de vos clients.
            </Text>
            
            <TouchableOpacity 
              className="bg-primary-beige rounded-xl px-6 py-3"
              onPress={() => {/* Navigate to create salon */}}
            >
              <Text className="text-primary-dark font-semibold">Créer mon salon</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-primary-dark"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#D4B896" />
      }
    >
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-3xl font-bold text-text-primary">
            {isSalonOwner ? 'Demandes de RDV' : 'Mes Rendez-vous'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowCalendar(!showCalendar)}
            className="bg-primary-beige/20 p-2 rounded-lg"
          >
            <MaterialIcons 
              name={showCalendar ? "list" : "calendar-today"} 
              size={24} 
              color="#D4B896" 
            />
          </TouchableOpacity>
        </View>

        {/* Filter Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {['all', 'pending', 'confirmed', 'completed'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setFilterStatus(status as any)}
                className={`px-4 py-2 rounded-lg ${
                  filterStatus === status 
                    ? 'bg-primary-beige' 
                    : 'bg-primary-light/10 border border-primary-beige/30'
                }`}
              >
                <Text className={`font-medium ${
                  filterStatus === status 
                    ? 'text-primary-dark' 
                    : 'text-text-primary'
                }`}>
                  {status === 'all' ? 'Tous' : getStatusText(status as AppointmentStatus)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Calendar View */}
      {showCalendar && (
        <View className="px-6 mb-6">
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={{
              ...getMarkedDates(),
              [selectedDate]: {
                ...getMarkedDates()[selectedDate],
                selected: true,
                selectedColor: '#D4B896'
              }
            }}
            theme={{
              backgroundColor: '#2A2A2A',
              calendarBackground: '#2A2A2A',
              textSectionTitleColor: '#F5F5F5',
              dayTextColor: '#F5F5F5',
              todayTextColor: '#D4B896',
              selectedDayTextColor: '#2A2A2A',
              monthTextColor: '#F5F5F5',
              arrowColor: '#D4B896',
              textDayHeaderFontSize: 14,
              textMonthFontSize: 18,
              textDayFontSize: 16
            }}
          />
        </View>
      )}

      {/* Appointments List */}
      <View className="px-6">
        {filteredAppointments.length === 0 ? (
          <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-6 items-center">
            <MaterialIcons name="event-busy" size={48} color="#D4B896" />
            <Text className="text-text-primary mt-3 text-center font-semibold">
              {isSalonOwner ? 'Aucune demande de rendez-vous' : 'Aucun rendez-vous'}
            </Text>
            <Text className="text-text-primary/70 text-center mt-1">
              {showCalendar 
                ? `Aucun rendez-vous pour le ${formatDate(selectedDate)}`
                : isSalonOwner 
                  ? 'Les demandes de rendez-vous de vos clients apparaîtront ici'
                  : 'Vos rendez-vous réservés apparaîtront ici'
              }
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <TouchableOpacity
                key={appointment.id}
                onLongPress={() => showStatusActions(appointment)}
                className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4"
              >
                {/* Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-text-primary font-semibold text-lg">
                      {isSalonOwner ? appointment.clientName : 'Rendez-vous salon'}
                    </Text>
                    <Text className="text-text-primary/70">
                      {formatDate(appointment.appointmentDate)}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
                    <Text className="text-sm font-medium">
                      {getStatusText(appointment.status)}
                    </Text>
                  </View>
                </View>

                {/* Details */}
                <View className="space-y-2">
                  <View className="flex-row items-center">
                    <MaterialIcons name="schedule" size={16} color="#D4B896" />
                    <Text className="text-text-primary ml-2">{appointment.timeSlot}</Text>
                  </View>
                  
                  <View className="flex-row items-center">
                    <MaterialIcons name="phone" size={16} color="#D4B896" />
                    <Text className="text-text-primary ml-2">{appointment.clientPhone}</Text>
                  </View>
                  
                  <View className="flex-row items-center">
                    <MaterialIcons name="attach-money" size={16} color="#D4B896" />
                    <Text className="text-text-primary ml-2">{appointment.totalPrice}€</Text>
                  </View>

                  <View className="flex-row items-center">
                    <MaterialIcons name="timer" size={16} color="#D4B896" />
                    <Text className="text-text-primary ml-2">{appointment.totalDuration} min</Text>
                  </View>
                </View>

                {/* Services */}
                <View className="mt-3 pt-3 border-t border-primary-beige/20">
                  <Text className="text-text-primary/70 text-sm">
                    {appointment.services.length} service(s) réservé(s)
                  </Text>
                </View>

                {/* Notes */}
                {(appointment.notes || appointment.salonNotes || appointment.rejectionReason) && (
                  <View className="mt-3 pt-3 border-t border-primary-beige/20">
                    {appointment.notes && (
                      <Text className="text-text-primary/70 text-sm mb-1">
                        💬 Client: {appointment.notes}
                      </Text>
                    )}
                    {appointment.salonNotes && (
                      <Text className="text-text-primary/70 text-sm mb-1">
                        🏪 Salon: {appointment.salonNotes}
                      </Text>
                    )}
                    {appointment.rejectionReason && (
                      <Text className="text-red-400 text-sm">
                        ❌ Refusé: {appointment.rejectionReason}
                      </Text>
                    )}
                  </View>
                )}

                {/* Quick Action Buttons for Salon Owners */}
                {isSalonOwner && appointment.status === 'pending' && (
                  <View className="flex-row gap-2 mt-3 pt-3 border-t border-primary-beige/20">
                    <TouchableOpacity
                      onPress={() => handleStatusUpdate(appointment.id, 'confirmed')}
                      className="bg-green-500/20 px-3 py-2 rounded-lg flex-1"
                    >
                      <Text className="text-green-500 text-center font-medium">✓ Accepter</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Refuser le rendez-vous',
                          'Êtes-vous sûr de vouloir refuser cette demande ?',
                          [
                            { text: 'Annuler', style: 'cancel' },
                            { text: 'Refuser', style: 'destructive', onPress: () => handleStatusUpdate(appointment.id, 'rejected', 'Créneaux non disponible') }
                          ]
                        );
                      }}
                      className="bg-red-500/20 px-3 py-2 rounded-lg flex-1"
                    >
                      <Text className="text-red-500 text-center font-medium">✗ Refuser</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Bottom Padding */}
      <View className="h-20" />
    </ScrollView>
  );
}

  
