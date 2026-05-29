import Svg, { Circle, Path } from "react-native-svg"

type Props = {
    size?: number
    color?: string
}

export function PeopleIcon({ size = 32, color = "#2d8a5e" }: Props) {
    return (
        <Svg width={size} height={size} viewBox="0 0 32 32">
            <Circle cx={11} cy={10} r={4.5} fill={color} />
            <Path
                d="M4 26c0-4 3-7 7-7s7 3 7 7"
                stroke={color}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
            />
            <Circle cx={22} cy={11} r={3.8} fill={color} opacity={0.85} />
            <Path
                d="M17 26c0-3.5 2.2-6 5-6s5 2.5 5 6"
                stroke={color}
                strokeWidth={2.6}
                fill="none"
                strokeLinecap="round"
                opacity={0.85}
            />
        </Svg>
    )
}
