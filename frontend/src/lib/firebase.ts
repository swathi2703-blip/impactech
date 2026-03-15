import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
};

const requiredFirebaseFields: Array<keyof typeof firebaseConfig> = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const hasRequiredFirebaseConfig = requiredFirebaseFields.every((key) => Boolean(firebaseConfig[key]));

export const firebaseApp = hasRequiredFirebaseConfig
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

export let firebaseAnalytics: ReturnType<typeof getAnalytics> | null = null;
if (firebaseApp && typeof window !== "undefined") {
  void isSupported().then((supported) => {
    if (supported) {
      firebaseAnalytics = getAnalytics(firebaseApp);
    }
  });
}

export const firebaseProjectConfigured = hasRequiredFirebaseConfig;
