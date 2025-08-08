// app/contact-support.tsx - SIMPLE VERSION
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ContactScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [message, setMessage] = useState('');

  const handleCall = () => {
    Alert.alert(
      'Appeler le support',
      'Voulez-vous appeler notre équipe ?',
      [
        { text: 'Annuler' },
        { text: 'Appeler', onPress: () => Linking.openURL('tel:+212522000000') }
      ]
    );
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@rezaly.com?subject=Support Rézaly');
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire votre message');
      return;
    }

    Alert.alert(
      'Message envoyé !',
      'Nous vous répondrons rapidement par email.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <View className="flex-1 bg-primary-dark">
      {/* Header */}
      <View className="flex-row items-center p-4 pt-16">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary ml-4">Nous contacter</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Contact Methods */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity
            onPress={handleCall}
            className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 items-center"
          >
            <MaterialIcons name="call" size={32} color="#D4B896" />
            <Text className="text-text-primary font-medium mt-2">Téléphone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEmail}
            className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 items-center"
          >
            <MaterialIcons name="email" size={32} color="#D4B896" />
            <Text className="text-text-primary font-medium mt-2">Email</Text>
          </TouchableOpacity>
        </View>

        {/* Message Form */}
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 mb-6">
          <Text className="text-text-primary font-semibold mb-4">Envoyer un message</Text>
          
          {user && (
            <View className="bg-primary-dark/50 rounded-lg p-3 mb-4">
              <Text className="text-text-primary/70 text-sm">De: {user.name}</Text>
              <Text className="text-text-primary/70 text-sm">{user.email}</Text>
            </View>
          )}

          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Décrivez votre problème..."
            placeholderTextColor="rgba(245, 245, 245, 0.6)"
            multiline
            numberOfLines={6}
            className="bg-primary-dark/50 rounded-lg p-3 text-text-primary mb-4"
            style={{ minHeight: 120 }}
          />

          <TouchableOpacity
            onPress={handleSendMessage}
            className="bg-primary-beige py-3 rounded-lg"
          >
            <Text className="text-primary-dark text-center font-medium">Envoyer</Text>
          </TouchableOpacity>
        </View>

        {/* Support Hours */}
        <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-4">
          <Text className="text-primary-beige font-medium mb-2">Heures de support</Text>
          <Text className="text-text-primary/70 text-sm">
            Lundi - Vendredi: 9h - 18h{'\n'}
            Samedi: 9h - 16h{'\n'}
            Dimanche: Fermé
          </Text>
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}