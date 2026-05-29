import { ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { missingFirebaseEnvKeys } from "../lib/env"
import { fonts } from "../theme/typography"

export function FirebaseSetupScreen() {
    const insets = useSafeAreaInsets()
    const missing = missingFirebaseEnvKeys()

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={{
                paddingTop: insets.top + 32,
                paddingBottom: insets.bottom + 32,
                paddingHorizontal: 24,
            }}
        >
            <Text style={styles.title}>Firebase not configured</Text>
            <Text style={styles.body}>
                Add your Firebase web app credentials to{" "}
                <Text style={styles.mono}>apps/mobile/.env</Text>, then restart Expo
                with a clean cache.
            </Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Missing variables</Text>
                {missing.map(key => (
                    <Text key={key} style={styles.mono}>
                        {key}
                    </Text>
                ))}
            </View>

            <Text style={styles.body}>
                Get values from Firebase Console → Project settings → Your apps → Web
                app config (apiKey, appId). Use the same project as the dashboard
                (<Text style={styles.mono}>lingo-sketch</Text>).
            </Text>

            <Text style={styles.hint}>
                After editing .env, run:{"\n"}
                <Text style={styles.mono}>pnpm --filter @lingo-sketch/mobile dev -- --clear</Text>
            </Text>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#FBF4EE",
    },
    title: {
        fontFamily: fonts.display,
        fontSize: 26,
        color: "#3B2F2A",
        marginBottom: 12,
    },
    body: {
        fontFamily: fonts.body,
        fontSize: 15,
        lineHeight: 22,
        color: "#3B2F2A",
        marginBottom: 16,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        gap: 6,
        marginBottom: 16,
    },
    cardTitle: {
        fontFamily: fonts.bodyExtra,
        fontSize: 14,
        color: "#3B2F2A",
        marginBottom: 4,
    },
    mono: {
        fontFamily: "Menlo",
        fontSize: 13,
        color: "#7C5CFF",
    },
    hint: {
        fontFamily: fonts.bodySemi,
        fontSize: 13,
        lineHeight: 20,
        color: "rgba(59, 47, 42, 0.65)",
    },
})
