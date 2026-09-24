import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isDemoMode = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true";
export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
};

let services: FirebaseServices | null = null;

export function getFirebaseServices(): FirebaseServices {
  if (services) return services;
  if (!isFirebaseConfigured) throw new Error("Firebaseの環境変数が設定されていません。");

  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  let db: Firestore;
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    db = getFirestore(app);
  }

  services = { app, auth: getAuth(app), db };
  return services;
}
