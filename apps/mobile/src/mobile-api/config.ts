import { apiClient } from "@lingo-sketch/api-client"
import { env } from "../lib/env"

let currentAccessToken: string | null = null

export const setMobileAccessToken = (token: string | null) => {
    currentAccessToken = token
}

apiClient.setConfig({
    baseUrl: env.apiUrl,
    auth: async () => currentAccessToken ?? undefined,
})

export { env as mobileEnv }
