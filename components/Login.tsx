// app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    const result = await signIn(email, password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert('Erreur de connexion', result.error);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-primary-dark"
    >
      <View className="flex-1 px-6 justify-center">
        {/* Logo */}
        <View className="items-center mb-12">
          <Text className="text-5xl font-bold text-primary-beige mb-2">Rézaly</Text>
          <Text className="text-text-primary text-lg">Connectez-vous à votre compte</Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          {/* Email Input */}
          <View>
            <Text className="text-text-primary mb-2 font-medium">Email</Text>
            <View className="bg-primary-light/10 border border-primary-beige/30 rounded-xl px-4 py-4 flex-row items-center">
              <MaterialIcons name="email" size={20} color="#D4B896" />
              <TextInput
                className="flex-1 ml-3 text-text-primary"
                placeholder="votre@email.com"
                placeholderTextColor="#F5F5F5/60"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
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
                value={password}
                onChangeText={setPassword}
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

          {/* Login Button */}
          <TouchableOpacity
            className={`bg-primary-beige rounded-xl py-4 mt-6 ${isLoading ? 'opacity-50' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text className="text-primary-dark text-center font-semibold text-lg">
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          {/* Register Links */}
          <View className="mt-8 space-y-4">
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text className="text-primary-beige text-center">
                Pas de compte ? <Text className="font-semibold">Créer un compte client</Text>
              </Text>
            </TouchableOpacity>
            
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-primary-beige/30" />
              <Text className="mx-4 text-text-primary">ou</Text>
              <View className="flex-1 h-px bg-primary-beige/30" />
            </View>

            <TouchableOpacity onPress={() => router.push('/(auth)/salon-register')}>
              <Text className="text-primary-beige text-center">
                Professionnel ? <Text className="font-semibold">Créer un compte salon</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}