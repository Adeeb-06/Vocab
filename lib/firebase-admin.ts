
import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Missing Firebase Admin environment variables.");
}

const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
console.log("Firebase Admin credential check:", {
  projectId,
  clientEmail,
  hasPrivateKey: Boolean(privateKey),
  validPrivateKeyStart: privateKey?.startsWith(
    "-----BEGIN PRIVATE KEY-----"
  ),
  validPrivateKeyEnd: privateKey?.trim().endsWith(
    "-----END PRIVATE KEY-----"
  ),
});
export const adminAuth = getAuth(adminApp);
