// config/firebase.ts - Your updated Firebase config with persistence
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDUBK5q9q8vErsPqy6sOHcGCknx9-I_KWo",
  authDomain: "resaly-c5f09.firebaseapp.com",
  projectId: "resaly-c5f09",
  storageBucket: "resaly-c5f09.firebasestorage.app",
  messagingSenderId: "611899067209",
  appId: "1:611899067209:web:ce31eb2ae34183b1336898",
  measurementId: "G-EN5PB7E9VM"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
}

// Initialize other Firebase services
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;