// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Notification permission not granted');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#D4B896',
        });
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Get push token
  async getExpoPushToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Save push token to user profile
  async savePushToken(userId: string): Promise<void> {
    try {
      const token = await this.getExpoPushToken();
      if (token) {
        await updateDoc(doc(db, 'users', userId), {
          pushToken: token,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Send local notification
  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Schedule notification
  async scheduleNotification(
    notification: NotificationData,
    triggerDate: Date
  ): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: triggerDate,
      });
      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel scheduled notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Store notification in Firestore
  async storeNotification(
    userId: string,
    notification: NotificationData & { type: string }
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        data: notification.data || {},
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  // Appointment notifications
  async notifyAppointmentBooked(salonOwnerId: string, appointmentData: any): Promise<void> {
    const notification = {
      title: 'Nouveau rendez-vous',
      body: `${appointmentData.clientName} a réservé un rendez-vous`,
      type: 'appointment_booked',
      data: { appointmentId: appointmentData.id }
    };

    await this.storeNotification(salonOwnerId, notification);
    await this.sendLocalNotification(notification);
  }

  async notifyAppointmentConfirmed(clientId: string, appointmentData: any): Promise<void> {
    const notification = {
      title: 'Rendez-vous confirmé',
      body: `Votre rendez-vous du ${appointmentData.appointmentDate} est confirmé`,
      type: 'appointment_confirmed',
      data: { appointmentId: appointmentData.id }
    };

    await this.storeNotification(clientId, notification);
    await this.sendLocalNotification(notification);
  }

  async notifyAppointmentRejected(clientId: string, appointmentData: any): Promise<void> {
    const notification = {
      title: 'Rendez-vous refusé',
      body: `Votre rendez-vous du ${appointmentData.appointmentDate} a été refusé`,
      type: 'appointment_rejected',
      data: { appointmentId: appointmentData.id }
    };

    await this.storeNotification(clientId, notification);
    await this.sendLocalNotification(notification);
  }

  async notifyAppointmentReminder(userId: string, appointmentData: any): Promise<void> {
    const notification = {
      title: 'Rappel de rendez-vous',
      body: `Votre rendez-vous est dans 1 heure`,
      type: 'appointment_reminder',
      data: { appointmentId: appointmentData.id }
    };

    // Schedule notification 1 hour before appointment
    const appointmentDateTime = new Date(`${appointmentData.appointmentDate} ${appointmentData.timeSlot}`);
    const reminderTime = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);

    if (reminderTime > new Date()) {
      await this.scheduleNotification(notification, reminderTime);
    }
  }

  // Review notifications
  async notifyNewReview(salonOwnerId: string, reviewData: any): Promise<void> {
    const notification = {
      title: 'Nouvel avis',
      body: `${reviewData.clientName} a laissé un avis (${reviewData.rating}/5)`,
      type: 'new_review',
      data: { reviewId: reviewData.id }
    };

    await this.storeNotification(salonOwnerId, notification);
    await this.sendLocalNotification(notification);
  }

  // Listen to notification response
  addNotificationResponseListener(callback: (response: any) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Listen to notifications received while app is running
  addNotificationReceivedListener(callback: (notification: any) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();