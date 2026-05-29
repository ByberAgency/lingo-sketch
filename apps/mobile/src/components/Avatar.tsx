import { Text, View, StyleSheet } from "react-native"
import { fonts } from "../theme/typography"

type Props = {
    name: string
    color: string
    bot?: boolean
    size?: number
    ring?: boolean
    bgColor?: string
}

export function Avatar({ name, color, bot, size = 36, ring, bgColor = "#FBF4EE" }: Props) {
    const initials = bot
        ? "★"
        : (name || "?")
              .split(" ")
              .map(w => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()

    return (
        <View
            style={[
                styles.base,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: bot ? "#7C5CFF" : color,
                    borderWidth: ring ? 3 : 0,
                    borderColor: bgColor,
                    shadowColor: ring ? color : "#000",
                    shadowOffset: ring ? { width: 0, height: 0 } : { width: 0, height: 1 },
                    shadowOpacity: ring ? 1 : 0.12,
                    shadowRadius: ring ? 0 : 2,
                },
            ]}
        >
            <Text style={[styles.text, { fontSize: size * (bot ? 0.5 : 0.4) }]}>{initials}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    base: {
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        color: "#fff",
        fontFamily: fonts.display,
        fontWeight: "700",
        letterSpacing: -0.5,
    },
})
