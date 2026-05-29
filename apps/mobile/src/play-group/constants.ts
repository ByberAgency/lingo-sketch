import type { GameMode } from "../game/types"

export const PLAY_GROUP_MODE: GameMode = {
    id: "play-group",
    title: "Play as Group",
    subtitle: "Create a group, invite friends, and draw together",
    tag: "3–8 players",
    shortLabel: "Group",
    botDraws: false,
    yesno: true,
}

export const PLAY_GROUP_TIMER_SECONDS = 90
export const PLAY_GROUP_MIN_PLAYERS = 3
