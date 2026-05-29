import type { ReactNode } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import { Gus } from "../components/Gus"
import { PeopleIcon } from "../components/PeopleIcon"
import { PLAY_1V1_MODE } from "../play-1v1/constants"
import { PLAY_GROUP_MODE } from "../play-group/constants"
import { PLAY_SOLO_MODE } from "../play-solo/constants"
import type { GameMode, GameSettings, Stats } from "../game/types"
import { getTheme, inkMuted, mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"

type Props = {
    settings: GameSettings
    stats: Stats
    onPlaySolo: () => void
    onPlay1v1: () => void
    onPlayGroup: () => void
    displayName?: string | null
}

function greetingTime() {
    const h = new Date().getHours()
    if (h < 12) return "GOOD MORNING"
    if (h < 18) return "GOOD AFTERNOON"
    return "GOOD EVENING"
}

function ModeCard({
    mode,
    theme,
    onPress,
    icon,
}: {
    mode: GameMode
    theme: ReturnType<typeof getTheme>
    onPress: () => void
    icon: ReactNode
}) {
    return (
        <Pressable
            style={[styles.playCard, { backgroundColor: theme.surface }]}
            onPress={onPress}
        >
            <View
                style={[
                    styles.playIcon,
                    { backgroundColor: mixColor(theme.guard, theme.surface, 0.16) },
                ]}
            >
                {icon}
            </View>
            <View style={styles.playBody}>
                <Text style={[styles.playTitle, { color: theme.ink }]} numberOfLines={1}>
                    {mode.title}
                </Text>
                <Text
                    style={[styles.playSub, { color: inkMuted(theme.ink, 0.4) }]}
                    numberOfLines={2}
                >
                    {mode.subtitle}
                </Text>
            </View>
            <View style={styles.playMeta}>
                <View
                    style={[
                        styles.tag,
                        { backgroundColor: mixColor(theme.guard, theme.surface, 0.14) },
                    ]}
                >
                    <Text style={[styles.tagText, { color: theme.guard }]}>{mode.tag}</Text>
                </View>
                <Chevron color={mixColor(theme.ink, "#ffffff", 0.3)} />
            </View>
        </Pressable>
    )
}

export function LobbyScreen({
    settings,
    stats,
    onPlaySolo,
    onPlay1v1,
    onPlayGroup,
    displayName,
}: Props) {
    const insets = useSafeAreaInsets()
    const theme = getTheme(settings.theme)
    const xpToNext = 100 - (stats.xp % 100)

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.bg }}
            contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
        >
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={[styles.greeting, { color: inkMuted(theme.ink) }]}>
                        {greetingTime()}
                        {displayName ? `, ${displayName.split(" ")[0]?.toUpperCase()}` : ""}
                    </Text>
                    <Text style={[styles.headline, { color: theme.ink }]}>
                        Let's play & learn English
                    </Text>
                </View>
                {settings.mascot && (
                    <View style={styles.mascotWrap}>
                        <Gus mood="happy" size={64} />
                    </View>
                )}
            </View>

            <View
                style={[
                    styles.xpCard,
                    {
                        backgroundColor: theme.primary,
                        shadowColor: mixColor(theme.primary, "#000000", 0.35),
                    },
                ]}
            >
                <View style={styles.xpTop}>
                    <View>
                        <Text style={styles.xpLabel}>LEVEL {stats.level} · WORD WRANGLER</Text>
                        <Text style={styles.xpBig}>
                            {stats.xp} <Text style={styles.xpUnit}>XP</Text>
                        </Text>
                    </View>
                    <View style={styles.streak}>
                        <Flame />
                        <Text style={styles.streakNum}>{stats.streak}</Text>
                    </View>
                </View>
                <View style={styles.xpBarTrack}>
                    <View style={[styles.xpBarFill, { width: `${stats.xp % 100}%` }]} />
                </View>
                <Text style={styles.xpSub}>
                    {xpToNext} XP to Level {stats.level + 1}
                </Text>
            </View>

            <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: theme.ink }]}>Ready to play?</Text>
            </View>

            <View style={styles.modeList}>
                <ModeCard
                    mode={PLAY_GROUP_MODE}
                    theme={theme}
                    onPress={onPlayGroup}
                    icon={<PeopleIcon size={34} color={theme.guard} />}
                />
                <ModeCard
                    mode={PLAY_1V1_MODE}
                    theme={theme}
                    onPress={onPlay1v1}
                    icon={<PeopleIcon size={34} color={theme.guard} />}
                />
                <ModeCard
                    mode={PLAY_SOLO_MODE}
                    theme={theme}
                    onPress={onPlaySolo}
                    icon={<Gus mood="happy" size={38} color={theme.guard} />}
                />
            </View>
        </ScrollView>
    )
}

function Flame() {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24">
            <Path
                d="M12 2c1 3-2 4-2 7 0-2-2-3-2-3-1 2-3 4-3 7a7 7 0 0014 0c0-4-3-6-4-9-1 2-2 2-2 0 0-2 1-3 1-3-1 0-2 1-2 1z"
                fill="#fff"
            />
        </Svg>
    )
}

function Chevron({ color }: { color: string }) {
    return (
        <Svg width={8} height={14} viewBox="0 0 8 14">
            <Path
                d="M1 1l6 6-6 6"
                stroke={color}
                strokeWidth={2.2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    )
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: 22,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
    },
    headerText: { flex: 1, minWidth: 0 },
    greeting: {
        fontSize: 14,
        fontFamily: fonts.bodyExtra,
        letterSpacing: 0.3,
    },
    headline: {
        fontFamily: fonts.display,
        fontSize: 27,
        lineHeight: 36,
        marginTop: 4,
    },
    mascotWrap: { marginTop: 4 },
    xpCard: {
        marginHorizontal: 18,
        marginTop: 18,
        borderRadius: 24,
        padding: 18,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 26,
        elevation: 4,
    },
    xpTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    xpLabel: {
        color: "#fff",
        opacity: 0.9,
        fontSize: 13,
        lineHeight: 18,
        fontFamily: fonts.bodyExtra,
    },
    xpBig: {
        color: "#fff",
        fontFamily: fonts.display,
        fontSize: 34,
        lineHeight: 44,
        marginTop: 8,
    },
    xpUnit: {
        fontSize: 16,
        fontFamily: fonts.body,
    },
    streak: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.22)",
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
    },
    streakNum: {
        color: "#fff",
        fontFamily: fonts.bodyExtra,
        fontSize: 16,
    },
    xpBarTrack: {
        marginTop: 14,
        height: 9,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.28)",
        overflow: "hidden",
    },
    xpBarFill: {
        height: "100%",
        borderRadius: 999,
        backgroundColor: "#fff",
    },
    xpSub: {
        marginTop: 7,
        color: "#fff",
        opacity: 0.92,
        fontSize: 12.5,
        fontFamily: fonts.body,
    },
    sectionHead: {
        paddingHorizontal: 18,
        paddingTop: 22,
        paddingBottom: 10,
    },
    sectionTitle: {
        fontFamily: fonts.display,
        fontSize: 19,
    },
    modeList: {
        gap: 12,
        paddingHorizontal: 18,
    },
    playCard: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 14,
        borderRadius: 22,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
        elevation: 2,
    },
    playIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    playBody: { flex: 1, minWidth: 0, overflow: "hidden" },
    playTitle: {
        fontFamily: fonts.display,
        fontSize: 17.5,
        lineHeight: 22,
    },
    playSub: {
        fontFamily: fonts.bodySemi,
        fontSize: 13.5,
        lineHeight: 18,
        marginTop: 3,
    },
    playMeta: { alignItems: "flex-end", gap: 6, flexShrink: 0, paddingTop: 2 },
    tag: {
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 3,
        overflow: "hidden",
    },
    tagText: {
        fontSize: 11,
        fontFamily: fonts.bodyExtra,
    },
})
