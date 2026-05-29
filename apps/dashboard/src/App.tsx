import { Route, Routes } from "react-router-dom"
import { ProtectedRoute } from "./auth/ProtectedRoute"
import { HomePage } from "./pages/Home"
import { LoginPage } from "./pages/Login"

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <HomePage />
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}
