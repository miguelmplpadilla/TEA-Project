import { getApp, getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredConfigKeys = {
  apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
} as const;

export const missingFirebaseConfigKeys = Object.entries(requiredConfigKeys)
  .filter(([configKey]) => !firebaseConfig[configKey as keyof typeof requiredConfigKeys])
  .map(([, envKey]) => envKey);

export const hasFirebaseConfig = missingFirebaseConfigKeys.length === 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp() {
  if (!hasFirebaseConfig) {
    throw new Error(
      `Falta configurar Firebase: ${missingFirebaseConfigKeys.join(', ')}. Revisa el archivo .env.`
    );
  }

  if (app) {
    return app;
  }

  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth() {
  if (auth) {
    return auth;
  }

  auth = getAuth(getFirebaseApp());
  return auth;
}
