import { useCallback, useRef, useState } from "react"
import { LayoutChangeEvent, PanResponder, View, StyleSheet } from "react-native"
import Svg, { Path } from "react-native-svg"
import { strokeToPath } from "../game/doodles"
import type { Stroke } from "../game/types"

type Props = {
    strokes: Stroke[]
    onStroke: (stroke: Stroke) => void
    ink?: string
    disabled?: boolean
}

const STROKE_WIDTH = 6

export function DrawingCanvas({ strokes, onStroke, ink = "#3b2f2a", disabled }: Props) {
    const [livePts, setLivePts] = useState<[number, number][]>([])
    const sizeRef = useRef({ w: 1, h: 1 })
    const livePtsRef = useRef<[number, number][]>([])

    const toCanvas = useCallback((x: number, y: number): [number, number] => {
        const { w, h } = sizeRef.current
        return [(x / w) * 300, (y / h) * 300]
    }, [])

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        sizeRef.current = {
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
        }
    }, [])

    const finishStroke = useCallback(() => {
        const pts = livePtsRef.current
        if (pts.length >= 2) {
            onStroke({ pts, w: STROKE_WIDTH })
        }
        livePtsRef.current = []
        setLivePts([])
    }, [onStroke])

    const pan = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !disabled,
            onMoveShouldSetPanResponder: () => !disabled,
            onPanResponderGrant: evt => {
                const pt = toCanvas(evt.nativeEvent.locationX, evt.nativeEvent.locationY)
                livePtsRef.current = [pt]
                setLivePts([pt])
            },
            onPanResponderMove: evt => {
                const pt = toCanvas(evt.nativeEvent.locationX, evt.nativeEvent.locationY)
                livePtsRef.current = [...livePtsRef.current, pt]
                setLivePts([...livePtsRef.current])
            },
            onPanResponderRelease: finishStroke,
            onPanResponderTerminate: finishStroke,
        }),
    ).current

    const livePath = livePts.length > 0 ? strokeToPath(livePts) : ""

    return (
        <View style={styles.wrap} onLayout={onLayout} {...pan.panHandlers}>
            <Svg width="100%" height="100%" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
                {strokes.map((st, i) => (
                    <Path
                        key={i}
                        d={strokeToPath(st.pts)}
                        stroke={ink}
                        strokeWidth={st.w}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                ))}
                {livePath ? (
                    <Path
                        d={livePath}
                        stroke={ink}
                        strokeWidth={STROKE_WIDTH}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                    />
                ) : null}
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
