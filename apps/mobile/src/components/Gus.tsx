import Svg, { Circle, Line, Path, Rect } from "react-native-svg"
import { SHARED } from "../theme/colors"

type GusMood = "happy" | "think" | "cheer" | "oops"

type Props = {
    mood?: GusMood
    size?: number
    color?: string
}

const eyes: Record<GusMood, { cx: number; cy: number }[] | null> = {
    happy: [
        { cx: 38, cy: 44 },
        { cx: 62, cy: 44 },
    ],
    think: [
        { cx: 40, cy: 42 },
        { cx: 64, cy: 42 },
    ],
    cheer: null,
    oops: [
        { cx: 38, cy: 46 },
        { cx: 62, cy: 46 },
    ],
}

const mouths: Record<GusMood, string> = {
    happy: "M40 64 Q50 74 60 64",
    think: "M46 66 Q50 64 54 66",
    cheer: "M38 62 Q50 80 62 62 Q50 70 38 62 Z",
    oops: "M42 68 Q50 62 58 68",
}

export function Gus({ mood = "happy", size = 64, color = SHARED.guard }: Props) {
    const pupil =
        mood === "oops"
            ? { dx: 0, dy: 2 }
            : mood === "think"
              ? { dx: 3, dy: -1 }
              : { dx: 0, dy: 1 }
    const eyeList = eyes[mood]

    return (
        <Svg width={size} height={size} viewBox="0 0 100 104">
            <Line x1="50" y1="14" x2="50" y2="4" stroke={color} strokeWidth="4" strokeLinecap="round" />
            <Circle cx="50" cy="3" r="4" fill={SHARED.amber} />
            <Rect x="10" y="14" width="80" height="80" rx="30" fill={color} />
            <Rect x="10" y="14" width="80" height="80" rx="30" fill="#fff" opacity={0.1} />
            <Circle cx="50" cy="74" r="13" fill="#fff" opacity={0.92} />
            <Path
                d="M44 74 l4 5 l8 -10"
                fill="none"
                stroke={color}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {mood === "cheer" ? (
                <>
                    <Path d="M30 44 Q38 36 46 44" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                    <Path d="M54 44 Q62 36 70 44" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
                </>
            ) : (
                eyeList?.map((e, i) => (
                    <Svg key={i}>
                        <Circle cx={e.cx} cy={e.cy} r="9" fill="#fff" />
                        <Circle cx={e.cx + pupil.dx} cy={e.cy + pupil.dy} r="4.4" fill="#2a2320" />
                    </Svg>
                ))
            )}
            <Circle cx="30" cy="58" r="5" fill="#fff" opacity={0.25} />
            <Circle cx="70" cy="58" r="5" fill="#fff" opacity={0.25} />
            <Path
                d={mouths[mood]}
                fill={mood === "cheer" ? "#2a2320" : "none"}
                stroke="#2a2320"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    )
}
