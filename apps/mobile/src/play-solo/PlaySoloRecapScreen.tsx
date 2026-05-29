import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Gus } from "../components/Gus"
import { checkGrammar } from "../game/grammar"
import type { GameSettings, RoundResult, Stats } from "../game/types"
import { getTheme, inkMuted, mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"

type Props = {
    settings: GameSettings
    results: RoundResult[]
    stats: Stats
    onAgain: () => void
    onHome: () => void
}

export function PlaySoloRecapScreen({ settings, results, stats, onAgain, onHome }: Props) {
    const insets = useSafeAreaInsets()
    const theme = getTheme(settings.theme)
    const totalXp = results.reduce((n, r) => n + (r.by === "You" ? r.xp : 0), 0)
    const youSolved = results.filter(r => r.by === "You").length

    const tipMap = new Map<string, (typeof results)[0]["tips"][0]>()
    results.forEach(r =>
        (r.tips || []).forEach(e => {
            if (!tipMap.has(e.message)) tipMap.set(e.message, e)
        }),
    )
    const tips = [...tipMap.values()]

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.bg }}
            contentContainerStyle={{
                paddingTop: insets.top + 24,
                paddingBottom: insets.bottom + 30,
            }}
        >
            <View style={styles.hero}>
                {settings.mascot && <Gus mood="cheer" size={84} />}
                <Text style={[styles.title, { color: theme.ink }]}>Great game!</Text>
                <Text style={[styles.sub, { color: inkMuted(theme.ink, 0.42) }]}>
                    You solved {youSolved} of {results.length} rounds
                </Text>
            </View>

            <View style={styles.tiles}>
                <StatTile big={`+${totalXp}`} label="XP earned" color={theme.amber} theme={theme} />
                <StatTile
                    big={`${stats.streak}`}
                    label="Day streak"
                    color={theme.primary}
                    theme={theme}
                />
                <StatTile big={`${tips.length}`} label="Tips learned" color={theme.guard} theme={theme} />
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>Words this game</Text>
                {results.map((r, i) => (
                    <View
                        key={i}
                        style={[styles.wordRow, { backgroundColor: theme.surface }]}
                    >
                        <View
                            style={[
                                styles.wordIcon,
                                {
                                    backgroundColor:
                                        r.by === "You"
                                            ? theme.correct
                                            : mixColor(theme.ink, theme.surface, 0.12),
                                },
                            ]}
                        >
                            <Text
                                style={{
                                    color: r.by === "You" ? "#fff" : theme.ink,
                                    fontFamily: fonts.bodyExtra,
                                    fontSize: 16,
                                }}
                            >
                                {r.by === "You" ? "✓" : "·"}
                            </Text>
                        </View>
                        <Text style={[styles.wordText, { color: theme.ink }]}>{r.word}</Text>
                        <Text style={[styles.wordMeta, { color: inkMuted(theme.ink) }]}>
                            {r.by === "You" ? (r.perfect ? "Perfect!" : "Solved") : `by ${r.by}`}
                        </Text>
                    </View>
                ))}
            </View>

            {tips.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.tipsHead}>
                        {settings.mascot && <Gus mood="happy" size={30} />}
                        <Text style={[styles.sectionTitle, { color: theme.ink, marginBottom: 0 }]}>
                            Grammar you practiced
                        </Text>
                    </View>
                    {tips.map((e, i) => (
                        <View
                            key={i}
                            style={[
                                styles.tipCard,
                                {
                                    backgroundColor: mixColor(theme.guard, theme.surface, 0.09),
                                    borderColor: mixColor(theme.guard, theme.surface, 0.22),
                                },
                            ]}
                        >
                            <Text style={[styles.tipMsg, { color: theme.ink }]}>{e.message}</Text>
                            <Text style={styles.tipFix}>
                                <Text
                                    style={{
                                        textDecorationLine: "line-through",
                                        color: inkMuted(theme.ink, 0.45),
                                    }}
                                >
                                    {e.bad}
                                </Text>
                                <Text style={{ color: theme.guard }}> → </Text>
                                <Text style={{ color: theme.correct }}>
                                    {checkGrammar(e.bad).corrected}
                                </Text>
                            </Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.actions}>
                <Pressable
                    style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
                    onPress={onAgain}
                >
                    <Text style={styles.primaryBtnText}>Play again</Text>
                </Pressable>
                <Pressable style={styles.secondaryBtn} onPress={onHome}>
                    <Text style={[styles.secondaryBtnText, { color: theme.ink }]}>Back to home</Text>
                </Pressable>
            </View>
        </ScrollView>
    )
}

function StatTile({
    big,
    label,
    color,
    theme,
}: {
    big: string
    label: string
    color: string
    theme: ReturnType<typeof getTheme>
}) {
    return (
        <View style={[styles.tile, { backgroundColor: theme.surface }]}>
            <Text style={[styles.tileBig, { color }]}>{big}</Text>
            <Text style={[styles.tileLabel, { color: inkMuted(theme.ink) }]}>{label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    hero: {
        alignItems: "center",
        paddingHorizontal: 24,
    },
    title: {
        fontFamily: fonts.display,
        fontSize: 30,
        marginTop: 6,
    },
    sub: {
        fontFamily: fonts.body,
        fontSize: 15,
        marginTop: 2,
    },
    tiles: {
        flexDirection: "row",
        gap: 12,
        paddingHorizontal: 18,
        paddingTop: 20,
    },
    tile: {
        flex: 1,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    tileBig: {
        fontFamily: fonts.display,
        fontSize: 26,
    },
    tileLabel: {
        fontSize: 11.5,
        fontFamily: fonts.bodyExtra,
        marginTop: 2,
        textAlign: "center",
    },
    section: {
        paddingHorizontal: 18,
        paddingTop: 22,
        gap: 8,
    },
    sectionTitle: {
        fontFamily: fonts.display,
        fontSize: 17,
        marginBottom: 10,
    },
    wordRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 1,
    },
    wordIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    wordText: {
        flex: 1,
        fontFamily: fonts.display,
        fontSize: 17,
        textTransform: "capitalize",
    },
    wordMeta: {
        fontSize: 13,
        fontFamily: fonts.body,
    },
    tipsHead: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    tipCard: {
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 11,
    },
    tipMsg: {
        fontSize: 14.5,
        fontFamily: fonts.bodyExtra,
    },
    tipFix: {
        fontSize: 13,
        fontFamily: fonts.body,
        marginTop: 3,
    },
    actions: {
        paddingHorizontal: 18,
        paddingTop: 24,
        gap: 10,
    },
    primaryBtn: {
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: "center",
    },
    primaryBtnText: {
        color: "#fff",
        fontFamily: fonts.display,
        fontSize: 17,
    },
    secondaryBtn: {
        paddingVertical: 13,
        alignItems: "center",
    },
    secondaryBtnText: {
        fontFamily: fonts.display,
        fontSize: 16,
    },
})
