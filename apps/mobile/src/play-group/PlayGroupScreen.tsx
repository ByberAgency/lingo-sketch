import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import { Avatar } from "../components/Avatar"
import { Confetti } from "../components/Confetti"
import { DrawingCanvas } from "../components/DrawingCanvas"
import { GuardedInput } from "../components/GuardedInput"
import { Gus } from "../components/Gus"
import { LiveStrokeCanvas } from "../components/LiveStrokeCanvas"
import { MessageBubble } from "../components/MessageBubble"
import { TimerRing } from "../components/TimerRing"
import { WordSlots } from "../components/WordSlots"
import { useAuth } from "../auth/AuthProvider"
import { YESNO_CHIPS } from "../play-solo/answerYesNo"
import { saveGroupGameHistory } from "../game/history"
import { guardCopy } from "../game/grammar"
import { useGrammarCheck, useInviteToRoom, useStartGroupGame } from "../mobile-api"
import type { GameMessage, GameSettings, Stroke } from "../game/types"
import { useGameSocket } from "../play-1v1/useGameSocket"
import {
    PLAY_GROUP_MIN_PLAYERS,
    PLAY_GROUP_MODE,
    PLAY_GROUP_TIMER_SECONDS,
} from "./constants"
import { getTheme, inkMuted, mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"

type Props = {
    settings: GameSettings
    roomId: string
    roomCode: string
    groupName?: string | null
    displayName?: string | null
    onExit: () => void
}

export function PlayGroupScreen({
    settings,
    roomId,
    roomCode,
    groupName,
    displayName,
    onExit,
}: Props) {
    const insets = useSafeAreaInsets()
    const { user } = useAuth()
    const theme = getTheme(settings.theme)
    const mode = PLAY_GROUP_MODE

    const { connected, state, pickWord, sendStroke, finishDrawing, sendChat } = useGameSocket({
        roomId,
        enabled: true,
    })

    const inviteToRoom = useInviteToRoom()
    const startGroup = useStartGroupGame()

    const [value, setValue] = useState("")
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteError, setInviteError] = useState<string | null>(null)
    const [localStrokes, setLocalStrokes] = useState<Stroke[]>([])
    const [confetti, setConfetti] = useState(false)
    const feedRef = useRef<ScrollView>(null)

    const copy = guardCopy(settings.guardTone)
    const { check, checking, refresh } = useGrammarCheck(value)

    const role = state?.yourRole ?? "spectator"
    const phase = state?.phase ?? "waiting"
    const isDrawer = role === "drawer"
    const isGuesser = role === "guesser"
    const isHost = state?.isHost ?? false
    const timer = state?.secondsLeft ?? PLAY_GROUP_TIMER_SECONDS
    const solvedWord = state?.solvedWord ?? state?.word ?? "?????"
    const title = state?.groupName ?? groupName ?? "Group"
    const drawerName =
        state?.players.find(p => p.uid === state.drawerUid)?.displayName ?? "Drawer"
    const guesserCount = state
        ? state.players.filter(p => p.uid !== state.drawerUid).length
        : 0

    useEffect(() => {
        if (phase === "drawing" && isDrawer) {
            setLocalStrokes([])
        }
    }, [phase, isDrawer, state?.word])

    useEffect(() => {
        feedRef.current?.scrollToEnd({ animated: true })
    }, [state?.messages, phase])

    useEffect(() => {
        if (phase !== "solved" || !state?.solvedBy || !displayName) return
        if (state.solvedBy === displayName) {
            setConfetti(true)
            const t = setTimeout(() => setConfetti(false), 2000)
            return () => clearTimeout(t)
        }
    }, [phase, state?.solvedBy, displayName])

    const handleStroke = useCallback(
        (stroke: (typeof localStrokes)[number]) => {
            setLocalStrokes(prev => [...prev, stroke])
            sendStroke(stroke)
        },
        [sendStroke],
    )

    const handleExit = useCallback(async () => {
        if (state && user?.uid && state.phase !== "waiting") {
            await saveGroupGameHistory({
                myUid: user.uid,
                groupName: title,
                groupId: roomId,
                players: state.players,
                messages: state.messages,
                solvedWord: state.solvedWord,
                roomCode,
            })
        }
        onExit()
    }, [state, user?.uid, roomCode, roomId, title, onExit])

    const handleInvite = async () => {
        const email = inviteEmail.trim().toLowerCase()
        if (!email.includes("@")) {
            setInviteError("Enter a valid email address")
            return
        }
        setInviteError(null)
        try {
            await inviteToRoom.mutateAsync({ roomId, emails: [email] })
            setInviteEmail("")
        } catch (err) {
            setInviteError(err instanceof Error ? err.message : "Could not send invite")
        }
    }

    const handleStart = async () => {
        try {
            await startGroup.mutateAsync(roomId)
        } catch (err) {
            setInviteError(err instanceof Error ? err.message : "Could not start game")
        }
    }

    const messages: GameMessage[] = useMemo(
        () =>
            (state?.messages ?? []).map(m => {
                if (m.kind === "guard") {
                    return {
                        id: m.id,
                        kind: "guard" as const,
                        corrected: m.corrected ?? m.text,
                        message: m.message,
                    }
                }
                return {
                    id: m.id,
                    kind: m.kind,
                    text: m.text,
                    author: m.authorName
                        ? {
                              name: m.authorName,
                              color: m.authorUid === user?.uid ? theme.primary : theme.guard,
                              you: m.authorUid === user?.uid,
                          }
                        : undefined,
                    errors: m.errors,
                    corrected: m.corrected,
                }
            }),
        [state?.messages, user?.uid, theme.primary, theme.guard],
    )

    const send = async () => {
        const text = value.trim()
        if (!text || phase !== "guessing" || !isGuesser) return
        const c = checking ? await refresh() : check
        if (settings.guardBehavior === "block" && !c.ok) return
        sendChat(text)
        setValue("")
    }

    const canSend =
        phase === "guessing" &&
        isGuesser &&
        value.trim().length > 0 &&
        !checking &&
        (settings.guardBehavior !== "block" || check.ok)

    const showSuggest =
        phase === "guessing" &&
        isGuesser &&
        value.trim().length > 0 &&
        !check.ok &&
        (settings.guardBehavior === "block" || settings.guardBehavior === "inline") &&
        settings.mascot

    if (!connected || !state) {
        return (
            <View style={[styles.loading, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: inkMuted(theme.ink) }]}>
                    Connecting to {title}…
                </Text>
            </View>
        )
    }

    const canvasStrokes = isDrawer ? localStrokes : state.strokes

    return (
        <View style={[styles.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.topBar}>
                    <Pressable
                        style={[styles.backBtn, { backgroundColor: theme.surface }]}
                        onPress={handleExit}
                    >
                        <Svg width={9} height={15} viewBox="0 0 9 15">
                            <Path
                                d="M7.5 1L1.5 7.5l6 6.5"
                                stroke={theme.ink}
                                strokeWidth={2.4}
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>
                    </Pressable>
                    <View style={styles.topCenter}>
                        <Text style={[styles.roundLabel, { color: inkMuted(theme.ink) }]}>
                            {mode.shortLabel} · {title}
                        </Text>
                        {phase === "guessing" || phase === "solved" ? (
                            <WordSlots word={solvedWord} solved={phase === "solved"} theme={theme} />
                        ) : (
                            <Text style={[styles.phaseLabel, { color: theme.ink }]}>
                                {phase === "waiting"
                                    ? `Code ${roomCode}`
                                    : phase === "wordPick"
                                      ? "Pick a word to draw"
                                      : "Drawing time"}
                            </Text>
                        )}
                    </View>
                    <View style={styles.timerWrap}>
                        {phase === "guessing" ? (
                            <TimerRing seconds={timer} max={PLAY_GROUP_TIMER_SECONDS} theme={theme} />
                        ) : (
                            <View style={{ width: 44 }} />
                        )}
                    </View>
                </View>

                <View style={styles.hintRow}>
                    {state.hint ? (
                        <View
                            style={[
                                styles.hint,
                                { backgroundColor: mixColor(theme.amber, theme.surface, 0.2) },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.hintText,
                                    { color: mixColor(theme.amber, theme.ink, 0.35) },
                                ]}
                                numberOfLines={1}
                            >
                                💡 {state.hint}
                            </Text>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }} />
                    )}
                    <View style={styles.avatars}>
                        {state.players.map((p, i) => (
                            <View key={p.uid} style={i > 0 ? { marginLeft: -8 } : undefined}>
                                <Avatar
                                    name={p.displayName}
                                    color={p.uid === state.drawerUid ? theme.guard : theme.primary}
                                    size={26}
                                    ring
                                    bgColor={theme.bg}
                                />
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {phase === "waiting" ? (
                <ScrollView
                    style={styles.waitScroll}
                    contentContainerStyle={[
                        styles.waitContent,
                        { paddingBottom: insets.bottom + 24 },
                    ]}
                >
                    <Text style={[styles.waitTitle, { color: theme.ink }]}>{title}</Text>
                    <Text style={[styles.waitCode, { color: theme.guard }]}>{roomCode}</Text>
                    <Text style={[styles.waitSub, { color: inkMuted(theme.ink) }]}>
                        {state.players.length} / {state.maxPlayers} players · need{" "}
                        {state.minPlayers} to start
                    </Text>

                    <View style={styles.playerList}>
                        {state.players.map(p => (
                            <View
                                key={p.uid}
                                style={[styles.playerRow, { backgroundColor: theme.surface }]}
                            >
                                <Avatar name={p.displayName} color={theme.primary} size={36} />
                                <Text style={[styles.playerName, { color: theme.ink }]}>
                                    {p.displayName}
                                    {p.uid === user?.uid ? " (you)" : ""}
                                </Text>
                                <Text
                                    style={[
                                        styles.playerStatus,
                                        { color: p.connected ? theme.correct : inkMuted(theme.ink) },
                                    ]}
                                >
                                    {p.connected ? "online" : "away"}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {state.invitedEmails.length > 0 ? (
                        <View style={styles.invitedBlock}>
                            <Text style={[styles.invitedLabel, { color: inkMuted(theme.ink) }]}>
                                Invited
                            </Text>
                            <Text style={[styles.invitedEmails, { color: theme.ink }]}>
                                {state.invitedEmails.join(", ")}
                            </Text>
                        </View>
                    ) : null}

                    {isHost ? (
                        <View style={styles.inviteForm}>
                            <Text style={[styles.inviteLabel, { color: inkMuted(theme.ink) }]}>
                                Invite by registered email
                            </Text>
                            <View style={styles.inviteRow}>
                                <TextInput
                                    style={[
                                        styles.inviteInput,
                                        {
                                            backgroundColor: theme.surface,
                                            color: theme.ink,
                                            borderColor: mixColor(theme.ink, theme.surface, 0.12),
                                        },
                                    ]}
                                    value={inviteEmail}
                                    onChangeText={setInviteEmail}
                                    placeholder="friend@email.com"
                                    placeholderTextColor={inkMuted(theme.ink, 0.35)}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                <Pressable
                                    style={[
                                        styles.inviteBtn,
                                        {
                                            backgroundColor: theme.guard,
                                            opacity: inviteToRoom.isPending ? 0.6 : 1,
                                        },
                                    ]}
                                    onPress={handleInvite}
                                    disabled={inviteToRoom.isPending}
                                >
                                    <Text style={styles.inviteBtnText}>Invite</Text>
                                </Pressable>
                            </View>
                            {inviteError ? (
                                <Text style={[styles.inviteError, { color: theme.primary }]}>
                                    {inviteError}
                                </Text>
                            ) : null}

                            <Pressable
                                style={[
                                    styles.startBtn,
                                    {
                                        backgroundColor: theme.primary,
                                        opacity: state.canStart && !startGroup.isPending ? 1 : 0.45,
                                    },
                                ]}
                                onPress={handleStart}
                                disabled={!state.canStart || startGroup.isPending}
                            >
                                {startGroup.isPending ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.startBtnText}>
                                        Start game ({state.players.length} players)
                                    </Text>
                                )}
                            </Pressable>
                            {!state.canStart ? (
                                <Text style={[styles.startHint, { color: inkMuted(theme.ink, 0.45) }]}>
                                    Need at least {PLAY_GROUP_MIN_PLAYERS} players in the room
                                </Text>
                            ) : null}
                        </View>
                    ) : (
                        <Text style={[styles.hostWait, { color: inkMuted(theme.ink) }]}>
                            Waiting for the host to start the game…
                        </Text>
                    )}
                </ScrollView>
            ) : null}

            {phase === "wordPick" && isDrawer && state.wordSuggestions ? (
                <View style={styles.wordPick}>
                    <Text style={[styles.wordPickTitle, { color: theme.ink }]}>
                        Choose a word to draw
                    </Text>
                    {state.wordSuggestions.map(w => (
                        <Pressable
                            key={w.word}
                            style={[styles.wordBtn, { backgroundColor: theme.surface }]}
                            onPress={() => pickWord(w.word)}
                        >
                            <Text style={[styles.wordBtnText, { color: theme.ink }]}>
                                {w.article} {w.word}
                            </Text>
                            <Text style={[styles.wordBtnHint, { color: inkMuted(theme.ink) }]}>
                                {w.hint}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            ) : phase !== "waiting" ? (
                <>
                    <View style={styles.canvasWrap}>
                        <View style={styles.paper}>
                            <View style={styles.canvasInner}>
                                {isDrawer && phase === "drawing" ? (
                                    <DrawingCanvas
                                        strokes={canvasStrokes}
                                        onStroke={handleStroke}
                                    />
                                ) : (
                                    <LiveStrokeCanvas strokes={canvasStrokes} />
                                )}
                            </View>
                            <View style={styles.drawerChip}>
                                {settings.mascot && (
                                    <Gus mood={phase === "solved" ? "cheer" : "think"} size={26} />
                                )}
                                <Text style={[styles.drawerText, { color: theme.ink }]}>
                                    {phase === "wordPick"
                                        ? `${drawerName} is picking a word…`
                                        : phase === "drawing"
                                          ? `${drawerName} is drawing…`
                                          : `${drawerName}'s drawing`}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {phase === "drawing" && isDrawer ? (
                        <Pressable
                            style={[styles.doneBtn, { backgroundColor: theme.primary }]}
                            onPress={finishDrawing}
                        >
                            <Text style={styles.doneBtnText}>Done drawing</Text>
                        </Pressable>
                    ) : null}

                    {phase === "wordPick" && !isDrawer ? (
                        <View style={styles.waitPanel}>
                            <Text style={[styles.waitText, { color: inkMuted(theme.ink) }]}>
                                {drawerName} is choosing a word…
                            </Text>
                        </View>
                    ) : null}

                    {phase === "drawing" && isGuesser ? (
                        <View style={styles.waitPanel}>
                            <Text style={[styles.waitText, { color: inkMuted(theme.ink) }]}>
                                Watch the drawing — guessing starts soon!
                            </Text>
                        </View>
                    ) : null}

                    {phase === "drawing" && isDrawer ? (
                        <View style={styles.wordBanner}>
                            <Text style={[styles.wordBannerLabel, { color: inkMuted(theme.ink) }]}>
                                Your word
                            </Text>
                            <Text style={[styles.wordBannerWord, { color: theme.ink }]}>
                                {state.word}
                            </Text>
                        </View>
                    ) : null}

                    <ScrollView
                        ref={feedRef}
                        style={styles.feed}
                        contentContainerStyle={styles.feedContent}
                    >
                        {messages.map(m => (
                            <MessageBubble
                                key={m.id}
                                message={m}
                                settings={settings}
                                theme={theme}
                                copy={copy}
                            />
                        ))}
                    </ScrollView>
                </>
            ) : null}

            {phase === "solved" ? (
                <View
                    style={[
                        styles.solvedPanel,
                        { backgroundColor: theme.surface, paddingBottom: insets.bottom + 18 },
                    ]}
                >
                    <View style={styles.solvedRow}>
                        {settings.mascot && <Gus mood="cheer" size={56} />}
                        <View style={styles.solvedBody}>
                            <Text style={[styles.solvedTitle, { color: theme.correct }]}>
                                {state.solvedBy ? `${state.solvedBy} got it!` : "Time's up!"}
                            </Text>
                            <Text style={[styles.solvedSub, { color: inkMuted(theme.ink, 0.4) }]}>
                                The word was{" "}
                                <Text style={{ color: theme.ink, fontFamily: fonts.bodyExtra }}>
                                    "{state.solvedWord}"
                                </Text>
                            </Text>
                        </View>
                    </View>
                    <Pressable
                        style={[styles.nextBtn, { backgroundColor: theme.primary }]}
                        onPress={handleExit}
                    >
                        <Text style={styles.nextBtnText}>Back to lobby</Text>
                    </Pressable>
                </View>
            ) : phase === "guessing" && isGuesser ? (
                <View style={[styles.inputArea, { paddingBottom: insets.bottom + 16 }]}>
                    {showSuggest && (
                        <View
                            style={[
                                styles.suggest,
                                {
                                    backgroundColor: mixColor(theme.guard, theme.surface, 0.1),
                                    borderColor: mixColor(theme.guard, theme.surface, 0.35),
                                },
                            ]}
                        >
                            {settings.mascot && <Gus mood="think" size={34} />}
                            <View style={styles.suggestBody}>
                                <Text style={[styles.suggestLead, { color: theme.guard }]}>
                                    {copy.lead}
                                </Text>
                                <Text style={[styles.suggestText, { color: theme.ink }]}>
                                    "{check.corrected}"
                                </Text>
                            </View>
                            <Pressable
                                style={[styles.useBtn, { backgroundColor: theme.guard }]}
                                onPress={() => setValue(check.corrected)}
                            >
                                <Text style={styles.useBtnText}>Use ✓</Text>
                            </Pressable>
                        </View>
                    )}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chips}
                    >
                        {YESNO_CHIPS.map(q => (
                            <Pressable
                                key={q}
                                style={[
                                    styles.chip,
                                    {
                                        backgroundColor: mixColor(theme.amber, theme.surface, 0.18),
                                        borderColor: mixColor(theme.amber, theme.surface, 0.35),
                                    },
                                ]}
                                onPress={() => setValue(q)}
                            >
                                <Text style={[styles.chipText, { color: theme.ink }]}>{q}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                    <GuardedInput
                        value={value}
                        onChange={setValue}
                        onSend={send}
                        errors={check.errors}
                        showUnderline={settings.guardBehavior === "inline"}
                        canSend={canSend}
                        checking={checking}
                        placeholder="Ask a yes/no question or guess the word…"
                        theme={theme}
                    />
                </View>
            ) : phase === "guessing" && isDrawer ? (
                <View style={[styles.waitPanel, { paddingBottom: insets.bottom + 16 }]}>
                    <Text style={[styles.waitText, { color: inkMuted(theme.ink) }]}>
                        {guesserCount > 1
                            ? "The guessers are asking questions…"
                            : "Your friend is guessing… answer their questions!"}
                    </Text>
                </View>
            ) : null}

            <Confetti go={confetti} />
        </View>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loadingText: { fontFamily: fonts.bodySemi, fontSize: 14 },
    header: { flexShrink: 0 },
    topBar: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 10,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        marginTop: 2,
    },
    topCenter: { flex: 1, minWidth: 0, alignItems: "center" },
    timerWrap: { flexShrink: 0, marginTop: 2 },
    roundLabel: {
        fontSize: 11.5,
        fontFamily: fonts.bodyExtra,
        letterSpacing: 0.5,
        textAlign: "center",
    },
    phaseLabel: {
        fontFamily: fonts.display,
        fontSize: 16,
        marginTop: 4,
        textAlign: "center",
    },
    hintRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    hint: {
        flex: 1,
        minWidth: 0,
        borderRadius: 999,
        paddingHorizontal: 11,
        paddingVertical: 5,
    },
    hintText: { fontSize: 13, fontFamily: fonts.bodyExtra },
    avatars: { flexDirection: "row", alignItems: "center", flexShrink: 0 },
    waitScroll: { flex: 1 },
    waitContent: { paddingHorizontal: 18, paddingTop: 8, gap: 12 },
    waitTitle: { fontFamily: fonts.display, fontSize: 24, textAlign: "center" },
    waitCode: {
        fontFamily: fonts.display,
        fontSize: 36,
        letterSpacing: 8,
        textAlign: "center",
    },
    waitSub: { fontFamily: fonts.body, fontSize: 14, textAlign: "center" },
    playerList: { gap: 8, marginTop: 8 },
    playerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        padding: 12,
    },
    playerName: { flex: 1, fontFamily: fonts.bodySemi, fontSize: 15 },
    playerStatus: { fontFamily: fonts.body, fontSize: 12 },
    invitedBlock: { marginTop: 4 },
    invitedLabel: { fontFamily: fonts.bodySemi, fontSize: 12 },
    invitedEmails: { fontFamily: fonts.body, fontSize: 14, marginTop: 2 },
    inviteForm: { marginTop: 12, gap: 10 },
    inviteLabel: { fontFamily: fonts.bodySemi, fontSize: 13 },
    inviteRow: { flexDirection: "row", gap: 8 },
    inviteInput: {
        flex: 1,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontFamily: fonts.body,
        fontSize: 15,
    },
    inviteBtn: {
        borderRadius: 14,
        paddingHorizontal: 18,
        justifyContent: "center",
    },
    inviteBtnText: { color: "#fff", fontFamily: fonts.bodyExtra, fontSize: 14 },
    inviteError: { fontFamily: fonts.bodySemi, fontSize: 13, textAlign: "center" },
    startBtn: {
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 8,
    },
    startBtnText: { color: "#fff", fontFamily: fonts.display, fontSize: 17 },
    startHint: { fontFamily: fonts.body, fontSize: 13, textAlign: "center" },
    hostWait: {
        fontFamily: fonts.bodySemi,
        fontSize: 15,
        textAlign: "center",
        marginTop: 24,
    },
    canvasWrap: { paddingHorizontal: 16, flexShrink: 0 },
    paper: {
        backgroundColor: "#fffef9",
        borderRadius: 22,
        aspectRatio: 1.5,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 22,
        elevation: 3,
    },
    canvasInner: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: "4%",
    },
    drawerChip: {
        position: "absolute",
        top: 10,
        left: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        backgroundColor: "rgba(255,255,255,0.85)",
        paddingLeft: 5,
        paddingRight: 11,
        paddingVertical: 5,
        borderRadius: 999,
    },
    drawerText: { fontSize: 12.5, fontFamily: fonts.bodyExtra },
    doneBtn: {
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: "center",
    },
    doneBtnText: { color: "#fff", fontFamily: fonts.display, fontSize: 16 },
    wordBanner: { alignItems: "center", paddingVertical: 8 },
    wordBannerLabel: { fontFamily: fonts.body, fontSize: 12 },
    wordBannerWord: { fontFamily: fonts.display, fontSize: 22, marginTop: 2 },
    wordPick: { flex: 1, paddingHorizontal: 18, paddingTop: 8, gap: 10 },
    wordPickTitle: {
        fontFamily: fonts.display,
        fontSize: 20,
        marginBottom: 6,
        textAlign: "center",
    },
    wordBtn: {
        borderRadius: 18,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    wordBtnText: { fontFamily: fonts.display, fontSize: 20 },
    wordBtnHint: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
    waitPanel: { paddingHorizontal: 18, paddingVertical: 10, alignItems: "center" },
    waitText: { fontFamily: fonts.bodySemi, fontSize: 14, textAlign: "center" },
    feed: { flex: 1, minHeight: 0 },
    feedContent: { paddingHorizontal: 14, paddingVertical: 12, gap: 9 },
    inputArea: { paddingHorizontal: 14, paddingTop: 6 },
    chips: { flexDirection: "row", gap: 8, paddingBottom: 9 },
    chip: {
        borderWidth: 1.5,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    chipText: { fontFamily: fonts.bodyExtra, fontSize: 13 },
    suggest: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1.5,
        borderRadius: 18,
        padding: 12,
        marginBottom: 9,
    },
    suggestBody: { flex: 1, minWidth: 0 },
    suggestLead: { fontSize: 11.5, fontFamily: fonts.bodyExtra },
    suggestText: { fontSize: 14, fontFamily: fonts.body, marginTop: 1 },
    useBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
    useBtnText: { color: "#fff", fontFamily: fonts.bodyExtra, fontSize: 13 },
    solvedPanel: {
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        paddingHorizontal: 16,
        paddingTop: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 26,
        elevation: 8,
    },
    solvedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    solvedBody: { flex: 1 },
    solvedTitle: { fontFamily: fonts.display, fontSize: 20 },
    solvedSub: { fontFamily: fonts.body, fontSize: 14, marginTop: 2 },
    nextBtn: { marginTop: 14, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
    nextBtnText: { color: "#fff", fontFamily: fonts.display, fontSize: 17 },
})
