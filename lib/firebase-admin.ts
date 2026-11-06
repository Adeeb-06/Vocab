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

console.log("=== FB_SERVICE_KEY DEBUG ===");
console.log("Exists:", !!fbServiceKey);
console.log("Type:", typeof fbServiceKey);
console.log("Length:", fbServiceKey?.length);
console.log("First 80 chars:", fbServiceKey?.slice(0, 80));
console.log("Last 80 chars:", fbServiceKey?.slice(-80));
console.log("Contains spaces?", fbServiceKey?.includes(" "));
console.log("Contains newlines?", fbServiceKey?.includes("\n"));
console.log("============================");

if (!fbServiceKey) {
  throw new Error("Missing FB_SERVICE_KEY environment variable");
}

let serviceAccount: ServiceAccount;

try {
  const decoded = Buffer.from(fbServiceKey, "base64").toString("utf8");
  console.log("Decoded starts with:", decoded.slice(0, 50));
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