import { useAuth } from "../auth/AuthProvider"
import { useAuthMe, useHealth } from "@dashboard-api"

export function HomePage() {
    const { signOutUser } = useAuth()
    const health = useHealth()
    const authMe = useAuthMe()

    return (
        <main>
            <header className="page-header">
                <div>
                    <h1>Lingo Sketch</h1>
                    <p>Signed in with Firebase Auth.</p>
                </div>
                <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => signOutUser()}
                >
                    Sign out
                </button>
            </header>

            <div className="status-card">
                <h2>Your account</h2>
                {authMe.isLoading && (
                    <p className="status-loading">Loading profile…</p>
                )}
                {authMe.isError && (
                    <p className="status-error">
                        Could not load profile: {authMe.error.message}
                    </p>
                )}
                {authMe.isSuccess && (
                    <div className="profile-grid">
                        <p>
                            <strong>Email:</strong> {authMe.data.email}
                        </p>
                        <p>
                            <strong>Name:</strong>{" "}
                            {authMe.data.displayName ?? "Not set"}
                        </p>
                        <p>
                            <strong>UID:</strong> {authMe.data.uid}
                        </p>
                    </div>
                )}
            </div>

            <div className="status-card">
                <h2>API health</h2>
                {health.isLoading && (
                    <p className="status-loading">Checking API health…</p>
                )}
                {health.isError && (
                    <p className="status-error">
                        API unreachable: {health.error.message}
                    </p>
                )}
                {health.isSuccess && (
                    <p className="status-ok">API status: {health.data.status}</p>
                )}
            </div>
        </main>
    )
}
