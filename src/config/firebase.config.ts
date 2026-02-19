import admin from "firebase-admin";
import { env } from "./env.config";

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App | null {
    if (firebaseApp) {
        return firebaseApp;
    }

    if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
        console.warn("Firebase credentials not configured. File upload features will be disabled.");
        return null;
    }

    try {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId: env.FIREBASE_PROJECT_ID,
                clientEmail: env.FIREBASE_CLIENT_EMAIL,
                privateKey: env.FIREBASE_PRIVATE_KEY,
            }),
            storageBucket: env.FIREBASE_STORAGE_BUCKET,
        });

        console.log("Firebase initialized successfully");
        return firebaseApp;
    } catch (error) {
        console.error("Failed to initialize Firebase:", error);
        return null;
    }
}

export function getFirebaseApp(): admin.app.App | null {
    return firebaseApp;
}

export function getStorageBucket(): admin.storage.Storage | null {
    if (!firebaseApp) {
        return null;
    }
    return firebaseApp.storage();
}

export { admin };
