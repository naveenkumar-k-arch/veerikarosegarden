import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

const jsonConfig: any = defaultFirebaseConfig || {};

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || jsonConfig.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || jsonConfig.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || jsonConfig.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || jsonConfig.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || jsonConfig.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || jsonConfig.appId || '',
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || jsonConfig.measurementId || ''
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, jsonConfig.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
export type { FirebaseUser };
