import type { Stroke } from "../game/types"

export type GamePhase = "waiting" | "wordPick" | "drawing" | "guessing" | "solved"

export type WordSuggestion = {
    word: string
    article: string
    hint: string
}

export type RoomPlayer = {
    uid: string
    displayName: string
    connected: boolean
}

export type RoomChatMessage = {
    id: number
    kind: "system" | "guess" | "question" | "answer" | "guard"
    text: string
    authorUid?: string
    authorName?: string
    originalText?: string
    corrected?: string | null
    errors?: import("../game/types").GrammarError[]
    grammarOk?: boolean
    message?: string
}

export type RoomMode = "1v1" | "group"

export type RoomState = {
    roomId: string
    code: string
    mode: RoomMode
    groupName: string | null
    maxPlayers: number
    minPlayers: number
    phase: GamePhase
    players: RoomPlayer[]
    invitedEmails: string[]
    yourRole: "drawer" | "guesser" | "spectator"
    isHost: boolean
    canStart: boolean
    drawerUid: string | null
    hint: string | null
    word: string | null
    wordSuggestions: WordSuggestion[] | null
    strokes: Stroke[]
    messages: RoomChatMessage[]
    secondsLeft: number | null
    solvedBy: string | null
    solvedWord: string | null
}
