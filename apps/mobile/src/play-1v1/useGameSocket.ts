import { useCallback, useEffect, useRef, useState } from "react"
import { io, type Socket } from "socket.io-client"
import { getFirebaseAuth } from "../lib/firebase"
import { env } from "../lib/env"
import type { RoomState } from "./types"
import type { Stroke } from "../game/types"

type UseGameSocketOptions = {
    roomId: string | null
    enabled: boolean
}

export function useGameSocket({ roomId, enabled }: UseGameSocketOptions) {
    const socketRef = useRef<Socket | null>(null)
    const [connected, setConnected] = useState(false)
    const [state, setState] = useState<RoomState | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled || !roomId) return

        let cancelled = false

        async function connect() {
            const auth = getFirebaseAuth()
            const user = auth?.currentUser
            if (!user) {
                setError("Not signed in")
                return
            }

            const token = await user.getIdToken()
            if (cancelled) return

            const socket = io(`${env.apiUrl}/game`, {
                auth: { token },
                transports: ["websocket"],
                autoConnect: true,
            })

            socketRef.current = socket

            socket.on("connect", () => {
                setConnected(true)
                socket.emit("room:enter", { roomId })
            })

            socket.on("disconnect", () => setConnected(false))

            socket.on("room:state", (payload: RoomState) => {
                setState(payload)
            })

            socket.on("draw:stroke", ({ stroke }: { stroke: Stroke }) => {
                setState(prev => {
                    if (!prev) return prev
                    return { ...prev, strokes: [...prev.strokes, stroke] }
                })
            })

            socket.on("error", (payload: { message?: string }) => {
                setError(payload.message ?? "Something went wrong")
            })
        }

        connect()

        return () => {
            cancelled = true
            socketRef.current?.disconnect()
            socketRef.current = null
            setConnected(false)
        }
    }, [enabled, roomId])

    const pickWord = useCallback(
        (word: string) => {
            if (!roomId) return
            socketRef.current?.emit("word:pick", { roomId, word })
        },
        [roomId],
    )

    const sendStroke = useCallback(
        (stroke: Stroke) => {
            if (!roomId) return
            socketRef.current?.emit("draw:stroke", { roomId, stroke })
        },
        [roomId],
    )

    const finishDrawing = useCallback(() => {
        if (!roomId) return
        socketRef.current?.emit("draw:done", { roomId })
    }, [roomId])

    const sendChat = useCallback(
        (text: string) => {
            if (!roomId) return
            socketRef.current?.emit("chat:send", { roomId, text })
        },
        [roomId],
    )

    return {
        connected,
        state,
        error,
        pickWord,
        sendStroke,
        finishDrawing,
        sendChat,
    }
}
