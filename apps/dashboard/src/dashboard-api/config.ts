import { getAuth } from "firebase/auth"
import { apiClient } from "@lingo-sketch/api-client"

const backendUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

apiClient.setConfig({
    baseUrl: backendUrl,
    auth: async () => {
        const user = getAuth().currentUser
        return user ? await user.getIdToken() : undefined
    },
})

export { backendUrl }
