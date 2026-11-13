import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const fbServiceKey = process.env.FB_SERVICE_KEY;


if (!fbServiceKey) {
  throw new Error("Missing FB_SERVICE_KEY environment variable");
}

let serviceAccount: ServiceAccount;

try {
  const decoded = Buffer.from(fbServiceKey, "base64").toString("utf8");

  serviceAccount = JSON.parse(decoded) as ServiceAccount;
} catch (err) {
  console.error("Failed to decode FB_SERVICE_KEY:", err);
  throw new Error("FB_SERVICE_KEY is not a valid base64-encoded service account JSON");
}

const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        credential: cert(serviceAccount),
      });

export const adminAuth = getAuth(adminApp);