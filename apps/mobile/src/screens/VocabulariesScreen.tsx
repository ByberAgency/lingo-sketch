import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { getTheme, inkMuted } from "../theme/colors"
import { fonts } from "../theme/typography"

export function VocabulariesScreen() {
    const insets = useSafeAreaInsets()
    const theme = getTheme()

    return (
        <View
            style={[
                styles.root,
                {
                    backgroundColor: theme.bg,
                    paddingTop: insets.top + 16,
                    paddingBottom: insets.bottom + 16,
                },
            ]}
        >
            <Text style={[styles.title, { color: theme.ink }]}>My vocabularies</Text>
            <Text style={[styles.subtitle, { color: inkMuted(theme.ink) }]}>
                Saved words and phrases will show up here.
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingHorizontal: 24,
    },
    title: {
        fontFamily: fonts.display,
        fontSize: 28,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: fonts.bodySemi,
        fontSize: 16,
        lineHeight: 22,
    },
})
