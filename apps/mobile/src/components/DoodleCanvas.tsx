import { useEffect, useMemo, useRef, useState } from "react"
import { View, StyleSheet } from "react-native"
import Svg, { Path } from "react-native-svg"
import { prepareStrokes } from "../game/doodles"
import type { Doodle } from "../game/types"

type Props = {
    doodle: Doodle
    playing: boolean
    onDone?: () => void
    ink?: string
    duration?: number
}

export function DoodleCanvas({ doodle, playing, onDone, ink = "#3b2f2a", duration = 3600 }: Props) {
    const [progress, setProgress] = useState(playing ? 0 : 1)
    const raf = useRef<number | null>(null)
    const startRef = useRef<number | null>(null)
    const doneRef = useRef(false)

    const { strokes, totalLength } = useMemo(() => prepareStrokes(doodle), [doodle])

    useEffect(() => {
        doneRef.current = false
        if (!playing) {
            setProgress(1)
            return
        }
        setProgress(0)
        startRef.current = null

        const step = (ts: number) => {
            if (startRef.current == null) startRef.current = ts
            const p = Math.min(1, (ts - startRef.current) / duration)
            setProgress(p)
            if (p < 1) {
                raf.current = requestAnimationFrame(step)
            } else if (!doneRef.current) {
                doneRef.current = true
                onDone?.()
            }
        }
        raf.current = requestAnimationFrame(step)
        return () => {
            if (raf.current != null) cancelAnimationFrame(raf.current)
        }
    }, [doodle, playing, duration, onDone])

    const allowed = progress * totalLength

    return (
        <View style={styles.wrap}>
            <Svg width="100%" height="100%" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
                {strokes.map((st, i) => {
                    const strokeEnd = st.cumulativeStart + st.length
                    if (allowed <= st.cumulativeStart) return null
                    const visible = Math.min(st.length, allowed - st.cumulativeStart)
                    const frac = st.length > 0 ? visible / st.length : 1
                    const dashOffset = st.length * (1 - frac)
                    return (
                        <Path
                            key={i}
                            d={st.path}
                            stroke={ink}
                            strokeWidth={st.w}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                            strokeDasharray={`${st.length} ${st.length}`}
                            strokeDashoffset={dashOffset}
                        />
                    )
                })}
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
