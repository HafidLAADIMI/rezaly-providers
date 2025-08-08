// app/privacy-policy.tsx - SIMPLE VERSION
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-primary-dark">
      {/* Header */}
      <View className="flex-row items-center p-4 pt-16">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary ml-4">Confidentialité</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 mb-6 items-center">
          <MaterialIcons name="shield" size={32} color="#D4B896" />
          <Text className="text-text-primary font-semibold text-lg mt-2">Vos données sont protégées</Text>
          <Text className="text-text-primary/70 text-center text-sm mt-1">
            Nous respectons votre vie privée
          </Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">Quelles données collectons-nous ?</Text>
            <Text className="text-text-primary/80 leading-6">
              • Nom, email, téléphone{'\n'}
              • Historique de réservations{'\n'}
              • Localisation (si autorisée){'\n'}
              • Avis et commentaires
            </Text>
          </View>

          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">Comment les utilisons-nous ?</Text>
            <Text className="text-text-primary/80 leading-6">
              • Pour vos réservations{'\n'}
              • Pour améliorer nos services{'\n'}
              • Pour vous envoyer des notifications{'\n'}
              • Pour la sécurité de l'app
            </Text>
          </View>

          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">Partage des données</Text>
            <Text className="text-text-primary/80 leading-6">
              Nous partageons vos infos avec les salons uniquement pour vos réservations. 
              Nous ne vendons jamais vos données.
            </Text>
          </View>

          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">Vos droits</Text>
            <Text className="text-text-primary/80 leading-6">
              • Accéder à vos données{'\n'}
              • Corriger vos informations{'\n'}
              • Supprimer votre compte{'\n'}
              • Retirer votre consentement
            </Text>
          </View>

          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">Sécurité</Text>
            <Text className="text-text-primary/80 leading-6">
              Nous utilisons le chiffrement et des mesures de sécurité pour protéger vos données.
            </Text>
          </View>

          <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-4">
            <Text className="text-primary-beige font-medium mb-2">Questions sur vos données ?</Text>
            <Text className="text-text-primary/80 text-sm mb-3">
              Contactez-nous pour toute question sur vos données personnelles.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/contact-support')}
              className="bg-primary-beige py-2 px-4 rounded-lg"
            >
              <Text className="text-primary-dark font-medium text-center">Nous contacter</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}