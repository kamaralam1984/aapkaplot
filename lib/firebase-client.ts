"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebasePhoneEnabled(): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId);
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!isFirebasePhoneEnabled()) return null;
  if (_auth) return _auth;
  _app = getApps().length ? getApp() : initializeApp(config as Required<typeof config>);
  _auth = getAuth(_app);
  return _auth;
}
