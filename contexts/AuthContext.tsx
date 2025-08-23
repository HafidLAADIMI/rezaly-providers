// contexts/AuthContext.tsx - Salon Owner App - Only persist salon owners
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (userData: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    
    // Set up the Firebase auth state listener
    const unsubscribe = authService.onAuthStateChanged(async (userData) => {
      console.log('AuthProvider: Auth state changed:', userData?.email || 'No user', 'Role:', userData?.role);
      
      // SALON OWNER APP: Only allow salon owners to persist
      if (userData) {
        if (userData.role === 'salon_owner') {
          console.log('AuthProvider: Salon owner authenticated - allowing session');
          setUser(userData);
        } else {
          console.log('AuthProvider: Non-salon owner detected - signing out automatically');
          // Automatically sign out users who aren't salon owners
          await authService.signOut();
          setUser(null);
        }
      } else {
        console.log('AuthProvider: No user authenticated');
        setUser(null);
      }
      
      // Mark as initialized on first auth state change
      if (!isInitialized) {
        setIsInitialized(true);
        console.log('AuthProvider: Auth initialized');
      }
      
      // Stop loading once we get the first auth state
      setIsLoading(false);
    });

    // Cleanup function
    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      unsubscribe();
    };
  }, [isInitialized]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('AuthProvider: Attempting sign in for:', email);
      
      const result = await authService.signIn(email, password);
      
      if (result.success && result.data) {
        console.log('AuthProvider: Sign in successful, checking role...');
        
        // Check if user is a salon owner
        if (result.data.role !== 'salon_owner') {
          console.log('AuthProvider: User is not a salon owner, signing out');
          await authService.signOut();
          setIsLoading(false);
          return { 
            success: false, 
            error: 'Cette application est réservée aux propriétaires de salon. Veuillez utiliser l\'application client.' 
          };
        }
        
        console.log('AuthProvider: Salon owner sign in successful');
        // Don't manually setUser here - let the auth state listener handle it
        return { success: true };
      } else {
        console.error('AuthProvider: Sign in failed:', result.error);
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('AuthProvider signIn error:', error);
      setIsLoading(false);
      return { success: false, error: 'Erreur de connexion' };
    }
  };

  const signUp = async (userData: any) => {
    try {
      setIsLoading(true);
      console.log('AuthProvider: Attempting sign up for:', userData.email);
      
      // Ensure we're only allowing salon owner signups
      if (userData.role !== 'salon_owner') {
        setIsLoading(false);
        return { 
          success: false, 
          error: 'Cette application est réservée aux propriétaires de salon.' 
        };
      }
      
      const result = await authService.signUp(userData);
      
      if (result.success && result.data) {
        console.log('AuthProvider: Sign up successful');
        // Don't manually setUser here - let the auth state listener handle it
        return { success: true };
      } else {
        console.error('AuthProvider: Sign up failed:', result.error);
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.error('AuthProvider signUp error:', error);
      setIsLoading(false);
      return { success: false, error: 'Erreur lors de l\'inscription' };
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log('AuthProvider: Signing out user');
      
      await authService.signOut();
      // Don't manually setUser(null) here - auth listener will handle it
      
      console.log('AuthProvider: Sign out successful');
    } catch (error) {
      console.error('AuthProvider signOut error:', error);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      console.log('AuthProvider: Refreshing user data');
      
      if (user?.id) {
        const userData = await authService.getUserData(user.id);
        if (userData) {
          // Double-check role after refresh
          if (userData.role === 'salon_owner') {
            console.log('AuthProvider: User data refreshed successfully');
            setUser(userData);
          } else {
            console.log('AuthProvider: User role changed to non-salon owner, signing out');
            await authService.signOut();
          }
        } else {
          console.log('AuthProvider: No user data found during refresh');
        }
      } else {
        console.log('AuthProvider: No user ID available for refresh');
      }
    } catch (error) {
      console.error('AuthProvider refreshUser error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    refreshUser,
  };

  // Debug logging for state changes
  useEffect(() => {
    console.log('AuthProvider state:', {
      hasUser: !!user,
      userEmail: user?.email,
      userRole: user?.role,
      isLoading,
      isInitialized
    });
  }, [user, isLoading, isInitialized]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}