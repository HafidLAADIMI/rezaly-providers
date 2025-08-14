// contexts/NotificationContext.tsx - Create this file in your provider app
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot   } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { Appointment } from '../types';

interface NotificationContextType {
  // Add any notification-specific state/methods you need
}

const NotificationContext = createContext<NotificationContextType>({});

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    // Only listen for salon owners and if they have a salon
    if (!user?.id || user?.role !== 'salon_owner' || !user?.salonId) {
      console.log('User not eligible for appointment notifications:', {
        userId: user?.id,
        role: user?.role,
        salonId: user?.salonId
      });
      return;
    }

    console.log('Setting up appointment listener for salon owner:', user.id, 'salon:', user.salonId);

    // Listen to new appointments for the salon
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('salonId', '==', user.salonId)
    );

    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const appointment = { id: change.doc.id, ...change.doc.data() } as Appointment;
          console.log('New appointment detected:', appointment);

          // Only notify for new pending appointments
          // Skip if this is an existing appointment loaded when app starts
          if (appointment.status === 'pending') {
            // Check if appointment was created recently (within last 5 minutes)
            // This helps avoid notifications for existing appointments when app starts
            const appointmentCreated = appointment.createdAt?.toDate?.() || new Date();
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            if (appointmentCreated > fiveMinutesAgo) {
              await handleNewAppointment(appointment);
            }
          }
        }
      });
    }, (error) => {
      console.error('Error listening to appointments:', error);
    });

    return () => {
      console.log('Cleaning up appointment listener for provider');
      unsubscribe();
    };
  }, [user?.id, user?.role, user?.salonId]);

  const handleNewAppointment = async (appointment: Appointment) => {
    try {
      console.log('Handling new appointment notification:', appointment.id);

      // Get appointment details for better notification
      const appointmentDate = new Date(appointment.appointmentDate + 'T00:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      // Send local notification (this will show as push notification)
      await notificationService.sendLocalNotification({
        title: '🗓️ Nouvelle demande de rendez-vous',
        body: `${appointment.clientName} souhaite réserver le ${appointmentDate} à ${appointment.timeSlot}`,
        data: {
          type: 'new_appointment',
          appointmentId: appointment.id,
          clientName: appointment.clientName,
          appointmentDate: appointment.appointmentDate,
          timeSlot: appointment.timeSlot
        }
      });

      // Save notification to storage for history
      await saveNotificationToStorage(appointment, appointmentDate);

      console.log('New appointment notification sent successfully');
    } catch (error) {
      console.error('Error handling new appointment:', error);
    }
  };

  const saveNotificationToStorage = async (appointment: Appointment, formattedDate: string) => {
    if (!user?.id) return;

    try {
      const title = '🗓️ Nouvelle demande de rendez-vous';
      const body = `${appointment.clientName} souhaite réserver le ${formattedDate} à ${appointment.timeSlot}`;

      await storageService.saveNotification(user.id, {
        title,
        body,
        type: 'new_appointment',
        appointmentId: appointment.id,
        isRead: false
      });

      console.log('New appointment notification saved to storage');
    } catch (error) {
      console.error('Error saving notification to storage:', error);
    }
  };

  const value: NotificationContextType = {
    // Add any methods you want to expose
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};