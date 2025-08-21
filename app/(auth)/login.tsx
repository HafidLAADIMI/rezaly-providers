// app/(auth)/login.tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const { signIn, isLoading, user } = useAuth();
  const router = useRouter();

  // Navigate to dashboard when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('LoginScreen: User authenticated, navigating to dashboard');
      router.replace('/(tabs)/dashboard');
    }
  }, [user, router]);

  // Clear errors when user types
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!password) {
      newErrors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      newErrors.password = 'Minimum 6 caractères';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    console.log('Login button pressed');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Attempting login for:', email);
    
    try {
      const result = await signIn(email.trim(), password);
      console.log('Login result:', result.success ? 'Success' : `Failed: ${result.error}`);
      
      if (!result.success) {
        Alert.alert('Erreur de connexion', result.error || 'Une erreur s\'est produite');
      } else {
        console.log('Login successful, user should be set in context');
        // Navigation will happen automatically via useEffect when user state updates
      }
    } catch (error) {
      console.error('Login catch error:', error);
      Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
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
            <View className={`bg-primary-light/10 border rounded-xl px-4 py-4 flex-row items-center ${
              errors.email ? 'border-red-500' : 'border-primary-beige/30'
            }`}>
              <MaterialIcons name="email" size={20} color="#D4B896" />
              <TextInput
                className="flex-1 ml-3 text-text-primary"
                placeholder="votre@email.com"
                placeholderTextColor="rgba(245, 245, 245, 0.6)"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>
            {errors.email && (
              <Text className="text-red-500 text-sm mt-1 ml-2">{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-text-primary mb-2 font-medium">Mot de passe</Text>
            <View className={`bg-primary-light/10 border rounded-xl px-4 py-4 flex-row items-center ${
              errors.password ? 'border-red-500' : 'border-primary-beige/30'
            }`}>
              <MaterialIcons name="lock" size={20} color="#D4B896" />
              <TextInput
                className="flex-1 ml-3 text-text-primary"
                placeholder="••••••••"
                placeholderTextColor="rgba(245, 245, 245, 0.6)"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                <MaterialIcons 
                  name={showPassword ? "visibility" : "visibility-off"} 
                  size={20} 
                  color="#D4B896" 
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1 ml-2">{errors.password}</Text>
            )}
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

          {/* Success Indicator */}
          {user && (
            <View className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <Text className="text-green-500 text-sm text-center font-medium">
                ✅ Connexion réussie! Redirection en cours...
              </Text>
            </View>
          )}

          {/* Test Account Info */}
          <View className="mt-4 p-3 bg-primary-beige/10 rounded-xl">
            <Text className="text-primary-beige text-sm text-center font-medium mb-1">
              🎉 Connexion réussie!
            </Text>
            <Text className="text-text-primary/70 text-xs text-center">
              Votre compte "{user?.name || 'hafido'}" est connecté
            </Text>
          </View>

          {/* Register Links */}
          <View className="mt-8 space-y-4">
            {/* <TouchableOpacity 
              onPress={() => router.push('/(auth)/register')}
              disabled={isLoading}
            >
              <Text className="text-primary-beige text-center">
                Pas de compte ? <Text className="font-semibold">Créer un compte client</Text>
              </Text>
            </TouchableOpacity> */}
            
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-primary-beige/30" />
              <Text className="mx-4 text-text-primary">ou</Text>
              <View className="flex-1 h-px bg-primary-beige/30" />
            </View>

            <TouchableOpacity 
              onPress={() => router.push('/(auth)/salon-register')}
              disabled={isLoading}
            >
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