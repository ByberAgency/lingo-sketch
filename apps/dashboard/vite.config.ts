import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@dashboard-api": path.resolve(__dirname, "./src/dashboard-api/index.ts"),
        },
    },
    server: {
        port: 5173,
        proxy: {
            "/health": {
                target: "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
})
