import { StyleSheet, Text, View } from "react-native"
import Svg, { Circle } from "react-native-svg"
import { mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"
import type { Theme } from "../theme/colors"

type Props = {
    seconds: number
    max: number
    theme: Theme
}

export function TimerRing({ seconds, max, theme }: Props) {
    const r = 16
    const c = 2 * Math.PI * r
    const frac = seconds / max
    const low = seconds <= 15
    const stroke = low ? theme.primary : theme.correct

    return (
        <View style={styles.wrap}>
            <Svg width={38} height={38} viewBox="0 0 38 38">
                <Circle
                    cx="19"
                    cy="19"
                    r={r}
                    fill="none"
                    stroke={mixColor(theme.ink, "#ffffff", 0.12)}
                    strokeWidth="3.5"
                />
                <Circle
                    cx="19"
                    cy="19"
                    r={r}
                    fill="none"
                    stroke={stroke}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${c}`}
                    strokeDashoffset={c * (1 - frac)}
                    rotation="-90"
                    origin="19, 19"
                />
            </Svg>
            <Text style={[styles.label, { color: low ? theme.primary : theme.ink }]}>{seconds}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: {
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        position: "absolute",
        fontFamily: fonts.bodyExtra,
        fontSize: 13,
        fontWeight: "800",
    },
})
