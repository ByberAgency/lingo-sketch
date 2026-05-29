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
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    type User,
} from "firebase/auth"
import { auth, googleProvider } from "../lib/firebase"

interface AuthContextValue {
    user: User | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signInWithEmail: (email: string, password: string) => Promise<void>
    signUpWithEmail: (email: string, password: string) => Promise<void>
    signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        return onAuthStateChanged(auth, nextUser => {
            setUser(nextUser)
            setLoading(false)
        })
    }, [])

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            signInWithGoogle: async () => {
                await signInWithPopup(auth, googleProvider)
            },
            signInWithEmail: async (email, password) => {
                await signInWithEmailAndPassword(auth, email, password)
            },
            signUpWithEmail: async (email, password) => {
                await createUserWithEmailAndPassword(auth, email, password)
            },
            signOutUser: async () => {
                await signOut(auth)
            },
        }),
        [user, loading]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}
