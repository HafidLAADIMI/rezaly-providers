// services/storageService.ts - Provider App Version
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AppSettings {
  notifications: boolean;
  locationServices: boolean;
  language: string;
  theme: string;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  appointmentId?: string;
  timestamp: Date;
  isRead: boolean;
}

class StorageService {
  // Store data with type safety
  async setItem<T>(key: string, value: T): Promise<ServiceResponse<void>> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return { success: true };
    } catch (error: any) {
      console.error('Error storing data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get data with type safety
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  // Remove data
  async removeItem(key: string): Promise<ServiceResponse<void>> {
    try {
      await AsyncStorage.removeItem(key);
      return { success: true };
    } catch (error: any) {
      console.error('Error removing data:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all data
  async clear(): Promise<ServiceResponse<void>> {
    try {
      await AsyncStorage.clear();
      return { success: true };
    } catch (error: any) {
      console.error('Error clearing storage:', error);
      return { success: false, error: error.message };
    }
  }

  // User Preferences
  async setUserPreferences(preferences: Record<string, any>): Promise<ServiceResponse<void>> {
    return await this.setItem('userPreferences', preferences);
  }

  async getUserPreferences(): Promise<Record<string, any> | null> {
    return await this.getItem<Record<string, any>>('userPreferences');
  }

  // App Settings
  async setAppSettings(settings: AppSettings): Promise<ServiceResponse<void>> {
    return await this.setItem('appSettings', settings);
  }

  async getAppSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      notifications: true,
      locationServices: true,
      language: 'fr',
      theme: 'dark'
    };

    const settings = await this.getItem<AppSettings>('appSettings');
    return settings || defaultSettings;
  }

  async updateAppSettings(updates: Partial<AppSettings>): Promise<ServiceResponse<void>> {
    try {
      const currentSettings = await this.getAppSettings();
      const newSettings = { ...currentSettings, ...updates };
      return await this.setAppSettings(newSettings);
    } catch (error: any) {
      console.error('Error updating app settings:', error);
      return { success: false, error: error.message };
    }
  }

  // === NOTIFICATION METHODS === //

  // Save notification to storage
  async saveNotification(userId: string, notification: Omit<NotificationItem, 'id'>): Promise<ServiceResponse<void>> {
    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notificationItem: NotificationItem = {
        id: notificationId,
        ...notification,
        timestamp: new Date()
      };

      const key = `notifications_${userId}`;
      const existingNotifications = await this.getNotifications(userId);
      
      // Add new notification at the beginning
      const updatedNotifications = [notificationItem, ...existingNotifications];
      
      // Keep only last 50 notifications to avoid storage bloat
      const limitedNotifications = updatedNotifications.slice(0, 50);
      
      await AsyncStorage.setItem(key, JSON.stringify(limitedNotifications));
      console.log('Notification saved:', notificationId);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error saving notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all notifications for user
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    try {
      const key = `notifications_${userId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (!data) return [];
      
      const notifications = JSON.parse(data);
      
      // Convert timestamp strings back to Date objects
      return notifications.map((notif: any) => ({
        ...notif,
        timestamp: new Date(notif.timestamp)
      }));
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markNotificationAsRead(userId: string, notificationId: string): Promise<ServiceResponse<void>> {
    try {
      const key = `notifications_${userId}`;
      const notifications = await this.getNotifications(userId);
      
      const updatedNotifications = notifications.map(notif =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      );
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));
      console.log('Notification marked as read:', notificationId);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark all notifications as read for user
  async markAllNotificationsAsRead(userId: string): Promise<ServiceResponse<void>> {
    try {
      const key = `notifications_${userId}`;
      const notifications = await this.getNotifications(userId);
      
      const updatedNotifications = notifications.map(notif => ({ ...notif, isRead: true }));
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));
      console.log('All notifications marked as read for user:', userId);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Get unread notifications count
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(notif => !notif.isRead).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Clear all notifications for user
  async clearNotifications(userId: string): Promise<ServiceResponse<void>> {
    try {
      const key = `notifications_${userId}`;
      await AsyncStorage.removeItem(key);
      console.log('All notifications cleared for user:', userId);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error clearing notifications:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete specific notification
  async deleteNotification(userId: string, notificationId: string): Promise<ServiceResponse<void>> {
    try {
      const notifications = await this.getNotifications(userId);
      const updatedNotifications = notifications.filter(notif => notif.id !== notificationId);
      
      const key = `notifications_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(updatedNotifications));
      console.log('Notification deleted:', notificationId);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Get notifications by type
  async getNotificationsByType(userId: string, type: string): Promise<NotificationItem[]> {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(notif => notif.type === type);
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      return [];
    }
  }

  // Provider-specific storage methods

  // Store salon data temporarily during setup
  async setSalonSetupData(salonData: any): Promise<ServiceResponse<void>> {
    return await this.setItem('salonSetupData', salonData);
  }

  async getSalonSetupData(): Promise<any | null> {
    return await this.getItem('salonSetupData');
  }

  async clearSalonSetupData(): Promise<ServiceResponse<void>> {
    return await this.removeItem('salonSetupData');
  }

  // Store service data temporarily during creation
  async setServiceSetupData(serviceData: any): Promise<ServiceResponse<void>> {
    return await this.setItem('serviceSetupData', serviceData);
  }

  async getServiceSetupData(): Promise<any | null> {
    return await this.getItem('serviceSetupData');
  }

  async clearServiceSetupData(): Promise<ServiceResponse<void>> {
    return await this.removeItem('serviceSetupData');
  }

  // Dashboard preferences
  async setDashboardPreferences(preferences: Record<string, any>): Promise<ServiceResponse<void>> {
    return await this.setItem('dashboardPreferences', preferences);
  }

  async getDashboardPreferences(): Promise<Record<string, any>> {
    return await this.getItem('dashboardPreferences') || {
      showUpcomingAppointments: true,
      showDailyStats: true,
      showRecentReviews: true,
      defaultTimeRange: '7days'
    };
  }

  // Appointment filters
  async setAppointmentFilters(filters: Record<string, any>): Promise<ServiceResponse<void>> {
    return await this.setItem('appointmentFilters', filters);
  }

  async getAppointmentFilters(): Promise<Record<string, any>> {
    return await this.getItem('appointmentFilters') || {
      dateRange: 'all',
      status: 'all',
      sortBy: 'date',
      sortOrder: 'asc'
    };
  }

  // === END NOTIFICATION METHODS === //

  // Utility method to get all stored keys
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  // Utility method to get storage info
  async getStorageInfo(): Promise<{ keys: string[], totalSize: number }> {
    try {
      const keys = await this.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return { keys, totalSize };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { keys: [], totalSize: 0 };
    }
  }
}

export const storageService = new StorageService();