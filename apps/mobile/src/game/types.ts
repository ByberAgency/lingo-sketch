import type { Theme } from "../theme/colors"

export type Player = { name: string; color: string }

export type GameMode = {
    id: "play-solo" | "play-1v1" | "play-group"
    title: string
    subtitle: string
    tag: string
    shortLabel: string
    botDraws: boolean
    yesno: boolean
}

export type Stroke = { pts: [number, number][]; w: number }

export type Doodle = {
    word: string
    article: string
    hint: string
    strokes: Stroke[]
}

export type GrammarError = {
    start: number
    end: number
    bad: string
    message: string
    type: string
}

export type GrammarCheck = {
    ok: boolean
    corrected: string
    errors: GrammarError[]
}

export type GuardBehavior = "block" | "gentle" | "inline"
export type GuardTone = "coach" | "mascot" | "neutral" | "strict"

export type GameSettings = {
    theme: "warm"
    mascot: boolean
    guardBehavior: GuardBehavior
    guardTone: GuardTone
}

export type Stats = { xp: number; level: number; streak: number }

export type RoundResult = {
    word: string
    by: string
    xp: number
    perfect: boolean
    tips: GrammarError[]
}

export type MessageAuthor = Player & { you?: boolean; bot?: boolean }

export type GameMessage = {
    id: number
    kind: "system" | "guess" | "guard" | "question" | "answer"
    text?: string
    author?: MessageAuthor
    errors?: GrammarError[]
    corrected?: string | null
    correct?: boolean
    message?: string
}

export type Screen =
    | "lobby"
    | "playSolo"
    | "recap"
    | "play1v1Room"
    | "play1v1"
    | "playGroupRoom"
    | "playGroup"

export type SavedState = {
    screen?: Screen
    roundIdxs?: number[]
    roundIndex?: number
    results?: RoundResult[]
    stats?: Stats
}

export type ThemeContext = Theme
