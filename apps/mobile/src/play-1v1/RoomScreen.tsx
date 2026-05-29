import { useState } from "react"
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
import { PeopleIcon } from "../components/PeopleIcon"
import { PLAY_1V1_MODE } from "./constants"
import type { GameSettings } from "../game/types"
import { SERVER_UNREACHABLE_MESSAGE } from "../mobile-api/gameRoomApi"
import { useCreateRoom, useJoinRoom, useHealth } from "../mobile-api"
import { getTheme, inkMuted, mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"

type Props = {
    settings: GameSettings
    onEnterRoom: (roomId: string, code: string) => void
    onBack: () => void
}

function mutationErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback
}

export function RoomScreen({ settings, onEnterRoom, onBack }: Props) {
    const insets = useSafeAreaInsets()
    const theme = getTheme(settings.theme)
    const mode = PLAY_1V1_MODE

    const [code, setCode] = useState("")
    const [error, setError] = useState<string | null>(null)

    const health = useHealth()
    const createRoom = useCreateRoom()
    const joinRoom = useJoinRoom()

    const serverReady = health.isSuccess
    const serverChecking = health.isLoading || health.isFetching
    const serverUnreachable = health.isError

    const busy = createRoom.isPending || joinRoom.isPending
    const actionsDisabled = busy || serverChecking || serverUnreachable

    const handleCreate = async () => {
        if (!serverReady) return
        setError(null)
        try {
            const result = await createRoom.mutateAsync()
            onEnterRoom(result.roomId, result.code)
        } catch (err) {
            setError(mutationErrorMessage(err, "Could not create a room. Try again."))
        }
    }

    const handleJoin = async () => {
        if (!serverReady) return
        if (code.trim().length < 4) {
            setError("Enter a valid room code")
            return
        }
        setError(null)
        try {
            const result = await joinRoom.mutateAsync(code)
            onEnterRoom(result.roomId, result.code)
        } catch (err) {
            setError(mutationErrorMessage(err, "Room not found or already in progress"))
        }
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: theme.bg }}
            contentContainerStyle={{
                paddingTop: insets.top + 12,
                paddingBottom: insets.bottom + 24,
                paddingHorizontal: 18,
            }}
        >
            <Pressable style={[styles.backBtn, { backgroundColor: theme.surface }]} onPress={onBack}>
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

            <View style={styles.hero}>
                <View
                    style={[
                        styles.iconWrap,
                        { backgroundColor: mixColor(theme.guard, theme.surface, 0.16) },
                    ]}
                >
                    <PeopleIcon size={40} color={theme.guard} />
                </View>
                <Text style={[styles.title, { color: theme.ink }]}>{mode.title}</Text>
                <Text style={[styles.sub, { color: inkMuted(theme.ink, 0.4) }]}>{mode.subtitle}</Text>
            </View>

            {serverChecking ? (
                <View style={styles.serverStatus}>
                    <ActivityIndicator color={theme.primary} />
                    <Text style={[styles.serverStatusText, { color: inkMuted(theme.ink) }]}>
                        Checking game server…
                    </Text>
                </View>
            ) : null}

            {serverUnreachable ? (
                <View style={styles.serverBanner}>
                    <Text style={[styles.serverBannerText, { color: theme.primary }]}>
                        {SERVER_UNREACHABLE_MESSAGE}
                    </Text>
                    <Pressable
                        style={[styles.retryBtn, { borderColor: mixColor(theme.guard, theme.surface, 0.35) }]}
                        onPress={() => health.refetch()}
                    >
                        <Text style={[styles.retryBtnText, { color: theme.guard }]}>Retry</Text>
                    </Pressable>
                </View>
            ) : null}

            <Pressable
                style={[
                    styles.primaryBtn,
                    {
                        backgroundColor: theme.primary,
                        opacity: actionsDisabled ? 0.55 : 1,
                    },
                ]}
                onPress={handleCreate}
                disabled={actionsDisabled}
            >
                {createRoom.isPending ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.primaryBtnText}>Create room</Text>
                )}
            </Pressable>

            <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: mixColor(theme.ink, theme.bg, 0.12) }]} />
                <Text style={[styles.dividerText, { color: inkMuted(theme.ink) }]}>or join with code</Text>
                <View style={[styles.dividerLine, { backgroundColor: mixColor(theme.ink, theme.bg, 0.12) }]} />
            </View>

            <TextInput
                style={[
                    styles.codeInput,
                    {
                        backgroundColor: theme.surface,
                        color: theme.ink,
                        borderColor: mixColor(theme.ink, theme.surface, 0.12),
                        opacity: actionsDisabled ? 0.55 : 1,
                    },
                ]}
                value={code}
                onChangeText={t => setCode(t.toUpperCase())}
                placeholder="ABCDE"
                placeholderTextColor={inkMuted(theme.ink, 0.35)}
                autoCapitalize="characters"
                maxLength={6}
                editable={!actionsDisabled}
            />

            <Pressable
                style={[
                    styles.secondaryBtn,
                    {
                        backgroundColor: theme.surface,
                        borderColor: mixColor(theme.guard, theme.surface, 0.35),
                        opacity: actionsDisabled ? 0.55 : 1,
                    },
                ]}
                onPress={handleJoin}
                disabled={actionsDisabled}
            >
                {joinRoom.isPending ? (
                    <ActivityIndicator color={theme.guard} />
                ) : (
                    <Text style={[styles.secondaryBtnText, { color: theme.guard }]}>Join room</Text>
                )}
            </Pressable>

            {error ? <Text style={[styles.error, { color: theme.primary }]}>{error}</Text> : null}

            <Text style={[styles.help, { color: inkMuted(theme.ink, 0.45) }]}>
                Share the room code with a friend. When they join, the game starts automatically.
            </Text>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    hero: {
        alignItems: "center",
        marginBottom: 28,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    title: {
        fontFamily: fonts.display,
        fontSize: 26,
    },
    sub: {
        fontFamily: fonts.bodySemi,
        fontSize: 14,
        marginTop: 4,
        textAlign: "center",
    },
    serverStatus: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 16,
    },
    serverStatusText: {
        fontFamily: fonts.body,
        fontSize: 13,
    },
    serverBanner: {
        marginBottom: 16,
        gap: 10,
    },
    serverBannerText: {
        fontFamily: fonts.bodySemi,
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
    },
    retryBtn: {
        alignSelf: "center",
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    retryBtnText: {
        fontFamily: fonts.bodySemi,
        fontSize: 14,
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
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginVertical: 22,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        fontFamily: fonts.body,
        fontSize: 13,
    },
    codeInput: {
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: fonts.display,
        fontSize: 24,
        letterSpacing: 6,
        textAlign: "center",
    },
    secondaryBtn: {
        marginTop: 12,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: "center",
    },
    secondaryBtnText: {
        fontFamily: fonts.display,
        fontSize: 17,
    },
    error: {
        marginTop: 14,
        fontFamily: fonts.bodySemi,
        fontSize: 14,
        textAlign: "center",
    },
    help: {
        marginTop: 20,
        fontFamily: fonts.body,
        fontSize: 13,
        lineHeight: 19,
        textAlign: "center",
    },
})
