// services/authService.ts - Fixed version
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
  onAuthStateChanged,
  updateProfile,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, SalonOwner, ServiceResponse } from '../types';

interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: 'client' | 'salon_owner';
}

interface SalonOwnerSignUpData extends SignUpData {
  businessLicense: string;
  idDocument: string;
}

class AuthService {
  private currentUser: User | null = null;

  // Get user-friendly error message
  private getErrorMessage(error: AuthError): string {
    console.log('Firebase Auth Error:', error.code, error.message);
    
    switch (error.code) {
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cette adresse email.';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect.';
      case 'auth/invalid-email':
        return 'Adresse email invalide.';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Réessayez plus tard.';
      case 'auth/network-request-failed':
        return 'Erreur de réseau. Vérifiez votre connexion internet.';
      case 'auth/email-already-in-use':
        return 'Cette adresse email est déjà utilisée.';
      case 'auth/weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      case 'auth/invalid-credential':
        return 'Email ou mot de passe incorrect.';
      default:
        return error.message || 'Une erreur s\'est produite.';
    }
  }

  // Sign up user - FIXED with proper error handling
  async signUp(userData: SignUpData): Promise<ServiceResponse<User>> {
    try {
      const { email, password, name, phone, role } = userData;
      
      console.log('Creating user account for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Check if firebaseUser exists before accessing properties
      if (!firebaseUser) {
        throw new Error('Failed to create user account');
      }

      console.log('Firebase user created, updating profile...');
      await updateProfile(firebaseUser, { displayName: name });

      const user: User = {
        id: firebaseUser.uid,
        email,
        name,
        phone,
        role,
        // Salon owners need account verification first
        isVerified: role === 'client' ? true : false,
        accountVerificationStatus: role === 'salon_owner' ? 'pending' : 'verified',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('Saving user data to Firestore...');
      await setDoc(doc(db, 'users', firebaseUser.uid), user);
      this.currentUser = user;

      console.log('User signup completed successfully');
      return { success: true, data: user };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      };
    }
  }

  // Sign up salon owner with documents - FIXED
  async signUpSalonOwner(userData: SalonOwnerSignUpData): Promise<ServiceResponse<SalonOwner>> {
    try {
      const { businessLicense, idDocument, ...baseData } = userData;
      
      const result = await this.signUp(baseData);
      if (!result.success || !result.data) {
        return { success: false, error: result.error };
      }

      const salonOwner: SalonOwner = {
        ...result.data,
        businessLicense,
        idDocument,
        // Account verification for salon owner
        accountVerificationStatus: 'pending',
        isVerified: false,
        verificationDocuments: [businessLicense, idDocument]
      };

      await updateDoc(doc(db, 'users', result.data.id), {
        businessLicense,
        idDocument,
        accountVerificationStatus: 'pending',
        isVerified: false,
        verificationDocuments: [businessLicense, idDocument]
      });

      return { success: true, data: salonOwner };
    } catch (error: any) {
      console.error('Salon owner signup error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      };
    }
  }

  // Sign in - FIXED with better error handling
  async signIn(email: string, password: string): Promise<ServiceResponse<User>> {
    try {
      console.log('Attempting Firebase sign in for:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user exists
      if (!userCredential.user) {
        return { success: false, error: 'Échec de la connexion.' };
      }
      
      console.log('Firebase sign in successful, fetching user data...');
      const userData = await this.getUserData(userCredential.user.uid);
      
      if (userData) {
        this.currentUser = userData;
        console.log('User data retrieved successfully:', userData.name);
        return { success: true, data: userData };
      }
      
      console.error('User data not found in Firestore');
      return { success: false, error: 'Données utilisateur introuvables.' };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      };
    }
  }

  // Sign out
  async signOut(): Promise<ServiceResponse<void>> {
    try {
      console.log('Signing out user...');
      await signOut(auth);
      this.currentUser = null;
      console.log('Sign out successful');
      return { success: true };
    } catch (error: any) {
      console.error('Sign out error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      };
    }
  }

  // Get user data from Firestore - ENHANCED with better error handling
  async getUserData(uid: string): Promise<User | null> {
    try {
      console.log('Fetching user data for UID:', uid);
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        console.log('User data found in Firestore');
        const data = userDoc.data();
        
        // For backward compatibility - check if user is salon owner
        const isSalonOwner = data.role === 'salon_owner';
        
        const userData = { 
          id: userDoc.id, 
          ...data,
          // Ensure verification fields exist
          accountVerificationStatus: data.accountVerificationStatus || 
            (isSalonOwner ? 'pending' : 'verified'),
          isVerified: data.isVerified !== undefined ? data.isVerified : 
            (!isSalonOwner) // Clients are always verified
        } as User;
        
        console.log('User data with verification:', {
          email: userData.email,
          role: userData.role,
          accountVerificationStatus: userData.accountVerificationStatus,
          isVerified: userData.isVerified
        });
        
        return userData;
      }
      console.log('No user data found in Firestore');
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Listen to auth state changes - FIXED with null checks
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser?.email || 'No user');
      
      if (firebaseUser && firebaseUser.uid) {
        try {
          const userData = await this.getUserData(firebaseUser.uid);
          this.currentUser = userData;
          callback(userData);
        } catch (error) {
          console.error('Error in auth state change:', error);
          this.currentUser = null;
          callback(null);
        }
      } else {
        this.currentUser = null;
        callback(null);
      }
    });
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Update user profile - FIXED
  async updateProfile(updates: Partial<User>): Promise<ServiceResponse<void>> {
    try {
      if (!this.currentUser) {
        return { success: false, error: 'Aucun utilisateur connecté' };
      }

      await updateDoc(doc(db, 'users', this.currentUser.id), {
        ...updates,
        updatedAt: new Date()
      });

      this.currentUser = { ...this.currentUser, ...updates };
      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: this.getErrorMessage(error)
      };
    }
  }

  // Check if salon owner account is verified
  isAccountVerified(): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'client') return true;
    return this.currentUser.accountVerificationStatus === 'verified' || 
           this.currentUser.isVerified === true;
  }
}

export const authService = new AuthService();