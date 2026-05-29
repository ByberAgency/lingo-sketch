import type { GameMode } from "../game/types"

export const PLAY_1V1_MODE: GameMode = {
    id: "play-1v1",
    title: "Play with a Friend",
    subtitle: "Draw for a friend or guess their word",
    tag: "2 players",
    shortLabel: "1:1",
    botDraws: false,
    yesno: true,
}

export const PLAY_1V1_TIMER_SECONDS = 90
