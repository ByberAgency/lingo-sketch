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
import { PLAY_GROUP_MODE } from "./constants"
import type { GameSettings } from "../game/types"
import { SERVER_UNREACHABLE_MESSAGE } from "../mobile-api/gameRoomApi"
import {
    useCreateGroupRoom,
    useHealth,
    useJoinRoom,
    useMyGroupInvites,
} from "../mobile-api"
import { getTheme, inkMuted, mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"

type Props = {
    settings: GameSettings
    onEnterRoom: (roomId: string, code: string, groupName?: string | null) => void
    onBack: () => void
}

function mutationErrorMessage(err: unknown, fallback: string): string {
    return err instanceof Error ? err.message : fallback
}

export function GroupRoomScreen({ settings, onEnterRoom, onBack }: Props) {
    const insets = useSafeAreaInsets()
    const theme = getTheme(settings.theme)
    const mode = PLAY_GROUP_MODE

    const [groupName, setGroupName] = useState("")
    const [code, setCode] = useState("")
    const [error, setError] = useState<string | null>(null)

    const health = useHealth()
    const createGroup = useCreateGroupRoom()
    const joinRoom = useJoinRoom()
    const invites = useMyGroupInvites(health.isSuccess)

    const serverReady = health.isSuccess
    const serverChecking = health.isLoading || health.isFetching
    const serverUnreachable = health.isError

    const busy = createGroup.isPending || joinRoom.isPending
    const actionsDisabled = busy || serverChecking || serverUnreachable

    const handleCreate = async () => {
        if (!serverReady) return
        const name = groupName.trim()
        if (name.length < 2) {
            setError("Enter a group name (at least 2 characters)")
            return
        }
        setError(null)
        try {
            const result = await createGroup.mutateAsync(name)
            onEnterRoom(result.roomId, result.code, result.groupName ?? name)
        } catch (err) {
            setError(mutationErrorMessage(err, "Could not create a group. Try again."))
        }
    }

    const handleJoin = async (joinCode: string) => {
        if (!serverReady) return
        const trimmed = joinCode.trim()
        if (trimmed.length < 4) {
            setError("Enter a valid room code")
            return
        }
        setError(null)
        try {
            const result = await joinRoom.mutateAsync(trimmed)
            onEnterRoom(result.roomId, result.code, result.groupName)
        } catch (err) {
            setError(mutationErrorMessage(err, "Could not join — check the code or your invite"))
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

            <Text style={[styles.label, { color: inkMuted(theme.ink) }]}>Group name</Text>
            <TextInput
                style={[
                    styles.textInput,
                    {
                        backgroundColor: theme.surface,
                        color: theme.ink,
                        borderColor: mixColor(theme.ink, theme.surface, 0.12),
                        opacity: actionsDisabled ? 0.55 : 1,
                    },
                ]}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Friday sketch club"
                placeholderTextColor={inkMuted(theme.ink, 0.35)}
                editable={!actionsDisabled}
            />

            <Pressable
                style={[
                    styles.primaryBtn,
                    { backgroundColor: theme.primary, opacity: actionsDisabled ? 0.55 : 1 },
                ]}
                onPress={handleCreate}
                disabled={actionsDisabled}
            >
                {createGroup.isPending ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.primaryBtnText}>Create group</Text>
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
                onPress={() => handleJoin(code)}
                disabled={actionsDisabled}
            >
                {joinRoom.isPending ? (
                    <ActivityIndicator color={theme.guard} />
                ) : (
                    <Text style={[styles.secondaryBtnText, { color: theme.guard }]}>Join group</Text>
                )}
            </Pressable>

            {invites.data && invites.data.length > 0 ? (
                <View style={styles.invitesSection}>
                    <Text style={[styles.invitesTitle, { color: theme.ink }]}>Your invites</Text>
                    {invites.data.map(invite => (
                        <Pressable
                            key={invite.id}
                            style={[styles.inviteRow, { backgroundColor: theme.surface }]}
                            onPress={() => handleJoin(invite.roomCode)}
                            disabled={actionsDisabled}
                        >
                            <View style={styles.inviteBody}>
                                <Text style={[styles.inviteName, { color: theme.ink }]}>
                                    {invite.groupName ?? "Group game"}
                                </Text>
                                <Text style={[styles.inviteCode, { color: inkMuted(theme.ink) }]}>
                                    Code {invite.roomCode}
                                </Text>
                            </View>
                            <Text style={[styles.inviteJoin, { color: theme.guard }]}>Join</Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}

            {error ? <Text style={[styles.error, { color: theme.primary }]}>{error}</Text> : null}

            <Text style={[styles.help, { color: inkMuted(theme.ink, 0.45) }]}>
                Invite friends by their registered email. You need at least 3 players before the host
                can start.
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
    hero: { alignItems: "center", marginBottom: 24 },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    title: { fontFamily: fonts.display, fontSize: 26 },
    sub: {
        fontFamily: fonts.bodySemi,
        fontSize: 14,
        marginTop: 4,
        textAlign: "center",
    },
    label: {
        fontFamily: fonts.bodySemi,
        fontSize: 13,
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontFamily: fonts.body,
        fontSize: 16,
        marginBottom: 14,
    },
    serverStatus: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 16,
    },
    serverStatusText: { fontFamily: fonts.body, fontSize: 13 },
    serverBanner: { marginBottom: 16, gap: 10 },
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
    retryBtnText: { fontFamily: fonts.bodySemi, fontSize: 14 },
    primaryBtn: { borderRadius: 16, paddingVertical: 15, alignItems: "center" },
    primaryBtnText: { color: "#fff", fontFamily: fonts.display, fontSize: 17 },
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginVertical: 22,
    },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { fontFamily: fonts.body, fontSize: 13 },
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
    secondaryBtnText: { fontFamily: fonts.display, fontSize: 17 },
    invitesSection: { marginTop: 28, gap: 10 },
    invitesTitle: { fontFamily: fonts.display, fontSize: 18, marginBottom: 4 },
    inviteRow: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        padding: 14,
    },
    inviteBody: { flex: 1 },
    inviteName: { fontFamily: fonts.bodySemi, fontSize: 15 },
    inviteCode: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
    inviteJoin: { fontFamily: fonts.bodyExtra, fontSize: 14 },
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
