// app/(auth)/salon-register.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { authService } from '../../services/authService';

export default function SalonRegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [documents, setDocuments] = useState({
    businessLicense: null as any,
    idDocument: null as any
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDocumentPick = async (type: 'businessLicense' | 'idDocument') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [type]: result.assets[0]
        }));
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sélectionner le document');
    }
  };

  const handleRegister = async () => {
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!documents.businessLicense || !documents.idDocument) {
      Alert.alert('Erreur', 'Veuillez fournir tous les documents requis');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    
    // In a real app, you would upload documents to Firebase Storage first
    const result = await authService.signUpSalonOwner({
      name,
      email,
      phone,
      password,
      role: 'salon_owner',
      businessLicense: documents.businessLicense.uri,
      idDocument: documents.idDocument.uri
    });
    
    setIsLoading(false);

    if (result.success) {
      Alert.alert(
        'Compte créé avec succès',
        'Votre compte sera vérifié sous 24-48h. Vous recevrez une notification une fois approuvé.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
      );
    } else {
      Alert.alert('Erreur d\'inscription', result.error);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-primary-dark"
    >
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="items-center mt-16 mb-8">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute left-0 top-2"
          >
            <MaterialIcons name="arrow-back" size={24} color="#D4B896" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-primary-beige mb-2">Compte Professionnel</Text>
          <Text className="text-text-primary text-center">Rejoignez Rézaly en tant que salon</Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          {/* Name Input */}
          <View>
            <Text className="text-text-primary mb-2 font-medium">Nom complet</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4 flex-row items-center">
              <MaterialIcons name="person" size={20} color="#D4B896" />
              <TextInput
                className="flex-1 ml-3 text-text-primary"
                placeholder="Votre nom complet"
                placeholderTextColor="#F5F5F5/60"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
              />
            </View>
          </View>

          {/* Email Input */}
          <View>
            <Text className="text-text-primary mb-2 font-medium">Email professionnel</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4 flex-row items-center">
              <MaterialIcons name="email" size={20} color="#D4B896" />
              <TextInput
                className="flex-1 ml-3 text-text-primary"
                placeholder="salon@example.com"
                placeholderTextColor="#F5F5F5/60"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone Input */}
          <View>
            <Text className="text-text-primary mb-2 font-medium">Téléphone</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4 flex-row items-center">
              <MaterialIcons name="phone" size={20} color="#D4B896" />
              <TextInput
                className="flex-1 ml-3 text-text-primary"
                placeholder="+212 5XX XXX XXX"
                placeholderTextColor="#F5F5F5/60"
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Documents Section */}
          <View className="mt-6">
            <Text className="text-text-primary mb-4 font-medium text-lg">Documents requis</Text>
            
            {/* Business License */}
            <View className="mb-4">
              <Text className="text-text-primary mb-2 font-medium">Licence commerciale</Text>
              <TouchableOpacity
                onPress={() => handleDocumentPick('businessLicense')}
                className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4 flex-row items-center"
              >
                <MaterialIcons name="business" size={20} color="#D4B896" />
                <Text className="flex-1 ml-3 text-text-primary">
                  {documents.businessLicense 
                    ? documents.businessLicense.name 
                    : 'Sélectionner la licence commerciale'}
                </Text>
                <MaterialIcons name="upload-file" size={20} color="#D4B896" />
              </TouchableOpacity>
            </View>

            {/* ID Document */}
            <View className="mb-4">
              <Text className="text-text-primary mb-2 font-medium">Pièce d'identité</Text>
              <TouchableOpacity
                onPress={() => handleDocumentPick('idDocument')}
                className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4 flex-row items-center"
              >
                <MaterialIcons name="badge" size={20} color="#D4B896" />
                <Text className="flex-1 ml-3 text-text-primary">
                  {documents.idDocument 
                    ? documents.idDocument.name 
                    : 'Sélectionner la pièce d\'identité'}
                </Text>
                <MaterialIcons name="upload-file" size={20} color="#D4B896" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-text-primary mb-2 font-medium">Mot de passe</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4 flex-row items-center">
              <MaterialIcons name="lock" size={20} color="#D4B896" />
              <TextInput
                className="flex-1 ml-3 text-text-primary"
                placeholder="••••••••"
                placeholderTextColor="#F5F5F5/60"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#D4B896" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View>
            <Text className="text-text-primary mb-2 font-medium">Confirmer le mot de passe</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4 flex-row items-center">
              <MaterialIcons name="lock" size={20} color="#D4B896" />
              <TextInput
                className="flex-1 ml-3 text-text-primary"
                placeholder="••••••••"
                placeholderTextColor="#F5F5F5/60"
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showPassword}
              />
            </View>
          </View>

          {/* Info Box */}
          <View className="bg-primary-beige/10 border border-primary-beige/30 rounded-xl p-4 mt-4">
            <Text className="text-primary-beige text-sm">
              📋 Votre compte sera vérifié par notre équipe dans les 24-48h. 
              Vous recevrez une notification une fois votre compte approuvé.
            </Text>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            className={`bg-primary-beige rounded-xl py-4 mt-6 ${isLoading ? 'opacity-50' : ''}`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-primary-dark text-center font-semibold text-lg">
              {isLoading ? 'Création...' : 'Créer mon compte professionnel'}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/login')}
            className="mt-6 mb-8"
          >
            <Text className="text-primary-beige text-center">
              Déjà un compte ? <Text className="font-semibold">Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}