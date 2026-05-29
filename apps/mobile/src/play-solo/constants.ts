import type { GameMode } from "../game/types"

export const PLAY_SOLO_MODE: GameMode = {
    id: "play-solo",
    title: "Play Solo",
    subtitle: "Gus draws — ask questions & guess the word",
    tag: "Solo",
    shortLabel: "PLAY SOLO",
    botDraws: true,
    yesno: true,
}

export const PLAY_SOLO_ROUND_COUNT = 2
export const PLAY_SOLO_TIMER_SECONDS = 90

export const GUS_BOT = { name: "Gus", color: "#7C5CFF", bot: true as const }
