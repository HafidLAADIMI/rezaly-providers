// app/terms-of-service.tsx - SIMPLE VERSION
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-primary-dark">
      {/* Header */}
      <View className="flex-row items-center p-4 pt-16">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary ml-4">Conditions d'utilisation</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 mb-6">
          <Text className="text-primary-beige text-xl font-bold text-center mb-2">Rézaly</Text>
          <Text className="text-text-primary/70 text-center text-sm">
            Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
          </Text>
        </View>

        <View className="space-y-6">
          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">1. Utilisation du service</Text>
            <Text className="text-text-primary/80 leading-6">
              En utilisant Rézaly, vous acceptez nos conditions. Notre app vous permet de réserver 
              des rendez-vous dans des salons de beauté au Maroc.
            </Text>
          </View>

          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">2. Votre compte</Text>
            <Text className="text-text-primary/80 leading-6">
              Vous êtes responsable de vos informations de connexion et de l'activité sur votre compte.
            </Text>
          </View>

          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">3. Réservations</Text>
            <Text className="text-text-primary/80 leading-6">
              Les réservations sont soumises aux politiques de chaque salon. Nous recommandons 
              de respecter vos rendez-vous ou de les annuler à temps.
            </Text>
          </View>

          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">4. Paiements</Text>
            <Text className="text-text-primary/80 leading-6">
              Les paiements s'effectuent directement avec le salon. Les prix peuvent varier.
            </Text>
          </View>

          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">5. Responsabilité</Text>
            <Text className="text-text-primary/80 leading-6">
              Rézaly facilite la mise en relation. Nous ne sommes pas responsables de la qualité 
              des services fournis par les salons.
            </Text>
          </View>

          <View>
            <Text className="text-text-primary font-semibold text-lg mb-3">6. Modifications</Text>
            <Text className="text-text-primary/80 leading-6">
              Nous pouvons modifier ces conditions. Les changements seront communiqués via l'app.
            </Text>
          </View>

          <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-4">
            <Text className="text-primary-beige font-medium mb-2">Contact</Text>
            <Text className="text-text-primary/80 text-sm">
              Questions ? Contactez-nous:{'\n'}
              Email: legal@rezaly.com{'\n'}
              Téléphone: +212 522 000 000
            </Text>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}