import { Baloo2_800ExtraBold } from "@expo-google-fonts/baloo-2"
import {
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito"
import { useFonts } from "expo-font"
import { Stack, useRouter, useSegments } from "expo-router"
import { useEffect } from "react"
import { ActivityIndicator, View } from "react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider, useAuth } from "../src/auth/AuthProvider"
import { isFirebaseConfigured } from "../src/lib/env"
import { FirebaseSetupScreen } from "../src/screens/FirebaseSetupScreen"
import "../src/mobile-api/config"

const queryClient = new QueryClient()

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        Baloo2_800ExtraBold,
        Nunito_600SemiBold,
        Nunito_700Bold,
        Nunito_800ExtraBold,
    })

    if (!fontsLoaded) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#FBF4EE",
                }}
            >
                <ActivityIndicator size="large" color="#FF7A5C" />
            </View>
        )
    }

    if (!isFirebaseConfigured()) {
        return (
            <SafeAreaProvider>
                <FirebaseSetupScreen />
                <StatusBar style="dark" />
            </SafeAreaProvider>
        )
    }

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <RootNavigator />
                    <StatusBar style="dark" />
                </AuthProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    )
}

function RootNavigator() {
    const { user, loading } = useAuth()
    const segments = useSegments()
    const router = useRouter()

    useEffect(() => {
        if (loading) return

        const inLogin = segments[0] === "login"

        if (!user && !inLogin) {
            router.replace("/login")
            return
        }

        if (user && inLogin) {
            router.replace("/")
        }
    }, [user, loading, segments, router])

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
        </Stack>
    )
}
