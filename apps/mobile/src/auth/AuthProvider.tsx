import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    type User,
} from "firebase/auth"
import * as Google from "expo-auth-session/providers/google"
import * as WebBrowser from "expo-web-browser"
import { env, isGoogleSignInConfigured } from "../lib/env"
import { getFirebaseAuth } from "../lib/firebase"
import { setMobileAccessToken } from "../mobile-api/config"

WebBrowser.maybeCompleteAuthSession()

interface AuthContextValue {
    user: User | null
    loading: boolean
    googleSignInEnabled: boolean
    signInWithGoogle: () => Promise<void>
    signInWithEmail: (email: string, password: string) => Promise<void>
    signUpWithEmail: (email: string, password: string) => Promise<void>
    signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function requireAuth() {
    const auth = getFirebaseAuth()
    if (!auth) {
        throw new Error("Firebase Auth is not configured. Check apps/mobile/.env")
    }
    return auth
}

type PromptGoogle = () => Promise<{ type: string; params?: { id_token?: string } } | null>

function AuthProviderCore({
    children,
    promptGoogleSignIn,
}: {
    children: ReactNode
    promptGoogleSignIn: PromptGoogle | null
}) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const googleSignInEnabled = promptGoogleSignIn != null

    useEffect(() => {
        const auth = getFirebaseAuth()
        if (!auth) {
            setLoading(false)
            return
        }

        return onAuthStateChanged(auth, async nextUser => {
            setUser(nextUser)
            if (nextUser) {
                const token = await nextUser.getIdToken()
                setMobileAccessToken(token)
            } else {
                setMobileAccessToken(null)
            }
            setLoading(false)
        })
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            googleSignInEnabled,
            signInWithGoogle: async () => {
                const auth = requireAuth()
                if (!promptGoogleSignIn) {
                    throw new Error(
                        "Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID to apps/mobile/.env",
                    )
                }

                const result = await promptGoogleSignIn()
                if (result?.type !== "success") {
                    throw new Error("Google sign-in was cancelled")
                }

                const idToken = result.params?.id_token
                if (!idToken) {
                    throw new Error("Google sign-in did not return an ID token")
                }

                const credential = GoogleAuthProvider.credential(idToken)
                await signInWithCredential(auth, credential)
            },
            signInWithEmail: async (email, password) => {
                await signInWithEmailAndPassword(requireAuth(), email, password)
            },
            signUpWithEmail: async (email, password) => {
                await createUserWithEmailAndPassword(requireAuth(), email, password)
            },
            signOutUser: async () => {
                await signOut(requireAuth())
            },
        }),
        [user, loading, googleSignInEnabled, promptGoogleSignIn],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function AuthProviderWithGoogle({ children }: { children: ReactNode }) {
    const [, , promptGoogleSignIn] = Google.useIdTokenAuthRequest({
        webClientId: env.googleWebClientId,
        iosClientId: env.googleIosClientId,
        androidClientId: env.googleAndroidClientId || env.googleWebClientId,
    })

    return (
        <AuthProviderCore promptGoogleSignIn={promptGoogleSignIn}>
            {children}
        </AuthProviderCore>
    )
}

export function AuthProvider({ children }: { children: ReactNode }) {
    if (isGoogleSignInConfigured()) {
        return <AuthProviderWithGoogle>{children}</AuthProviderWithGoogle>
    }
    return <AuthProviderCore promptGoogleSignIn={null}>{children}</AuthProviderCore>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}
