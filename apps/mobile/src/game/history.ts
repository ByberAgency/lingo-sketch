import AsyncStorage from "@react-native-async-storage/async-storage"
import type { RoomChatMessage, RoomPlayer } from "../play-1v1/types"

const HISTORY_KEY = "doodlelingo_game_history_v1"

export type StoredGameMessage = {
    id: number
    kind: RoomChatMessage["kind"]
    text: string
    authorName?: string
    authorUid?: string
    message?: string
}

export type GameThread = {
    id: string
    kind: "1v1" | "group"
    title: string
    preview: string
    participantUids: string[]
    participants: { name: string; uid?: string }[]
    messages: StoredGameMessage[]
    updatedAt: number
    roomCode?: string
    solvedWord?: string | null
}

export async function loadGameThreads(): Promise<GameThread[]> {
    try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw) as GameThread[]
        return parsed.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch {
        return []
    }
}

async function persistThreads(threads: GameThread[]) {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(threads))
}

function lastPreview(messages: StoredGameMessage[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i]
        if (m.kind === "system" || m.kind === "guard") continue
        if (m.text.trim()) return m.text
    }
    return "Game started"
}

export async function save1v1GameHistory(params: {
    myUid: string
    players: RoomPlayer[]
    messages: RoomChatMessage[]
    solvedWord?: string | null
    roomCode: string
}): Promise<void> {
    const { myUid, players, messages, solvedWord, roomCode } = params
    const opponent = players.find(p => p.uid !== myUid)
    if (!opponent || messages.length === 0) return

    const stored: StoredGameMessage[] = messages.map(m => ({
        id: m.id,
        kind: m.kind,
        text: m.text,
        authorName: m.authorName,
        authorUid: m.authorUid,
        message: m.message,
    }))

    const hasChat = stored.some(m => m.kind === "guess" || m.kind === "question" || m.kind === "answer")
    if (!hasChat && !solvedWord) return

    const threads = await loadGameThreads()
    const threadId = `1v1-${opponent.uid}`
    const existing = threads.find(t => t.id === threadId)
    const now = Date.now()

    const sessionMessages: StoredGameMessage[] = [
        ...(existing && existing.messages.length > 0
            ? [{ id: now, kind: "system" as const, text: "— New game —" }]
            : []),
        ...stored,
    ]

    if (solvedWord) {
        sessionMessages.push({
            id: now + 1,
            kind: "system",
            text: `The word was "${solvedWord}".`,
        })
    }

    const mergedMessages = existing
        ? [...existing.messages, ...sessionMessages]
        : sessionMessages

    const thread: GameThread = {
        id: threadId,
        kind: "1v1",
        title: opponent.displayName,
        preview: lastPreview(mergedMessages),
        participantUids: [myUid, opponent.uid],
        participants: players.map(p => ({ name: p.displayName, uid: p.uid })),
        messages: mergedMessages,
        updatedAt: now,
        roomCode,
        solvedWord,
    }

    const next = [thread, ...threads.filter(t => t.id !== threadId)]
    await persistThreads(next)
}

export async function saveGroupGameHistory(params: {
    myUid: string
    groupName: string
    groupId: string
    players: RoomPlayer[]
    messages: RoomChatMessage[]
    solvedWord?: string | null
    roomCode: string
}): Promise<void> {
    const { myUid, groupName, groupId, players, messages, solvedWord, roomCode } = params
    if (players.length < 2 || messages.length === 0) return

    const stored: StoredGameMessage[] = messages.map(m => ({
        id: m.id,
        kind: m.kind,
        text: m.text,
        authorName: m.authorName,
        authorUid: m.authorUid,
        message: m.message,
    }))

    const hasChat = stored.some(m => m.kind === "guess" || m.kind === "question" || m.kind === "answer")
    if (!hasChat && !solvedWord) return

    const threads = await loadGameThreads()
    const threadId = `group-${groupId}`
    const existing = threads.find(t => t.id === threadId)
    const now = Date.now()

    const sessionMessages: StoredGameMessage[] = [
        ...(existing && existing.messages.length > 0
            ? [{ id: now, kind: "system" as const, text: "— New game —" }]
            : []),
        ...stored,
    ]

    if (solvedWord) {
        sessionMessages.push({
            id: now + 1,
            kind: "system",
            text: `The word was "${solvedWord}".`,
        })
    }

    const mergedMessages = existing
        ? [...existing.messages, ...sessionMessages]
        : sessionMessages

    const thread: GameThread = {
        id: threadId,
        kind: "group",
        title: groupName,
        preview: lastPreview(mergedMessages),
        participantUids: players.map(p => p.uid),
        participants: players.map(p => ({ name: p.displayName, uid: p.uid })),
        messages: mergedMessages,
        updatedAt: now,
        roomCode,
        solvedWord,
    }

    const next = [thread, ...threads.filter(t => t.id !== threadId)]
    await persistThreads(next)
}
