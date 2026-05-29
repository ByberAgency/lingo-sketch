import type { User } from "firebase/auth"
import { env } from "../lib/env"
import { setMobileAccessToken } from "./config"

type ApiErrorPayload = {
    error?: unknown
    response?: { status?: number }
}

export async function prepareGameRoomAuth(user: User | null): Promise<void> {
    if (!user) {
        throw new Error("Sign in to create or join a room")
    }
    const token = await user.getIdToken(true)
    setMobileAccessToken(token)
}

function extractNestMessage(error: unknown): string | undefined {
    if (!error || typeof error !== "object") return undefined
    const record = error as Record<string, unknown>
    const message = record.message
    if (typeof message === "string") return message
    if (Array.isArray(message)) return message.filter(m => typeof m === "string").join(", ")
    return undefined
}

function isNetworkFailure(error: unknown): boolean {
    if (error instanceof TypeError) return true
    if (error instanceof Error) {
        const msg = error.message.toLowerCase()
        return (
            msg.includes("network request failed") ||
            msg.includes("failed to fetch") ||
            msg.includes("network error")
        )
    }
    return false
}

export function mapGameRoomApiError(error: unknown, kind: "create" | "join"): string {
    const fallback =
        kind === "create"
            ? "Could not create a room. Try again."
            : "Room not found or already in progress"

    if (error instanceof Error && error.message === "Sign in to create or join a room") {
        return error.message
    }

    if (isNetworkFailure(error)) {
        return `Can't reach server at ${env.apiUrl}. Check EXPO_PUBLIC_API_URL and that the API is running.`
    }

    const payload = error as ApiErrorPayload
    const status = payload.response?.status

    if (status === 401) return "Sign in again"
    if (status && status >= 500) return "Server error — is the API running?"

    const nested = extractNestMessage(payload.error) ?? extractNestMessage(error)
    if (nested) return nested

    if (!status) {
        return `Can't reach server at ${env.apiUrl}. Check EXPO_PUBLIC_API_URL and that the API is running.`
    }

    return fallback
}

export const SERVER_UNREACHABLE_MESSAGE =
    "Can't reach the game server. Set EXPO_PUBLIC_API_URL to your computer's IP (not localhost) and restart Expo."
