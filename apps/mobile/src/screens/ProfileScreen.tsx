import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useAuth } from "../auth/AuthProvider"
import { Avatar } from "../components/Avatar"
import { useAuthMe } from "../mobile-api"
import { getTheme, inkMuted } from "../theme/colors"
import { fonts } from "../theme/typography"

export function ProfileScreen() {
    const insets = useSafeAreaInsets()
    const theme = getTheme()
    const { user, signOutUser } = useAuth()
    const authMe = useAuthMe()

    const displayName = authMe.data?.displayName ?? user?.displayName ?? "Player"
    const email = user?.email

    return (
        <View
            style={[
                styles.root,
                {
                    backgroundColor: theme.bg,
                    paddingTop: insets.top + 24,
                    paddingBottom: insets.bottom + 24,
                },
            ]}
        >
            <View style={styles.header}>
                <Avatar name={displayName} color={theme.primary} size={72} />
                <Text style={[styles.name, { color: theme.ink }]}>{displayName}</Text>
                {email ? (
                    <Text style={[styles.email, { color: inkMuted(theme.ink) }]}>{email}</Text>
                ) : null}
            </View>

            <Pressable
                style={[styles.signOut, { borderColor: inkMuted(theme.ink, 0.15) }]}
                onPress={() => signOutUser()}
            >
                <Text style={[styles.signOutText, { color: theme.primary }]}>Sign out</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    name: {
        fontFamily: fonts.display,
        fontSize: 24,
        marginTop: 16,
    },
    email: {
        fontFamily: fonts.bodySemi,
        fontSize: 14,
        marginTop: 4,
    },
    signOut: {
        alignSelf: "stretch",
        alignItems: "center",
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    signOutText: {
        fontFamily: fonts.body,
        fontSize: 16,
    },
})
