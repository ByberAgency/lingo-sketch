import { useCallback, useEffect, useRef, useState } from "react"
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import { Avatar } from "../components/Avatar"
import { Confetti } from "../components/Confetti"
import { DoodleCanvas } from "../components/DoodleCanvas"
import { GuardedInput } from "../components/GuardedInput"
import { Gus } from "../components/Gus"
import { MessageBubble } from "../components/MessageBubble"
import { TimerRing } from "../components/TimerRing"
import { WordSlots } from "../components/WordSlots"
import { PLAY_SOLO_MODE, PLAY_SOLO_TIMER_SECONDS, GUS_BOT } from "./constants"
import { answerYesNo, isYesNoQuestion, YESNO_CHIPS } from "./answerYesNo"
import { guardCopy } from "../game/grammar"
import { useGrammarCheck } from "../mobile-api"
import type {
    Doodle,
    GameMessage,
    GameSettings,
    GrammarError,
    RoundResult,
} from "../game/types"
import { getTheme, inkMuted, mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"

type Props = {
    settings: GameSettings
    rounds: Doodle[]
    roundIndex: number
    onSolve: (r: RoundResult) => void
    onNext: (kind: "exit" | "next") => void
}

function collectTips(messages: GameMessage[]): GrammarError[] {
    const seen = new Map<string, GrammarError>()
    messages.forEach(m =>
        (m.errors || []).forEach(e => {
            if (!seen.has(e.message)) seen.set(e.message, e)
        }),
    )
    return [...seen.values()].slice(0, 4)
}

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 84 : 64

export function PlaySoloScreen({ settings, rounds, roundIndex, onSolve, onNext }: Props) {
    const insets = useSafeAreaInsets()
    const theme = getTheme(settings.theme)
    const mode = PLAY_SOLO_MODE
    const doodle = rounds[roundIndex]
    const drawerName = GUS_BOT.name

    const [phase, setPhase] = useState<"draw" | "guess" | "solved">("draw")
    const [messages, setMessages] = useState<GameMessage[]>([])
    const [value, setValue] = useState("")
    const [timer, setTimer] = useState(PLAY_SOLO_TIMER_SECONDS)
    const [solvedBy, setSolvedBy] = useState<string | null>(null)
    const [perfect, setPerfect] = useState(false)
    const [confetti, setConfetti] = useState(false)
    const [keyboardOpen, setKeyboardOpen] = useState(false)

    const feedRef = useRef<ScrollView>(null)
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])
    const solvedRef = useRef(false)
    const idc = useRef(0)

    const copy = guardCopy(settings.guardTone)
    const { check, checking, refresh } = useGrammarCheck(value)

    const clearTimers = useCallback(() => {
        timers.current.forEach(clearTimeout)
        timers.current = []
    }, [])

    const later = useCallback((fn: () => void, ms: number) => {
        const id = setTimeout(fn, ms)
        timers.current.push(id)
        return id
    }, [])

    const push = useCallback((m: Omit<GameMessage, "id">) => {
        setMessages(prev => [...prev, { id: ++idc.current, ...m }])
    }, [])

    const doSolve = useCallback(
        (name: string, byYou: boolean) => {
            if (solvedRef.current) return
            solvedRef.current = true
            clearTimers()
            setSolvedBy(name)
            setPhase("solved")
            if (byYou) {
                setConfetti(true)
                later(() => setConfetti(false), 2000)
            }
        },
        [clearTimers, later],
    )

    const onDrawDone = useCallback(() => {
        setPhase("guess")
        push({
            kind: "system",
            text: "Drawing done! Ask yes/no questions or guess the word.",
        })
    }, [push])

    useEffect(() => {
        setPhase("draw")
        setMessages([])
        setValue("")
        setTimer(PLAY_SOLO_TIMER_SECONDS)
        setSolvedBy(null)
        setPerfect(false)
        setConfetti(false)
        solvedRef.current = false
        clearTimers()
        push({ kind: "system", text: `${drawerName} is drawing…` })
        return clearTimers
    }, [roundIndex, clearTimers, push, drawerName])

    useEffect(() => {
        if (phase !== "guess") return
        const iv = setInterval(() => setTimer(s => (s > 0 ? s - 1 : 0)), 1000)
        return () => clearInterval(iv)
    }, [phase])

    useEffect(() => {
        feedRef.current?.scrollToEnd({ animated: true })
    }, [messages, phase])

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"
        const show = Keyboard.addListener(showEvent, () => setKeyboardOpen(true))
        const hide = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false))
        return () => {
            show.remove()
            hide.remove()
        }
    }, [])

    useEffect(() => {
        if (keyboardOpen) {
            feedRef.current?.scrollToEnd({ animated: true })
        }
    }, [keyboardOpen])

    useEffect(() => {
        if (phase !== "guess" || timer > 0 || solvedRef.current) return
        solvedRef.current = true
        clearTimers()
        setSolvedBy(null)
        setPhase("solved")
        push({ kind: "system", text: `Time's up! The word was "${doodle.word}".` })
    }, [phase, timer, clearTimers, push, doodle.word])

    const isCorrectGuess = (text: string) => new RegExp(`\\b${doodle.word}\\b`, "i").test(text)

    const send = async () => {
        const text = value.trim()
        if (!text || phase === "solved") return
        const c = checking ? await refresh() : check
        if (settings.guardBehavior === "block" && !c.ok) return

        const gameText = c.ok ? text : c.corrected
        const question = mode.yesno && isYesNoQuestion(gameText)

        push({
            kind: question ? "question" : "guess",
            author: { name: "You", color: theme.primary, you: true },
            text: settings.guardBehavior === "gentle" ? text : gameText,
            errors: settings.guardBehavior === "gentle" ? [] : c.ok ? [] : c.errors,
            corrected: c.ok ? null : c.corrected,
        })
        setValue("")

        if (settings.guardBehavior === "gentle" && !c.ok && settings.mascot) {
            later(
                () =>
                    push({
                        kind: "guard",
                        corrected: c.corrected,
                        message: c.errors[0]?.message,
                    }),
                450,
            )
        }

        if (question) {
            later(
                () =>
                    push({
                        kind: "answer",
                        author: GUS_BOT,
                        text: answerYesNo(gameText, doodle.word),
                    }),
                700,
            )
        }

        if (!question && isCorrectGuess(gameText)) {
            setPerfect(c.ok)
            later(() => doSolve("You", true), 250)
        }
    }

    const xpGain = 20 + (perfect ? 10 : 0)
    const showUnderline = settings.guardBehavior === "inline"
    const canSend =
        phase === "guess" &&
        value.trim().length > 0 &&
        !checking &&
        (settings.guardBehavior !== "block" || check.ok)
    const showSuggest =
        phase !== "solved" &&
        value.trim().length > 0 &&
        !check.ok &&
        (settings.guardBehavior === "block" || settings.guardBehavior === "inline") &&
        settings.mascot

    const last = roundIndex >= rounds.length - 1

    return (
        <KeyboardAvoidingView
            style={[styles.root, { backgroundColor: theme.bg }]}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={TAB_BAR_HEIGHT}
        >
            <View style={[styles.content, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <View style={styles.topBar}>
                    <Pressable
                        style={[styles.backBtn, { backgroundColor: theme.surface }]}
                        onPress={() => onNext("exit")}
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
                        <Text
                            style={[styles.roundLabel, { color: inkMuted(theme.ink) }]}
                            numberOfLines={1}
                        >
                            {mode.shortLabel} · ROUND {roundIndex + 1} / {rounds.length}
                        </Text>
                    </View>
                    <View style={styles.timerWrap}>
                        <TimerRing seconds={timer} max={PLAY_SOLO_TIMER_SECONDS} theme={theme} />
                    </View>
                </View>

                {phase === "solved" && (
                    <View style={styles.wordSlotsRow}>
                        <WordSlots
                            key={`${doodle.word}-solved`}
                            word={doodle.word}
                            solved
                            theme={theme}
                        />
                    </View>
                )}

                <View style={styles.hintRow}>
                    <View
                        style={[
                            styles.hint,
                            {
                                backgroundColor: mixColor(theme.amber, theme.surface, 0.2),
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.hintText,
                                { color: mixColor(theme.amber, theme.ink, 0.35) },
                            ]}
                            numberOfLines={1}
                        >
                            💡 {doodle.hint}
                        </Text>
                    </View>
                    <View style={styles.avatars}>
                        <Avatar
                            name={GUS_BOT.name}
                            color={GUS_BOT.color}
                            bot
                            size={26}
                            ring
                            bgColor={theme.bg}
                        />
                        <View style={{ marginLeft: -8 }}>
                            <Avatar name="You" color={theme.primary} size={26} ring bgColor={theme.bg} />
                        </View>
                    </View>
                </View>
            </View>

            {!(keyboardOpen && phase === "guess") && (
                <View style={styles.canvasWrap}>
                    <View style={styles.paper}>
                        <View style={styles.canvasInner}>
                            <DoodleCanvas doodle={doodle} playing={phase === "draw"} onDone={onDrawDone} />
                        </View>
                        <View style={styles.drawerChip}>
                            <Gus mood={phase === "solved" ? "cheer" : "think"} size={26} />
                            <Text style={[styles.drawerText, { color: theme.ink }]}>
                                {phase === "draw" ? `${drawerName} is drawing…` : `${drawerName}'s drawing`}
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            <ScrollView
                ref={feedRef}
                style={styles.feed}
                contentContainerStyle={styles.feedContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
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

            {phase === "solved" ? (
                <View
                    style={[
                        styles.solvedPanel,
                        {
                            backgroundColor: theme.surface,
                            paddingBottom: insets.bottom + 18,
                        },
                    ]}
                >
                    <View style={styles.solvedRow}>
                        {settings.mascot && <Gus mood="cheer" size={56} />}
                        <View style={styles.solvedBody}>
                            <Text style={[styles.solvedTitle, { color: theme.correct }]}>
                                {solvedBy === "You"
                                    ? "You got it!"
                                    : solvedBy
                                      ? `${solvedBy} guessed it!`
                                      : "Time's up!"}
                            </Text>
                            <Text style={[styles.solvedSub, { color: inkMuted(theme.ink, 0.4) }]}>
                                The word was{" "}
                                <Text style={{ color: theme.ink, fontFamily: fonts.bodyExtra }}>
                                    "{doodle.word}"
                                </Text>
                            </Text>
                        </View>
                        {solvedBy === "You" && (
                            <View style={styles.xpBox}>
                                <Text style={[styles.xpNum, { color: theme.amber }]}>+{xpGain}</Text>
                                <Text style={[styles.xpLbl, { color: inkMuted(theme.ink) }]}>XP</Text>
                            </View>
                        )}
                    </View>
                    {solvedBy === "You" && perfect && (
                        <Text
                            style={[
                                styles.perfect,
                                {
                                    color: theme.guard,
                                    backgroundColor: mixColor(theme.guard, theme.surface, 0.1),
                                },
                            ]}
                        >
                            ✨ Perfect grammar bonus +10 XP — no mistakes!
                        </Text>
                    )}
                    <Pressable
                        style={[styles.nextBtn, { backgroundColor: theme.primary }]}
                        onPress={() => {
                            const won = solvedBy === "You"
                            onSolve({
                                word: doodle.word,
                                by: solvedBy ?? "Time's up",
                                xp: won ? xpGain : 0,
                                perfect: won && perfect,
                                tips: collectTips(messages),
                            })
                            onNext("next")
                        }}
                    >
                        <Text style={styles.nextBtnText}>{last ? "See results →" : "Next round →"}</Text>
                    </Pressable>
                </View>
            ) : (
                <View style={[styles.inputArea, { paddingBottom: keyboardOpen ? 8 : insets.bottom + 4 }]}>
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
                    {mode.yesno && phase === "guess" && (
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
                    )}
                    <GuardedInput
                        value={value}
                        onChange={setValue}
                        onSend={send}
                        errors={check.errors}
                        showUnderline={showUnderline}
                        canSend={canSend}
                        checking={checking}
                        placeholder="Ask a yes/no question or guess the word…"
                        theme={theme}
                    />
                </View>
            )}
            <Confetti go={confetti} />
            </View>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    content: { flex: 1 },
    header: {
        flexShrink: 0,
        gap: 10,
        paddingBottom: 2,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 6,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
        elevation: 2,
    },
    topCenter: { flex: 1, minWidth: 0, alignItems: "center", justifyContent: "center" },
    timerWrap: {
        flexShrink: 0,
    },
    roundLabel: {
        fontSize: 11.5,
        lineHeight: 16,
        fontFamily: fonts.bodyExtra,
        letterSpacing: 0.5,
        textAlign: "center",
    },
    wordSlotsRow: {
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        minHeight: 18,
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
        overflow: "hidden",
    },
    hintText: {
        fontSize: 13,
        fontFamily: fonts.bodyExtra,
    },
    avatars: { flexDirection: "row", alignItems: "center", flexShrink: 0 },
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
        paddingHorizontal: "18%",
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
    drawerText: {
        fontSize: 12.5,
        fontFamily: fonts.bodyExtra,
    },
    feed: { flex: 1, minHeight: 0 },
    feedContent: { paddingHorizontal: 14, paddingVertical: 12, gap: 9 },
    inputArea: {
        paddingHorizontal: 14,
        paddingTop: 6,
    },
    chips: {
        flexDirection: "row",
        gap: 8,
        paddingBottom: 9,
    },
    chip: {
        borderWidth: 1.5,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    chipText: {
        fontFamily: fonts.bodyExtra,
        fontSize: 13,
    },
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
    suggestLead: {
        fontSize: 11.5,
        fontFamily: fonts.bodyExtra,
    },
    suggestText: {
        fontSize: 14,
        fontFamily: fonts.body,
        marginTop: 1,
    },
    useBtn: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
    },
    useBtnText: {
        color: "#fff",
        fontFamily: fonts.bodyExtra,
        fontSize: 13,
    },
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
    solvedRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    solvedBody: { flex: 1 },
    solvedTitle: {
        fontFamily: fonts.display,
        fontSize: 20,
    },
    solvedSub: {
        fontFamily: fonts.body,
        fontSize: 14,
        marginTop: 2,
    },
    xpBox: { alignItems: "center" },
    xpNum: {
        fontFamily: fonts.display,
        fontSize: 26,
    },
    xpLbl: {
        fontSize: 11,
        fontFamily: fonts.bodyExtra,
    },
    perfect: {
        marginTop: 10,
        fontSize: 13,
        fontFamily: fonts.bodyExtra,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 14,
        overflow: "hidden",
    },
    nextBtn: {
        marginTop: 14,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
    },
    nextBtnText: {
        color: "#fff",
        fontFamily: fonts.display,
        fontSize: 17,
    },
})
