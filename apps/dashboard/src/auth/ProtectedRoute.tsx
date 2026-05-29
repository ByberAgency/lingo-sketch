import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthProvider"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <main className="loading-screen">Loading…</main>
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    return children
}
