import { FormEvent, useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../auth/AuthProvider"

export function LoginPage() {
    const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } =
        useAuth()
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    if (!loading && user) {
        return <Navigate to="/" replace />
    }

    const handleEmailSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setSubmitting(true)
        setError(null)

        try {
            if (mode === "sign-in") {
                await signInWithEmail(email, password)
            } else {
                await signUpWithEmail(email, password)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed")
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

    return (
        <main className="auth-page">
            <div className="auth-card">
                <h1>Sign in to Lingo Sketch</h1>
                <p>Use Google or email to access the dashboard.</p>

                <button
                    type="button"
                    className="button button-secondary"
                    onClick={handleGoogleSignIn}
                    disabled={submitting || loading}
                >
                    Continue with Google
                </button>

                <div className="auth-divider">or</div>

                <form className="auth-form" onSubmit={handleEmailSubmit}>
                    <label>
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                            required
                            autoComplete="email"
                        />
                    </label>
                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                            required
                            minLength={6}
                            autoComplete={
                                mode === "sign-in" ? "current-password" : "new-password"
                            }
                        />
                    </label>

                    {error && <p className="status-error">{error}</p>}

                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={submitting || loading}
                    >
                        {mode === "sign-in" ? "Sign in" : "Create account"}
                    </button>
                </form>

                <button
                    type="button"
                    className="button-link"
                    onClick={() =>
                        setMode(current => (current === "sign-in" ? "sign-up" : "sign-in"))
                    }
                >
                    {mode === "sign-in"
                        ? "Need an account? Sign up"
                        : "Already have an account? Sign in"}
                </button>
            </div>
        </main>
    )
}
