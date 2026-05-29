import { useState } from "react"
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native"
import { useAuth } from "../src/auth/AuthProvider"
import { formatFirebaseAuthError } from "../src/lib/firebaseErrors"

export default function LoginScreen() {
    const { loading, googleSignInEnabled, signInWithGoogle, signInWithEmail, signUpWithEmail } =
        useAuth()
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const handleEmailSubmit = async () => {
        setSubmitting(true)
        setError(null)

        try {
            if (mode === "sign-in") {
                await signInWithEmail(email.trim(), password)
            } else {
                await signUpWithEmail(email.trim(), password)
            }
        } catch (err) {
            setError(formatFirebaseAuthError(err))
        } finally {
            setSubmitting(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setSubmitting(true)
        setError(null)

        try {
            await signInWithGoogle()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign in to Lingo Sketch</Text>
            <Text style={styles.subtitle}>
                {googleSignInEnabled
                    ? "Use Google or email to continue."
                    : "Sign in with email to continue."}
            </Text>

            {googleSignInEnabled && (
                <>
                    <Pressable
                        style={[styles.button, styles.secondaryButton]}
                        onPress={handleGoogleSignIn}
                        disabled={submitting}
                    >
                        <Text style={styles.secondaryButtonText}>Continue with Google</Text>
                    </Pressable>

                    <Text style={styles.divider}>or</Text>
                </>
            )}

            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={handleEmailSubmit}
                disabled={submitting}
            >
                <Text style={styles.primaryButtonText}>
                    {mode === "sign-in" ? "Sign in" : "Create account"}
                </Text>
            </Pressable>

            <Pressable onPress={() => setMode(m => (m === "sign-in" ? "sign-up" : "sign-in"))}>
                <Text style={styles.link}>
                    {mode === "sign-in"
                        ? "Need an account? Sign up"
                        : "Already have an account? Sign in"}
                </Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fafafa",
    },
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 96,
        gap: 12,
        backgroundColor: "#fafafa",
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#111",
    },
    subtitle: {
        color: "#555",
        marginBottom: 8,
    },
    divider: {
        textAlign: "center",
        color: "#888",
        marginVertical: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: "#d4d4d4",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#fff",
    },
    button: {
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: "center",
    },
    primaryButton: {
        backgroundColor: "#111",
    },
    primaryButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
    secondaryButton: {
        backgroundColor: "#f3f4f6",
    },
    secondaryButtonText: {
        color: "#111",
        fontWeight: "600",
    },
    link: {
        color: "#2563eb",
        textAlign: "center",
        marginTop: 8,
    },
    error: {
        color: "#b91c1c",
    },
})
