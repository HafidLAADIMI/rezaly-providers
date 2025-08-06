// contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (userData: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const unsubscribe = authService.onAuthStateChanged(async (userData) => {
      console.log('Auth state changed:', userData?.email || 'No user');
      
      if (mounted) {
        setUser(userData);
        setIsInitialized(true);
        
        // Setup notifications for authenticated users
     //   if (userData) {
       //   try {
         //   await notificationService.requestPermissions();
           // await notificationService.savePushToken(userData.id);
          //} catch (error) {
            //console.log('Notification setup failed:', error);
          //}
        //}
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    console.log('Attempting sign in for:', email);
    
    try {
      const result = await authService.signIn(email, password);
      console.log('Sign in result:', result.success ? 'Success' : `Failed: ${result.error}`);
      
      if (result.success && result.data) {
        setUser(result.data);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: result.error || 'Échec de la connexion'
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: 'Erreur de connexion. Vérifiez votre connexion internet.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData: any) => {
    setIsLoading(true);
    console.log('Attempting sign up for:', userData.email);
    
    try {
      const result = await authService.signUp(userData);
      console.log('Sign up result:', result.success ? 'Success' : `Failed: ${result.error}`);
      
      if (result.success && result.data) {
        setUser(result.data);
        return { success: true };
      }
      
      return { 
        success: false, 
        error: result.error || 'Échec de la création du compte'
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { 
        success: false, 
        error: 'Erreur lors de la création du compte.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isInitialized,
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}