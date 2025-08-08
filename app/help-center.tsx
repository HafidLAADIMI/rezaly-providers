// app/help-center.tsx - SIMPLE VERSION
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const faqData = [
  {
    question: 'Comment réserver un rendez-vous ?',
    answer: 'Recherchez un salon, choisissez vos services, sélectionnez une date et confirmez.'
  },
  {
    question: 'Puis-je annuler mon rendez-vous ?',
    answer: 'Oui, dans "Mes rendez-vous", appuyez sur "Annuler" sur votre réservation.'
  },
  {
    question: 'Comment contacter un salon ?',
    answer: 'Sur la page du salon, appuyez sur "Appeler" ou trouvez ses coordonnées.'
  },
  {
    question: 'Les prix sont-ils définitifs ?',
    answer: 'Les prix peuvent varier. Confirmez avec le salon avant votre visite.'
  },
  {
    question: 'Comment laisser un avis ?',
    answer: 'Après votre visite, allez sur la page du salon et appuyez sur "Laisser un avis".'
  }
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState(-1);

  return (
    <View className="flex-1 bg-primary-dark">
      {/* Header */}
      <View className="flex-row items-center p-4 pt-16">
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-text-primary ml-4">Centre d'aide</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Quick Contact */}
        <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl p-4 mb-6">
          <Text className="text-text-primary font-semibold mb-3">Besoin d'aide ?</Text>
          <TouchableOpacity
            onPress={() => router.push('/contact-support')}
            className="bg-primary-beige py-3 rounded-lg"
          >
            <Text className="text-primary-dark text-center font-medium">Contactez-nous</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text className="text-text-primary font-semibold text-lg mb-4">Questions fréquentes</Text>
        
        {faqData.map((item, index) => (
          <View key={index} className="bg-primary-light/10 border border-primary-beige/30 rounded-xl mb-3 overflow-hidden">
            <TouchableOpacity
              onPress={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
              className="p-4 flex-row items-center justify-between"
            >
              <Text className="text-text-primary font-medium flex-1">{item.question}</Text>
              <MaterialIcons 
                name={expandedIndex === index ? "expand-less" : "expand-more"} 
                size={24} 
                color="#D4B896" 
              />
            </TouchableOpacity>
            {expandedIndex === index && (
              <View className="px-4 pb-4 border-t border-primary-beige/20">
                <Text className="text-text-primary/80 mt-3">{item.answer}</Text>
              </View>
            )}
          </View>
        ))}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}