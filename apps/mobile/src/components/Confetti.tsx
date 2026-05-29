import { useEffect, useMemo } from "react"
import { StyleSheet, View } from "react-native"
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from "react-native-reanimated"
import { SHARED } from "../theme/colors"

type Props = { go: boolean }

const COLORS = ["#FF7A5C", SHARED.correct, SHARED.amber, SHARED.guard]

export function Confetti({ go }: Props) {
    const bits = useMemo(
        () =>
            Array.from({ length: 36 }, (_, i) => ({
                left: Math.random() * 100,
                delay: Math.random() * 250,
                dur: 900 + Math.random() * 800,
                size: 6 + Math.random() * 8,
                round: Math.random() > 0.5,
                color: COLORS[i % COLORS.length],
            })),
        [],
    )

    if (!go) return null

    return (
        <View style={styles.layer} pointerEvents="none">
            {bits.map((b, i) => (
                <ConfettiBit key={i} {...b} />
            ))}
        </View>
    )
}

function ConfettiBit({
    left,
    delay,
    dur,
    size,
    round,
    color,
}: {
    left: number
    delay: number
    dur: number
    size: number
    round: boolean
    color: string
}) {
    const y = useSharedValue(-20)
    const rot = useSharedValue(0)
    const opacity = useSharedValue(1)

    useEffect(() => {
        y.value = withDelay(delay, withTiming(520, { duration: dur }))
        rot.value = withDelay(delay, withTiming(540, { duration: dur }))
        opacity.value = withDelay(delay + dur * 0.7, withTiming(0, { duration: dur * 0.3 }))
    }, [delay, dur, opacity, rot, y])

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }],
        opacity: opacity.value,
    }))

    return (
        <Animated.View
            style={[
                styles.bit,
                style,
                {
                    left: `${left}%`,
                    width: size,
                    height: round ? size : size * 1.6,
                    borderRadius: round ? size / 2 : 2,
                    backgroundColor: color,
                },
            ]}
        />
    )
}

const styles = StyleSheet.create({
    layer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 80,
        overflow: "hidden",
    },
    bit: {
        position: "absolute",
        top: -20,
    },
})
