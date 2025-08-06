// config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;