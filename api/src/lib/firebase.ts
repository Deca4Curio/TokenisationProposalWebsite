import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App;
let db: Firestore;

function getApp(): App {
  if (!app) {
    const existing = getApps();
    if (existing.length > 0) {
      app = existing[0];
    } else {
      const projectId = process.env.GCLOUD_PROJECT;
      const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

      if (credentials) {
        app = initializeApp({
          credential: cert(JSON.parse(credentials)),
          projectId,
        });
      } else {
        initializeApp({ projectId });
        app = getApps()[0];
      }
    }
  }
  return app;
}

export function getDb(): Firestore {
  if (!db) {
    getApp();
    db = getFirestore();
  }
  return db;
}
