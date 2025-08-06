// app/(auth)/register.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    const { name, email, phone, password, confirmPassword } = formData;

    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
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
    const result = await signUp({
      name,
      email,
      phone,
      password,
      role: 'client'
    });
    setIsLoading(false);

    if (!result.success) {
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
          <Text className="text-3xl font-bold text-primary-beige mb-2">Créer un compte</Text>
          <Text className="text-text-primary text-center">Rejoignez Rézaly en tant que client</Text>
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
            <Text className="text-text-primary mb-2 font-medium">Email</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4 flex-row items-center">
              <MaterialIcons name="email" size={20} color="#D4B896" />
              <TextInput
                className="flex-1 ml-3 text-text-primary"
                placeholder="votre@email.com"
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
                placeholder="+212 6XX XXX XXX"
                placeholderTextColor="#F5F5F5/60"
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
              />
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

          {/* Register Button */}
          <TouchableOpacity
            className={`bg-primary-beige rounded-xl py-4 mt-6 ${isLoading ? 'opacity-50' : ''}`}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text className="text-primary-dark text-center font-semibold text-lg">
              {isLoading ? 'Création...' : 'Créer mon compte'}
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