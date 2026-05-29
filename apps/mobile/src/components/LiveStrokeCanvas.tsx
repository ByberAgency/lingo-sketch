import { useMemo } from "react"
import { View, StyleSheet } from "react-native"
import Svg, { Path } from "react-native-svg"
import { strokeToPath } from "../game/doodles"
import type { Stroke } from "../game/types"

type Props = {
    strokes: Stroke[]
    ink?: string
}

export function LiveStrokeCanvas({ strokes, ink = "#3b2f2a" }: Props) {
    const paths = useMemo(
        () => strokes.map(st => ({ path: strokeToPath(st.pts), w: st.w })),
        [strokes],
    )

    return (
        <View style={styles.wrap}>
            <Svg width="100%" height="100%" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
                {paths.map((st, i) => (
                    <Path
                        key={i}
                        d={st.path}
                        stroke={ink}
                        strokeWidth={st.w}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                ))}
            </Svg>
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: {
        width: "100%",
        height: "100%",
    },
})
