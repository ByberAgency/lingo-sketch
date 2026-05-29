import { Platform, StyleSheet, Text, View } from "react-native"
import { mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"
import type { Theme } from "../theme/colors"

type Props = {
    word: string
    solved: boolean
    theme: Theme
}

export function WordSlots({ word, solved, theme }: Props) {
    const dashColor = mixColor(theme.ink, "#ffffff", 0.25)

    if (!solved) {
        return (
            <View key={`hidden-${word}`} style={styles.hiddenRow}>
                {word.split("").map((_, i) => (
                    <View key={`dash-${i}`} style={[styles.dash, { backgroundColor: dashColor }]} />
                ))}
            </View>
        )
    }

    return (
        <View key={`solved-${word}`} style={styles.solvedRow}>
            {word.split("").map((ch, i) => (
                <View
                    key={`letter-${i}`}
                    style={[
                        styles.slotSolved,
                        {
                            backgroundColor: mixColor(theme.correct, theme.surface, 0.18),
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.char,
                            { color: theme.correct },
                            Platform.OS === "android" && styles.charAndroid,
                        ]}
                        numberOfLines={1}
                    >
                        {ch.toUpperCase()}
                    </Text>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    hiddenRow: {
        flexDirection: "row",
        gap: 7,
        justifyContent: "center",
        alignItems: "center",
        height: 8,
    },
    solvedRow: {
        flexDirection: "row",
        gap: 6,
        justifyContent: "center",
        alignItems: "center",
        height: 30,
    },
    dash: {
        width: 20,
        height: 3,
        borderRadius: 2,
    },
    slotSolved: {
        width: 24,
        height: 30,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    char: {
        fontFamily: fonts.display,
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "800",
    },
    charAndroid: {
        includeFontPadding: false,
    },
})
