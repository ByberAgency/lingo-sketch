import { useCallback, useEffect, useState } from "react"
import { View, StyleSheet } from "react-native"
import { DEFAULT_SETTINGS } from "./constants"
import { DOODLES, pickRounds } from "./doodles"
import { loadState, saveState } from "./storage"
import type { RoundResult, Screen, Stats } from "./types"
import { LobbyScreen } from "../screens/LobbyScreen"
import { PLAY_SOLO_MODE, PLAY_SOLO_ROUND_COUNT } from "../play-solo/constants"
import { PlaySoloRecapScreen } from "../play-solo/PlaySoloRecapScreen"
import { PlaySoloScreen } from "../play-solo/PlaySoloScreen"
import { Play1v1Screen } from "../play-1v1/Play1v1Screen"
import { RoomScreen } from "../play-1v1/RoomScreen"
import { GroupRoomScreen, PlayGroupScreen } from "../play-group"
import { useAuthMe } from "../mobile-api"
import { getTheme } from "../theme/colors"

function bumpStats(stats: Stats, xp: number): Stats {
    const nx = stats.xp + xp
    return { ...stats, xp: nx, level: Math.floor(nx / 100) + 1 }
}

function normalizeScreen(screen?: string): Screen {
    if (screen === "game") return "playSolo"
    if (
        screen === "lobby" ||
        screen === "playSolo" ||
        screen === "recap" ||
        screen === "play1v1Room" ||
        screen === "play1v1" ||
        screen === "playGroupRoom" ||
        screen === "playGroup"
    ) {
        return screen
    }
    return "lobby"
}

export function GameApp() {
    const authMe = useAuthMe()
    const settings = DEFAULT_SETTINGS
    const theme = getTheme(settings.theme)

    const [screen, setScreen] = useState<Screen>("lobby")
    const [roundIdxs, setRoundIdxs] = useState<number[]>([])
    const [roundIndex, setRoundIndex] = useState(0)
    const [results, setResults] = useState<RoundResult[]>([])
    const [stats, setStats] = useState<Stats>({ xp: 120, level: 2, streak: 5 })
    const [hydrated, setHydrated] = useState(false)
    const [roomId, setRoomId] = useState<string | null>(null)
    const [roomCode, setRoomCode] = useState<string | null>(null)
    const [groupName, setGroupName] = useState<string | null>(null)

    useEffect(() => {
        loadState().then(saved => {
            if (saved.screen) setScreen(normalizeScreen(saved.screen))
            if (saved.roundIdxs) setRoundIdxs(saved.roundIdxs)
            if (saved.roundIndex != null) setRoundIndex(saved.roundIndex)
            if (saved.results) setResults(saved.results)
            if (saved.stats) setStats(saved.stats)
            setHydrated(true)
        })
    }, [])

    useEffect(() => {
        if (!hydrated) return
        saveState({ screen, roundIdxs, roundIndex, results, stats })
    }, [screen, roundIdxs, roundIndex, results, stats, hydrated])

    const rounds = roundIdxs.map(i => DOODLES[i])

    const startPlaySolo = useCallback(() => {
        setRoundIdxs(pickRounds(PLAY_SOLO_ROUND_COUNT))
        setRoundIndex(0)
        setResults([])
        setScreen("playSolo")
    }, [])

    const startPlay1v1 = useCallback(() => {
        setScreen("play1v1Room")
    }, [])

    const startPlayGroup = useCallback(() => {
        setScreen("playGroupRoom")
    }, [])

    const enterRoom = useCallback((id: string, code: string) => {
        setRoomId(id)
        setRoomCode(code)
        setGroupName(null)
        setScreen("play1v1")
    }, [])

    const enterGroupRoom = useCallback((id: string, code: string, name?: string | null) => {
        setRoomId(id)
        setRoomCode(code)
        setGroupName(name ?? null)
        setScreen("playGroup")
    }, [])

    const exit1v1 = useCallback(() => {
        setRoomId(null)
        setRoomCode(null)
        setGroupName(null)
        setScreen("lobby")
    }, [])

    const exitGroup = useCallback(() => {
        setRoomId(null)
        setRoomCode(null)
        setGroupName(null)
        setScreen("lobby")
    }, [])

    const handleSolve = useCallback((r: RoundResult) => {
        setResults(prev => [...prev, r])
        if (r.by === "You") setStats(s => bumpStats(s, r.xp))
    }, [])

    const handleNext = useCallback(
        (kind: "exit" | "next") => {
            if (kind === "exit") {
                setScreen("lobby")
                return
            }
            if (roundIndex < rounds.length - 1) {
                setRoundIndex(i => i + 1)
            } else {
                setScreen("recap")
            }
        },
        [roundIndex, rounds.length],
    )

    if (!hydrated) {
        return <View style={[styles.root, { backgroundColor: theme.bg }]} />
    }

    return (
        <View style={[styles.root, { backgroundColor: theme.bg }]}>
            {screen === "lobby" && (
                <LobbyScreen
                    settings={settings}
                    stats={stats}
                    onPlaySolo={startPlaySolo}
                    onPlay1v1={startPlay1v1}
                    onPlayGroup={startPlayGroup}
                    displayName={authMe.data?.displayName}
                />
            )}
            {screen === "play1v1Room" && (
                <RoomScreen
                    settings={settings}
                    onEnterRoom={enterRoom}
                    onBack={() => setScreen("lobby")}
                />
            )}
            {screen === "playGroupRoom" && (
                <GroupRoomScreen
                    settings={settings}
                    onEnterRoom={enterGroupRoom}
                    onBack={() => setScreen("lobby")}
                />
            )}
            {screen === "playGroup" && roomId && roomCode && (
                <PlayGroupScreen
                    settings={settings}
                    roomId={roomId}
                    roomCode={roomCode}
                    groupName={groupName}
                    displayName={authMe.data?.displayName}
                    onExit={exitGroup}
                />
            )}
            {screen === "play1v1" && roomId && roomCode && (
                <Play1v1Screen
                    settings={settings}
                    roomId={roomId}
                    roomCode={roomCode}
                    displayName={authMe.data?.displayName}
                    onExit={exit1v1}
                />
            )}
            {screen === "playSolo" && rounds.length > 0 && (
                <PlaySoloScreen
                    key={`${PLAY_SOLO_MODE.id}-${roundIndex}`}
                    settings={settings}
                    rounds={rounds}
                    roundIndex={roundIndex}
                    onSolve={handleSolve}
                    onNext={handleNext}
                />
            )}
            {screen === "recap" && (
                <PlaySoloRecapScreen
                    settings={settings}
                    results={results}
                    stats={stats}
                    onAgain={startPlaySolo}
                    onHome={() => setScreen("lobby")}
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1 },
})
