// app/(tabs)/_layout.tsx - SIMPLE VERIFICATION CHECK
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { salonOwnerService } from '../../services/salonOwnerService';
import { useFocusEffect } from '@react-navigation/native';

// Debug import
console.log('About to import storageService...');
import { storageService } from '../../services/storageService';
console.log('StorageService imported:', storageService);
console.log('StorageService methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(storageService)));

interface TabBarIconProps {
  name: any;
  color: string;
  size: number;
  badgeCount?: number;
}

function TabBarIcon({ name, color, size, badgeCount }: TabBarIconProps) {
  return (
    <View style={{ position: 'relative' }}>
      <MaterialIcons name={name} size={size} color={color} />
      {typeof badgeCount === 'number' && badgeCount > 0 && (
        <View style={{
          position: 'absolute',
          top: -4,
          right: -4,
          backgroundColor: '#EF4444',
          borderRadius: 9,
          minWidth: 18,
          height: 18,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold'
          }}>
            {badgeCount > 99 ? '99+' : badgeCount.toString()}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [salon, setSalon] = useState(null);
  
  const isSalonOwner = user?.role === 'salon_owner';
  const hasSalon = !!user?.salonId;

  console.log('TabLayout: User role:', user?.role, 'isSalonOwner:', isSalonOwner, 'hasSalon:', hasSalon);

  // Check salon verification status (same as dashboard)
  const checkSalonStatus = useCallback(async () => {
    if (isSalonOwner && hasSalon) {
      try {
        const userSalons = await salonOwnerService.getUserSalons(user.id);
        if (userSalons.length > 0) {
          setSalon(userSalons[0]);
        }
      } catch (error) {
        console.error('Error loading salon:', error);
      }
    }
  }, [isSalonOwner, hasSalon, user?.id]);

  // Load unread notifications count
  const loadUnreadCount = useCallback(async () => {
    console.log('loadUnreadCount called with user:', user?.id);
    console.log('storageService in loadUnreadCount:', storageService);
    console.log('storageService.getUnreadNotificationsCount:', storageService?.getUnreadNotificationsCount);
    
    if (user?.id && storageService && typeof storageService.getUnreadNotificationsCount === 'function') {
      try {
        const count = await storageService.getUnreadNotificationsCount(user.id);
        setUnreadCount(count);
        console.log('Unread notifications count loaded:', count);
      } catch (error) {
        console.error('Error loading unread count:', error);
        setUnreadCount(0);
      }
    } else {
      console.log('Cannot load unread count:', {
        hasUserId: !!user?.id,
        hasStorageService: !!storageService,
        hasMethod: !!(storageService && typeof storageService.getUnreadNotificationsCount === 'function')
      });
      setUnreadCount(0);
    }
  }, [user?.id]);

  // Reload data when tab layout is focused
  useFocusEffect(
    useCallback(() => {
      checkSalonStatus();
      loadUnreadCount();
    }, [checkSalonStatus, loadUnreadCount])
  );

  useEffect(() => {
    checkSalonStatus();
    loadUnreadCount();
  }, [checkSalonStatus, loadUnreadCount]);

  // Simple verification check - same logic as dashboard
  const isVerifiedSalonOwner = isSalonOwner && hasSalon && salon && salon.isActive && salon.isVerified !== false;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#D4B896',
        tabBarInactiveTintColor: '#F5F5F5',
        tabBarStyle: {
          backgroundColor: '#2A2A2A',
          borderTopColor: '#D4B896',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon 
              name="event" 
              color={color} 
              size={size} 
              badgeCount={unreadCount}
            />
          ),
        }}
      />
      {/* Hide salon tab until verified */}
      <Tabs.Screen
        name="salon"
        options={{
          title: 'Mon Salon',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="store" color={color} size={size} />
          ),
          href: isVerifiedSalonOwner ? '/(tabs)/salon' : null,
        }}
      />
      {/* Hide analytics tab until verified */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Statistiques',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="analytics" color={color} size={size} />
          ),
          href: isVerifiedSalonOwner ? '/(tabs)/analytics' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}