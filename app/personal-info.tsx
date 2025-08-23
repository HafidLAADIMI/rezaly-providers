// app/personal-info.tsx - SIMPLE VERSION
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, updateUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('Erreur', 'L\'email est requis');
      return;
    }

    setIsSaving(true);
    try {
      // Simulate API call - replace with your actual update function
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Succès', 'Informations mises à jour', [
        { text: 'OK', onPress: () => setIsEditing(false) }
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
  };

  return (
    <View className="flex-1 bg-primary-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 pt-16">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-text-primary ml-4">Informations personnelles</Text>
        </View>
        
        {!isEditing && (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            className="bg-primary-beige/20 px-3 py-2 rounded-lg"
          >
            <Text className="text-primary-beige font-medium">Modifier</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Profile Photo */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-primary-beige rounded-full items-center justify-center mb-4">
            <Text className="text-primary-dark text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>

        </View>

        {/* Form Fields */}
        <View className="space-y-4">
          {/* Name */}
          <View>
            <Text className="text-text-primary font-medium mb-2">Nom complet</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                className="text-text-primary"
                placeholder="Votre nom"
                placeholderTextColor="rgba(245, 245, 245, 0.6)"
                editable={isEditing}
              />
            </View>
          </View>

          {/* Email */}
          <View>
            <Text className="text-text-primary font-medium mb-2">Email</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                className="text-text-primary"
                placeholder="votre@email.com"
                placeholderTextColor="rgba(245, 245, 245, 0.6)"
                keyboardType="email-address"
                editable={isEditing}
              />
            </View>
          </View>

          {/* Phone */}
          <View>
            <Text className="text-text-primary font-medium mb-2">Téléphone</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4">
              <TextInput
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                className="text-text-primary"
                placeholder="+212 6XX XXX XXX"
                placeholderTextColor="rgba(245, 245, 245, 0.6)"
                keyboardType="phone-pad"
                editable={isEditing}
              />
            </View>
          </View>

          {/* Role Badge */}
          <View>
            <Text className="text-text-primary font-medium mb-2">Type de compte</Text>
            <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl px-4 py-4">
              <Text className="text-primary-beige font-medium">
                {user?.role === 'salon_owner' ? 'Propriétaire de salon' : 'Client'}
              </Text>
            </View>
          </View>

          {/* Actions */}
          {isEditing && (
            <View className="flex-row gap-3 mt-8">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 bg-primary-light/10 border border-primary-beige/30 rounded-xl py-4"
              >
                <Text className="text-text-primary text-center font-medium">Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                className={`flex-1 bg-primary-beige rounded-xl py-4 ${isSaving ? 'opacity-50' : ''}`}
              >
                {isSaving ? (
                  <ActivityIndicator color="#2A2A2A" />
                ) : (
                  <Text className="text-primary-dark text-center font-medium">Sauvegarder</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>    

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}