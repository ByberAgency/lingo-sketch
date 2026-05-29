import { type ReactNode } from "react"
import { Text } from "react-native"
import type { GrammarError } from "../game/types"
import { mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"

type Props = {
    text: string
    errors: GrammarError[]
    ink: string
    guard: string
    fontSize?: number
}

export function RenderWithErrors({ text, errors, ink, guard, fontSize = 16 }: Props) {
    if (!errors.length) {
        return (
            <Text style={{ color: ink, fontFamily: fonts.bodyExtra, fontSize, lineHeight: 22 }}>
                {text}
            </Text>
        )
    }

    const parts: ReactNode[] = []
    let cursor = 0
    errors.forEach((e, i) => {
        if (e.start > cursor) {
            parts.push(
                <Text key={`t${i}`} style={{ color: ink }}>
                    {text.slice(cursor, e.start)}
                </Text>,
            )
        }
        parts.push(
            <Text
                key={`e${i}`}
                style={{
                    color: ink,
                    textDecorationLine: "underline",
                    textDecorationStyle: "dashed",
                    textDecorationColor: guard,
                    backgroundColor: mixColor(guard, "#ffffff", 0.76),
                }}
            >
                {text.slice(e.start, e.end)}
            </Text>,
        )
        cursor = e.end
    })
    if (cursor < text.length) {
        parts.push(
            <Text key="tail" style={{ color: ink }}>
                {text.slice(cursor)}
            </Text>,
        )
    }

    return (
        <Text style={{ fontFamily: fonts.bodyExtra, fontSize, lineHeight: 22 }}>{parts}</Text>
    )
}
