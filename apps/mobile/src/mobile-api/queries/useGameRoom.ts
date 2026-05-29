import { useMutation, useQuery } from "@tanstack/react-query"
import {
    createGameRoom,
    inviteToGameRoom,
    joinGameRoom,
    listMyGroupInvites,
    startGroupGame,
} from "@lingo-sketch/api-client"
import { useAuth } from "../../auth/AuthProvider"
import { mapGameRoomApiError, prepareGameRoomAuth } from "../gameRoomApi"

export function useCreateRoom() {
    const { user } = useAuth()

    return useMutation({
        mutationFn: async () => {
            await prepareGameRoomAuth(user)
            const { data, error, response } = await createGameRoom()
            if (error) {
                throw new Error(mapGameRoomApiError({ error, response }, "create"))
            }
            return data!
        },
    })
}

export function useCreateGroupRoom() {
    const { user } = useAuth()

    return useMutation({
        mutationFn: async (groupName: string) => {
            await prepareGameRoomAuth(user)
            const { data, error, response } = await createGameRoom({
                body: { mode: "group", groupName: groupName.trim() },
            })
            if (error) {
                throw new Error(mapGameRoomApiError({ error, response }, "create"))
            }
            return data!
        },
    })
}

export function useJoinRoom() {
    const { user } = useAuth()

    return useMutation({
        mutationFn: async (code: string) => {
            await prepareGameRoomAuth(user)
            const { data, error, response } = await joinGameRoom({
                body: { code: code.trim().toUpperCase() },
            })
            if (error) {
                throw new Error(mapGameRoomApiError({ error, response }, "join"))
            }
            return data!
        },
    })
}

export function useInviteToRoom() {
    const { user } = useAuth()

    return useMutation({
        mutationFn: async ({ roomId, emails }: { roomId: string; emails: string[] }) => {
            await prepareGameRoomAuth(user)
            const { data, error, response } = await inviteToGameRoom({
                path: { roomId },
                body: { emails },
            })
            if (error) {
                throw new Error(mapGameRoomApiError({ error, response }, "create"))
            }
            return data!
        },
    })
}

export function useStartGroupGame() {
    const { user } = useAuth()

    return useMutation({
        mutationFn: async (roomId: string) => {
            await prepareGameRoomAuth(user)
            const { data, error, response } = await startGroupGame({
                path: { roomId },
            })
            if (error) {
                throw new Error(mapGameRoomApiError({ error, response }, "create"))
            }
            return data!
        },
    })
}

export function useMyGroupInvites(enabled = true) {
    const { user } = useAuth()

    return useQuery({
        queryKey: ["groupInvites", user?.uid],
        enabled: enabled && !!user,
        queryFn: async () => {
            await prepareGameRoomAuth(user)
            const { data, error, response } = await listMyGroupInvites()
            if (error) {
                throw new Error(mapGameRoomApiError({ error, response }, "join"))
            }
            return data ?? []
        },
    })
}
