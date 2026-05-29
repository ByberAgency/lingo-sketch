import { Platform } from "react-native"

export const env = {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
    firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
        projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
    },
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "",
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? "",
}

export function isFirebaseConfigured(): boolean {
    return Boolean(
        env.firebase.apiKey &&
            env.firebase.authDomain &&
            env.firebase.projectId &&
            env.firebase.appId,
    )
}

export function isGoogleSignInConfigured(): boolean {
    if (!env.googleWebClientId) return false
    if (Platform.OS === "ios") return Boolean(env.googleIosClientId)
    if (Platform.OS === "android") {
        return Boolean(env.googleAndroidClientId || env.googleWebClientId)
    }
    return true
}

export function missingFirebaseEnvKeys(): string[] {
    const keys: string[] = []
    if (!env.firebase.apiKey) keys.push("EXPO_PUBLIC_FIREBASE_API_KEY")
    if (!env.firebase.authDomain) keys.push("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN")
    if (!env.firebase.projectId) keys.push("EXPO_PUBLIC_FIREBASE_PROJECT_ID")
    if (!env.firebase.appId) keys.push("EXPO_PUBLIC_FIREBASE_APP_ID")
    return keys
}

export function missingGoogleEnvKeys(): string[] {
    const keys: string[] = []
    if (!env.googleWebClientId) keys.push("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID")
    if (Platform.OS === "ios" && !env.googleIosClientId) {
        keys.push("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID")
    }
    if (Platform.OS === "android" && !env.googleAndroidClientId) {
        keys.push("EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID")
    }
    return keys
}
