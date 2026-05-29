import AsyncStorage from "@react-native-async-storage/async-storage"
import { getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, initializeAuth, type Auth, type Persistence } from "firebase/auth"
import { env, isFirebaseConfigured } from "./env"

let app: FirebaseApp | undefined
let auth: Auth | undefined

function initAuth(firebaseApp: FirebaseApp): Auth {
    try {
        // Metro resolves the React Native Firebase Auth bundle at runtime.
        const { getReactNativePersistence } = require("firebase/auth") as {
            getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence
        }
        return initializeAuth(firebaseApp, {
            persistence: getReactNativePersistence(AsyncStorage),
        })
    } catch {
        return getAuth(firebaseApp)
    }
}

export function getFirebaseApp(): FirebaseApp | null {
    if (!isFirebaseConfigured()) return null

    if (!app) {
        app = getApps().length
            ? getApps()[0]
            : initializeApp({
                  apiKey: env.firebase.apiKey,
                  authDomain: env.firebase.authDomain,
                  projectId: env.firebase.projectId,
                  appId: env.firebase.appId,
              })
    }

    return app
}

export function getFirebaseAuth(): Auth | null {
    const firebaseApp = getFirebaseApp()
    if (!firebaseApp) return null

    if (!auth) {
        auth = initAuth(firebaseApp)
    }

    return auth
}
