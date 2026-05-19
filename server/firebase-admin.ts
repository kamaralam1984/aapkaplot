import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

let _app: App | null = null;
let _auth: Auth | null = null;

function readServiceAccount() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // Private key is multi-line — `.env` stores it with literal `\n` which
  // we restore here so the PEM parser is happy.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

export function isFirebaseAdminEnabled(): boolean {
  return readServiceAccount() !== null;
}

export function getFirebaseAdminAuth(): Auth | null {
  const sa = readServiceAccount();
  if (!sa) return null;
  if (_auth) return _auth;
  _app = getApps()[0] ?? initializeApp({ credential: cert(sa) });
  _auth = getAuth(_app);
  return _auth;
}
