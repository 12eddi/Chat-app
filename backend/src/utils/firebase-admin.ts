import admin from "firebase-admin";
import { env } from "../config/env";

let initializedApp: admin.app.App | null = null;

const getCredential = () => {
  if (!env.firebase) {
    return null;
  }

  if ("serviceAccountJson" in env.firebase) {
    const parsed = JSON.parse(env.firebase.serviceAccountJson) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };

    return admin.credential.cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    });
  }

  return admin.credential.cert({
    projectId: env.firebase.projectId,
    clientEmail: env.firebase.clientEmail,
    privateKey: env.firebase.privateKey,
  });
};

export const isFirebaseConfigured = () => Boolean(env.firebase);

export const getFirebaseAdminApp = () => {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (initializedApp) {
    return initializedApp;
  }

  if (admin.apps.length > 0) {
    initializedApp = admin.apps[0]!;
    return initializedApp;
  }

  const credential = getCredential();

  if (!credential) {
    return null;
  }

  initializedApp = admin.initializeApp({ credential });
  return initializedApp;
};
