// app/(tabs)/profile.tsx - UPDATED WITH SALON SETTINGS
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const isSalonOwner = user?.role === 'salon_owner';

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront perdues définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // Implement account deletion
            console.log('Delete account requested');
          }
        }
      ]
    );
  };

  // Updated profile menu items with salon settings
  const profileMenuItems = [
    {
      icon: 'person',
      title: 'Informations personnelles',
      subtitle: 'Modifiez vos informations de profil',
      onPress: () => router.push("/personal-info")
    },
    // Added salon settings for salon owners
    ...(isSalonOwner && user?.salonId ? [{
      icon: 'store',
      title: 'Paramètres du salon',
      subtitle: 'Modifiez les informations de votre salon',
      onPress: () => router.push('/salon-settings')
    }] : []),
    {
      icon: 'security',
      title: 'Sécurité',
      subtitle: 'Mot de passe et authentification',
      onPress: () => console.log('Security settings')
    },
    {
      icon: 'payment',
      title: 'Moyens de paiement',
      subtitle: 'Gérez vos cartes et comptes',
      onPress: () => console.log('Payment methods')
    },
    {
      icon: 'history',
      title: 'Historique',
      subtitle: isSalonOwner ? 'Historique des transactions' : 'Historique des rendez-vous',
      onPress: () => console.log('History')
    }
  ];

  const supportMenuItems = [
    {
      icon: 'help',
      title: 'Centre d\'aide',
      subtitle: 'FAQ et guides d\'utilisation',
      onPress: () => router.push('/help-center')
    },
    {
      icon: 'support-agent',
      title: 'Contacter le support',
      subtitle: 'Besoin d\'aide ? Contactez-nous',
      onPress: () => router.push('/contact-support')
    },
 
    {
      icon: 'gavel',
      title: 'Conditions d\'utilisation',
      subtitle: 'Consultez nos conditions',
      onPress: () => router.push('/terms-of-service')
    },
    {
      icon: 'privacy-tip',
      title: 'Politique de confidentialité',
      subtitle: 'Comment nous protégeons vos données',
      onPress: () => router.push('/privacy-policy')
    }
  ];

  return (
    <ScrollView className="flex-1 bg-primary-dark">
      {/* Header with Profile Info */}
      <View className="px-6 pt-16 pb-6">
        <View className="items-center mb-6">
          <View className="w-24 h-24 bg-primary-beige rounded-full items-center justify-center mb-4">
            <Text className="text-primary-dark text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-text-primary">{user?.name}</Text>
          <Text className="text-text-primary/70">{user?.email}</Text>
          <View className="bg-primary-beige/20 px-3 py-1 rounded-full mt-2">
            <Text className="text-primary-beige text-sm font-medium">
              {isSalonOwner ? 'Propriétaire de salon' : 'Client'}
            </Text>
          </View>
        </View>
      </View>

      {/* Verification Status for Salon Owners */}
      {isSalonOwner && (
        <View className="px-6 mb-6">
          <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
            <View className="flex-row items-center">
              <MaterialIcons 
                name={user?.isVerified ? "verified" : "pending"} 
                size={24} 
                color={user?.isVerified ? "#10B981" : "#F59E0B"} 
              />
              <View className="flex-1 ml-3">
                <Text className="text-text-primary font-semibold">
                  {user?.isVerified ? 'Compte vérifié' : 'Vérification en cours'}
                </Text>
                <Text className="text-text-primary/70 text-sm">
                  {user?.isVerified 
                    ? 'Votre compte professionnel est vérifié'
                    : 'Votre compte est en cours de vérification (24-48h)'
                  }
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions for Salon Owners */}
      {isSalonOwner && user?.salonId && (
        <View className="px-6 mb-6">
          <Text className="text-xl font-semibold text-text-primary mb-4">Actions rapides</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/salon')}
              className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 items-center"
            >
              <MaterialIcons name="dashboard" size={24} color="#D4B896" />
              <Text className="text-text-primary font-medium mt-2 text-center">
                Tableau de bord
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => router.push('/salon-settings')}
              className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 items-center"
            >
              <MaterialIcons name="settings" size={24} color="#D4B896" />
              <Text className="text-text-primary font-medium mt-2 text-center">
                Paramètres salon
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Notifications Settings */}
      <View className="px-6 mb-6">
        <Text className="text-xl font-semibold text-text-primary mb-4">Notifications</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl">
          <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-text-primary font-medium">Notifications push</Text>
              <Text className="text-text-primary/70 text-sm">
                Recevez des notifications sur votre téléphone
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#374151', true: '#D4B896' }}
              thumbColor={notificationsEnabled ? '#2A2A2A' : '#9CA3AF'}
            />
          </View>
          <View className="h-px bg-primary-beige/20 mx-4" />
          <View className="px-4 py-4 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-text-primary font-medium">Notifications email</Text>
              <Text className="text-text-primary/70 text-sm">
                Recevez des notifications par email
              </Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#374151', true: '#D4B896' }}
              thumbColor={emailNotifications ? '#2A2A2A' : '#9CA3AF'}
            />
          </View>
        </View>
      </View>

      {/* Profile Settings */}
      <View className="px-6 mb-6">
        <Text className="text-xl font-semibold text-text-primary mb-4">Mon compte</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl">
          {profileMenuItems.map((item, index) => (
            <View key={item.title}>
              <TouchableOpacity
                onPress={item.onPress}
                className="px-4 py-4 flex-row items-center"
              >
                <MaterialIcons name={item.icon as any} size={24} color="#D4B896" />
                <View className="flex-1 ml-4">
                  <Text className="text-text-primary font-medium">{item.title}</Text>
                  <Text className="text-text-primary/70 text-sm">{item.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#D4B896" />
              </TouchableOpacity>
              {index < profileMenuItems.length - 1 && (
                <View className="h-px bg-primary-beige/20 mx-4" />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Support & Help */}
      <View className="px-6 mb-6">
        <Text className="text-xl font-semibold text-text-primary mb-4">Support & Aide</Text>
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl">
          {supportMenuItems.map((item, index) => (
            <View key={item.title}>
              <TouchableOpacity
                onPress={item.onPress}
                className="px-4 py-4 flex-row items-center"
              >
                <MaterialIcons name={item.icon as any} size={24} color="#D4B896" />
                <View className="flex-1 ml-4">
                  <Text className="text-text-primary font-medium">{item.title}</Text>
                  <Text className="text-text-primary/70 text-sm">{item.subtitle}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#D4B896" />
              </TouchableOpacity>
              {index < supportMenuItems.length - 1 && (
                <View className="h-px bg-primary-beige/20 mx-4" />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* App Info */}
      <View className="px-6 mb-6">
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4">
          <View className="items-center">
            <Text className="text-primary-beige text-2xl font-bold mb-2">Rézaly</Text>
            <Text className="text-text-primary/70 text-sm mb-1">Version 1.0.0</Text>
            <Text className="text-text-primary/70 text-xs text-center">
              © 2024 Rézaly. Tous droits réservés.
            </Text>
          </View>
        </View>
      </View>

      {/* Danger Zone */}
      <View className="px-6 mb-8">
        <Text className="text-xl font-semibold text-text-primary mb-4">Zone de danger</Text>
        <View className="space-y-3">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-4 flex-row items-center"
          >
            <MaterialIcons name="logout" size={24} color="#EF4444" />
            <View className="flex-1 ml-4">
              <Text className="text-red-500 font-medium">Se déconnecter</Text>
              <Text className="text-red-500/70 text-sm">Vous devrez vous reconnecter</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-4 flex-row items-center"
          >
            <MaterialIcons name="delete-forever" size={24} color="#EF4444" />
            <View className="flex-1 ml-4">
              <Text className="text-red-500 font-medium">Supprimer le compte</Text>
              <Text className="text-red-500/70 text-sm">Action irréversible</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Padding */}
      <View className="h-20" />
    </ScrollView>
  );
}