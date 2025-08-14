// app/notifications.tsx - Provider Version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';    
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  appointmentId?: string;
  timestamp: Date;
  isRead: boolean;
}

interface NotificationCardProps {
  notification: NotificationItem;
  onPress: () => void;
}

const NotificationCard = ({ notification, onPress }: NotificationCardProps) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return 'event-note';
      case 'appointment_cancelled':
        return 'event-busy';
      case 'review_received':
        return 'star';
      case 'payment_received':
        return 'payment';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return '#10B981'; // Green
      case 'appointment_cancelled':
        return '#EF4444'; // Red
      case 'review_received':
        return '#F59E0B'; // Amber
      case 'payment_received':
        return '#8B5CF6'; // Purple
      default:
        return '#D4B896'; // Primary beige
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return timestamp.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`mx-4 mb-3 p-4 rounded-xl ${
        notification.isRead ? 'bg-primary-light/10 border border-primary-beige/30' : 'bg-primary-beige/20 border border-primary-beige/50'
      }`}
    >
      <View className="flex-row items-start">
        <View className="mr-3 mt-1">
          <MaterialIcons
            name={getNotificationIcon(notification.type)}
            size={24}
            color={getNotificationColor(notification.type)}
          />
        </View>
        
        <View className="flex-1">
          <Text className="text-text-primary font-semibold text-base mb-1">
            {notification.title}
          </Text>
          <Text className="text-text-primary/70 text-sm mb-2 leading-5">
            {notification.body}
          </Text>
          <Text className="text-text-primary/50 text-xs">
            {formatTime(notification.timestamp)}
          </Text>
        </View>

        {!notification.isRead && (
          <View className="w-3 h-3 bg-primary-beige rounded-full mt-1" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function ProviderNotificationsScreen(): JSX.Element {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);

      if (!user?.id) {
        console.log('No user ID available');
        return;
      }

      // Get notifications from storage
      const storedNotifications = await storageService.getNotifications(user.id);
      
      // Sort by timestamp (newest first)
      const sortedNotifications = storedNotifications.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );

      setNotifications(sortedNotifications);
      console.log('Loaded notifications:', sortedNotifications.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications(true);
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      if (user?.id) {
        await storageService.markNotificationAsRead(user.id, notificationId);
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = async (notification: NotificationItem) => {
    // Mark as read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'new_appointment' && notification.appointmentId) {
      router.push('/(tabs)/appointments');
    } else if (notification.type === 'appointment_cancelled' && notification.appointmentId) {
      router.push('/(tabs)/appointments');
    } else {
      // For other types, just stay on notifications screen
    }
  };

  const markAllAsRead = async () => {
    try {
      if (user?.id) {
        await storageService.markAllNotificationsAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const ListHeader = () => (
    <View className="px-6 py-4 mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 p-2 -ml-2"
          >
            <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-text-primary">
            Notifications
          </Text>
        </View>
        
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            className="bg-primary-beige px-3 py-1.5 rounded-full"
          >
            <Text className="text-primary-dark text-sm font-medium">
              Tout marquer
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View className="bg-primary-beige/20 border border-primary-beige/50 rounded-lg p-3">
          <Text className="text-primary-beige text-sm">
            {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''} notification{unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  );

  const EmptyList = () => (
    <View className="flex-1 justify-center items-center p-6 mt-20">
      <MaterialIcons name="notifications-none" size={64} color="#D4B896" />
      <Text className="text-text-primary text-lg font-medium mt-4 mb-2">
        Aucune notification
      </Text>
      <Text className="text-text-primary/70 text-center">
        Vos notifications de rendez-vous apparaîtront ici
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-primary-dark">
        <ActivityIndicator size="large" color="#D4B896" />
        <Text className="text-text-primary text-lg mt-4">
          Chargement des notifications...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-dark">
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={<EmptyList />}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#D4B896"]}
            tintColor={"#D4B896"}
          />
        }
      />
    </SafeAreaView>
  );
}