import type { WordEntry } from "./words"
import type { GrammarError } from "../grammar/grammar.types"

export type Stroke = { pts: [number, number][]; w: number }

export type GamePhase = "waiting" | "wordPick" | "drawing" | "guessing" | "solved"

export type RoomMode = "1v1" | "group"

export const GROUP_MAX_PLAYERS = 8
export const GROUP_MIN_PLAYERS = 3

export type RoomPlayer = {
    uid: string
    displayName: string
    email: string
    socketId: string | null
}

export type ChatMessage = {
    id: number
    kind: "system" | "guess" | "question" | "answer" | "guard"
    text: string
    authorUid?: string
    authorName?: string
    originalText?: string
    corrected?: string | null
    errors?: GrammarError[]
    grammarOk?: boolean
    message?: string
}

export type Room = {
    id: string
    code: string
    mode: RoomMode
    groupName: string | null
    maxPlayers: number
    hostUid: string
    players: RoomPlayer[]
    invitedEmails: string[]
    drawerIndex: number
    phase: GamePhase
    wordSuggestions: WordEntry[]
    selectedWord: WordEntry | null
    strokes: Stroke[]
    messages: ChatMessage[]
    messageId: number
    guessEndsAt: number | null
    solvedBy: string | null
    timerHandle: ReturnType<typeof setInterval> | null
}

export type PublicPlayer = {
    uid: string
    displayName: string
    connected: boolean
}

export type RoomStatePayload = {
    roomId: string
    code: string
    mode: RoomMode
    groupName: string | null
    maxPlayers: number
    minPlayers: number
    phase: GamePhase
    players: PublicPlayer[]
    invitedEmails: string[]
    yourRole: "drawer" | "guesser" | "spectator"
    isHost: boolean
    canStart: boolean
    drawerUid: string | null
    hint: string | null
    word: string | null
    wordSuggestions: WordEntry[] | null
    strokes: Stroke[]
    messages: ChatMessage[]
    secondsLeft: number | null
    solvedBy: string | null
    solvedWord: string | null
}

export type GroupInviteRecord = {
    id: number
    roomId: string
    roomCode: string
    email: string
    groupName: string | null
    invitedByUid: string
    status: string
    createdAt: Date
}
