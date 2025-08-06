// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  const isSalonOwner = user?.role === 'salon_owner';

  console.log('TabLayout: User role:', user?.role, 'isSalonOwner:', isSalonOwner);

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
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Rendez-vous',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="event" size={size} color={color} />
          ),
        }}
      />

      {/* Always render salon screen, but hide if not salon owner */}
      <Tabs.Screen
        name="salon"
        options={{
          title: 'Mon Salon',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="store" size={size} color={color} />
          ),
          href: isSalonOwner ? '/(tabs)/salon' : null, // Hide tab if not salon owner
        }}
      />
      
      {/* Always render analytics screen, but hide if not salon owner */}
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Statistiques',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="analytics" size={size} color={color} />
          ),
          href: isSalonOwner ? '/(tabs)/analytics' : null, // Hide tab if not salon owner
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}