// app/(tabs)/_layout.tsx - FIXED VERSION
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { salonOwnerService } from '../../services/salonOwnerService';
import { useFocusEffect } from '@react-navigation/native';

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
  const [salon, setSalon] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCheckingSalon, setIsCheckingSalon] = useState(true);
  
  const isSalonOwner = user?.role === 'salon_owner';
  
  // Fixed: Check if user has salon by either having salonId OR by checking salon state
  const hasSalon = !!user?.salonId || !!salon;

  // Check salon status - ENHANCED
  const checkSalonStatus = useCallback(async () => {
    if (!isSalonOwner || !user?.id) {
      setIsCheckingSalon(false);
      return;
    }

    try {
      setIsCheckingSalon(true);
      console.log('TabLayout: Checking salon status for user:', user.id);
      
      const userSalons = await salonOwnerService.getUserSalons(user.id);
      console.log('TabLayout: Found salons:', userSalons.length);
      
      if (userSalons.length > 0) {
        const userSalon = userSalons[0];
        setSalon(userSalon);
        console.log('TabLayout: Salon status - Active:', userSalon.isActive, 'Verified:', userSalon.isVerified);
      } else {
        setSalon(null);
        console.log('TabLayout: No salon found');
      }
    } catch (error) {
      console.error('TabLayout: Error loading salon:', error);
    } finally {
      setIsCheckingSalon(false);
    }
  }, [isSalonOwner, user?.id]);

  useFocusEffect(
    useCallback(() => {
      checkSalonStatus();
    }, [checkSalonStatus])
  );

  useEffect(() => {
    checkSalonStatus();
  }, [checkSalonStatus]);

  // Determine what to show based on verification status - FIXED LOGIC
  const isVerifiedSalonOwner = isSalonOwner && hasSalon && salon?.isActive && salon?.isVerified !== false;
  const canSeeNotifications = isVerifiedSalonOwner || !isSalonOwner;

  // For salon owners without salon or with unverified salon, only show dashboard and profile
  const showRestrictedTabs = isSalonOwner && (!hasSalon || !isVerifiedSalonOwner);

  console.log('TabLayout: Tab visibility logic:', {
    isSalonOwner,
    hasSalon,
    salonActive: salon?.isActive,
    salonVerified: salon?.isVerified,
    isVerifiedSalonOwner,
    showRestrictedTabs,
    canSeeNotifications
  });

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
      
      {/* Only show appointments tab if verified or client */}
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon 
              name="event" 
              color={color} 
              size={size} 
              badgeCount={canSeeNotifications ? unreadCount : 0}
            />
          ),
          // Hide for unverified salon owners
          href: showRestrictedTabs ? null : '/(tabs)/appointments',
        }}
      />
      
      {/* Only show salon tab if verified salon owner */}
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
      
      {/* Only show analytics tab if verified salon owner */}
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
      
      {/* Profile is always visible */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person" color={color} size={size} />
          ),
          href: isVerifiedSalonOwner ? '/(tabs)/profile' : null,
        }}
      />
    </Tabs>
  );
}