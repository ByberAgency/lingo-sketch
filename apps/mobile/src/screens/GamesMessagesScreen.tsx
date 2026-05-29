import { useCallback, useState } from "react"
import {
    ScrollView,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native"
import { useFocusEffect } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Svg, { Path } from "react-native-svg"
import { Avatar } from "../components/Avatar"
import { Gus } from "../components/Gus"
import { MessageBubble } from "../components/MessageBubble"
import { PeopleIcon } from "../components/PeopleIcon"
import { DEFAULT_SETTINGS } from "../game/constants"
import { guardCopy } from "../game/grammar"
import { loadGameThreads, type GameThread } from "../game/history"
import type { GameMessage } from "../game/types"
import { useAuth } from "../auth/AuthProvider"
import { getTheme, inkMuted, mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"

function formatWhen(ts: number) {
    const d = new Date(ts)
    const now = new Date()
    const sameDay =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
    if (sameDay) {
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" })
}

function ThreadRow({
    thread,
    theme,
    onPress,
}: {
    thread: GameThread
    theme: ReturnType<typeof getTheme>
    onPress: () => void
}) {
    return (
        <Pressable
            style={[styles.row, { backgroundColor: theme.surface }]}
            onPress={onPress}
        >
            {thread.kind === "group" ? (
                <View
                    style={[
                        styles.rowIcon,
                        { backgroundColor: mixColor(theme.guard, theme.surface, 0.16) },
                    ]}
                >
                    <PeopleIcon size={28} color={theme.guard} />
                </View>
            ) : (
                <Avatar
                    name={thread.title}
                    color={theme.guard}
                    size={48}
                />
            )}
            <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                    <Text style={[styles.rowTitle, { color: theme.ink }]} numberOfLines={1}>
                        {thread.title}
                    </Text>
                    <Text style={[styles.rowTime, { color: inkMuted(theme.ink, 0.4) }]}>
                        {formatWhen(thread.updatedAt)}
                    </Text>
                </View>
                <Text
                    style={[styles.rowPreview, { color: inkMuted(theme.ink, 0.45) }]}
                    numberOfLines={1}
                >
                    {thread.preview}
                </Text>
                {thread.kind === "1v1" ? (
                    <View
                        style={[
                            styles.badge,
                            { backgroundColor: mixColor(theme.guard, theme.surface, 0.14) },
                        ]}
                    >
                        <Text style={[styles.badgeText, { color: theme.guard }]}>1:1</Text>
                    </View>
                ) : (
                    <View
                        style={[
                            styles.badge,
                            { backgroundColor: mixColor(theme.primary, theme.surface, 0.14) },
                        ]}
                    >
                        <Text style={[styles.badgeText, { color: theme.primary }]}>Group</Text>
                    </View>
                )}
            </View>
            <Chevron color={mixColor(theme.ink, "#ffffff", 0.3)} />
        </Pressable>
    )
}

function ThreadDetail({
    thread,
    myUid,
    onBack,
}: {
    thread: GameThread
    myUid?: string
    onBack: () => void
}) {
    const insets = useSafeAreaInsets()
    const theme = getTheme()
    const settings = DEFAULT_SETTINGS
    const copy = guardCopy(settings.guardTone)

    const messages: GameMessage[] = thread.messages.map(m => {
        if (m.kind === "guard") {
            return {
                id: m.id,
                kind: "guard" as const,
                corrected: m.text,
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
                      color: m.authorUid === myUid ? theme.primary : theme.guard,
                      you: m.authorUid === myUid,
                      bot: m.authorName === "Gus",
                  }
                : undefined,
        }
    })

    return (
        <View style={[styles.detailRoot, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
            <View style={styles.detailHeader}>
                <Pressable
                    style={[styles.backBtn, { backgroundColor: theme.surface }]}
                    onPress={onBack}
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
                <View style={styles.detailTitleWrap}>
                    <Text style={[styles.detailTitle, { color: theme.ink }]} numberOfLines={1}>
                        {thread.title}
                    </Text>
                    <Text style={[styles.detailSub, { color: inkMuted(theme.ink) }]}>
                        {thread.kind === "group" ? "Group game" : "Play with a Friend"}
                    </Text>
                </View>
                {thread.kind === "1v1" ? (
                    <Avatar name={thread.title} color={theme.guard} size={36} />
                ) : (
                    <View
                        style={[
                            styles.detailIcon,
                            { backgroundColor: mixColor(theme.guard, theme.surface, 0.16) },
                        ]}
                    >
                        <PeopleIcon size={22} color={theme.guard} />
                    </View>
                )}
            </View>

            <ScrollView
                style={styles.detailFeed}
                contentContainerStyle={[
                    styles.detailFeedContent,
                    { paddingBottom: insets.bottom + 20 },
                ]}
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
        </View>
    )
}

function EmptySection({
    title,
    subtitle,
    theme,
}: {
    title: string
    subtitle: string
    theme: ReturnType<typeof getTheme>
}) {
    return (
        <View style={[styles.emptySection, { backgroundColor: theme.surface }]}>
            <Text style={[styles.emptyTitle, { color: inkMuted(theme.ink, 0.5) }]}>{title}</Text>
            <Text style={[styles.emptySub, { color: inkMuted(theme.ink, 0.35) }]}>{subtitle}</Text>
        </View>
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

export function GamesMessagesScreen() {
    const insets = useSafeAreaInsets()
    const theme = getTheme()
    const { user } = useAuth()
    const [threads, setThreads] = useState<GameThread[]>([])
    const [selected, setSelected] = useState<GameThread | null>(null)

    useFocusEffect(
        useCallback(() => {
            loadGameThreads().then(setThreads)
        }, []),
    )

    const groupThreads = threads.filter(t => t.kind === "group")
    const friendThreads = threads.filter(t => t.kind === "1v1")

    if (selected) {
        return (
            <ThreadDetail
                thread={selected}
                myUid={user?.uid}
                onBack={() => setSelected(null)}
            />
        )
    }

    return (
        <View
            style={[
                styles.root,
                {
                    backgroundColor: theme.bg,
                    paddingTop: insets.top + 16,
                    paddingBottom: insets.bottom,
                },
            ]}
        >
            <Text style={[styles.title, { color: theme.ink }]}>Games</Text>
            <Text style={[styles.subtitle, { color: inkMuted(theme.ink) }]}>
                Messages from group games and 1:1 matches
            </Text>

            <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionLabel, { color: inkMuted(theme.ink) }]}>Group games</Text>
                {groupThreads.length === 0 ? (
                    <EmptySection
                        theme={theme}
                        title="No group games yet"
                        subtitle="When you play a group guess game, the chat will show up here."
                    />
                ) : (
                    groupThreads.map(thread => (
                        <ThreadRow
                            key={thread.id}
                            thread={thread}
                            theme={theme}
                            onPress={() => setSelected(thread)}
                        />
                    ))
                )}

                <Text style={[styles.sectionLabel, { color: inkMuted(theme.ink), marginTop: 20 }]}>
                    Friends
                </Text>
                {friendThreads.length === 0 ? (
                    <View style={[styles.emptyFriends, { backgroundColor: theme.surface }]}>
                        {DEFAULT_SETTINGS.mascot && <Gus mood="think" size={48} />}
                        <Text style={[styles.emptyFriendsTitle, { color: theme.ink }]}>
                            No friend games yet
                        </Text>
                        <Text style={[styles.emptyFriendsSub, { color: inkMuted(theme.ink) }]}>
                            Play with a Friend from Home — your game messages will appear here.
                        </Text>
                    </View>
                ) : (
                    friendThreads.map(thread => (
                        <ThreadRow
                            key={thread.id}
                            thread={thread}
                            theme={theme}
                            onPress={() => setSelected(thread)}
                        />
                    ))
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: 18,
    },
    title: {
        fontFamily: fonts.display,
        fontSize: 28,
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: fonts.bodySemi,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 18,
    },
    listContent: {
        paddingBottom: 24,
        gap: 10,
    },
    sectionLabel: {
        fontFamily: fonts.bodyExtra,
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 18,
        padding: 14,
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    rowIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    rowBody: {
        flex: 1,
        minWidth: 0,
    },
    rowTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    rowTitle: {
        fontFamily: fonts.display,
        fontSize: 16,
        flex: 1,
    },
    rowTime: {
        fontFamily: fonts.body,
        fontSize: 12,
    },
    rowPreview: {
        fontFamily: fonts.body,
        fontSize: 13,
        marginTop: 2,
        paddingRight: 8,
    },
    badge: {
        alignSelf: "flex-start",
        marginTop: 6,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: {
        fontFamily: fonts.bodyExtra,
        fontSize: 10,
    },
    emptySection: {
        borderRadius: 18,
        padding: 16,
        marginBottom: 4,
    },
    emptyTitle: {
        fontFamily: fonts.bodySemi,
        fontSize: 14,
    },
    emptySub: {
        fontFamily: fonts.body,
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
    emptyFriends: {
        borderRadius: 22,
        padding: 24,
        alignItems: "center",
        gap: 8,
    },
    emptyFriendsTitle: {
        fontFamily: fonts.display,
        fontSize: 17,
        marginTop: 4,
    },
    emptyFriendsSub: {
        fontFamily: fonts.body,
        fontSize: 13,
        textAlign: "center",
        lineHeight: 19,
    },
    detailRoot: { flex: 1 },
    detailHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
    },
    detailTitleWrap: { flex: 1, minWidth: 0 },
    detailTitle: {
        fontFamily: fonts.display,
        fontSize: 18,
    },
    detailSub: {
        fontFamily: fonts.body,
        fontSize: 12,
        marginTop: 1,
    },
    detailIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    detailFeed: { flex: 1 },
    detailFeedContent: {
        paddingHorizontal: 14,
        paddingTop: 8,
        gap: 9,
    },
})
