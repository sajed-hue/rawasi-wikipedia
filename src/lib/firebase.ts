// Firebase client initialization — browser-only and resilient.
//
// This is an SSR app (TanStack Start), so Firebase must never initialize on the server.
// It is also resilient to missing config: if the VITE_FIREBASE_* vars are absent,
// getFirebaseAuth() returns null instead of throwing, so the app still renders
// (signed-out) until real config is provided in .env.local.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function readConfig(): FirebaseClientConfig {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
}

/** True when the minimum Firebase web config needed to initialize is present. */
export function isFirebaseConfigured(): boolean {
  const config = readConfig();
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);
}

const isBrowser = typeof window !== "undefined";

let cachedAuth: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(readConfig());
}

/**
 * Returns the Firebase Auth instance, or null when running on the server or when
 * Firebase is not configured. Callers must handle the null case.
 */
export function getFirebaseAuth(): Auth | null {
  if (!isBrowser || !isFirebaseConfigured()) return null;
  if (!cachedAuth) {
    cachedAuth = getAuth(getFirebaseApp());
  }
  return cachedAuth;
}
