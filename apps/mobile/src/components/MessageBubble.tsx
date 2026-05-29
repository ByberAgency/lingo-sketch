import { StyleSheet, Text, View } from "react-native"
import type { GameMessage, GameSettings } from "../game/types"
import { mixColor, type Theme } from "../theme/colors"
import { fonts } from "../theme/typography"
import { Avatar } from "./Avatar"
import { Gus } from "./Gus"
import { RenderWithErrors } from "./RenderWithErrors"

type Props = {
    message: GameMessage
    settings: GameSettings
    theme: Theme
    copy: { lead: string }
}

export function MessageBubble({ message: m, settings, theme, copy }: Props) {
    if (m.kind === "system") {
        return (
            <Text style={[styles.system, { color: mixColor(theme.ink, "#ffffff", 0.5) }]}>
                {m.text}
            </Text>
        )
    }

    if (m.kind === "guard") {
        return (
            <View style={styles.guardRow}>
                {settings.mascot && <Gus mood="happy" size={30} />}
                <View
                    style={[
                        styles.guardBubble,
                        {
                            backgroundColor: mixColor(theme.guard, theme.surface, 0.12),
                            borderColor: mixColor(theme.guard, theme.surface, 0.3),
                        },
                    ]}
                >
                    <Text style={[styles.guardLead, { color: theme.guard }]}>{copy.lead}</Text>
                    <Text style={[styles.guardText, { color: theme.ink }]}>"{m.corrected}"</Text>
                    {m.message && (
                        <Text style={[styles.guardSub, { color: mixColor(theme.ink, "#ffffff", 0.4) }]}>
                            {m.message}
                        </Text>
                    )}
                </View>
            </View>
        )
    }

    const you = m.author?.you
    const correct = m.correct
    const isAnswer = m.kind === "answer"

    return (
        <View style={[styles.row, you && styles.rowYou]}>
            {!you && m.author && (
                <Avatar
                    name={m.author.name}
                    color={m.author.color}
                    bot={m.author.bot}
                    size={28}
                    bgColor={theme.bg}
                />
            )}
            <View style={{ maxWidth: "76%" }}>
                {!you && m.author && (
                    <Text style={[styles.author, { color: mixColor(theme.ink, "#ffffff", 0.45) }]}>
                        {m.author.name}
                    </Text>
                )}
                <View
                    style={[
                        styles.bubble,
                        correct
                            ? { backgroundColor: theme.correct }
                            : isAnswer
                              ? {
                                    backgroundColor: mixColor(theme.guard, theme.surface, 0.16),
                                }
                              : you
                                ? { backgroundColor: theme.primary }
                                : { backgroundColor: theme.surface },
                        you && styles.bubbleYou,
                    ]}
                >
                    {correct && <Text style={styles.check}>✓ </Text>}
                    {m.errors && m.errors.length ? (
                        <RenderWithErrors
                            text={m.text ?? ""}
                            errors={m.errors}
                            ink={you || correct ? "#fff" : theme.ink}
                            guard={theme.guard}
                            fontSize={15}
                        />
                    ) : (
                        <Text
                            style={[
                                styles.bubbleText,
                                { color: you || correct ? "#fff" : theme.ink },
                            ]}
                        >
                            {m.text}
                        </Text>
                    )}
                </View>
                {settings.mascot && m.errors && m.errors.length > 0 && m.corrected && (
                    <Text style={[styles.correction, { color: theme.guard }]}>
                        ✎ {m.corrected}
                    </Text>
                )}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    system: {
        textAlign: "center",
        fontSize: 12.5,
        fontFamily: fonts.body,
        paddingVertical: 2,
    },
    guardRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        paddingLeft: 4,
    },
    guardBubble: {
        borderWidth: 1.5,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: "82%",
    },
    guardLead: {
        fontSize: 11,
        fontFamily: fonts.bodyExtra,
    },
    guardText: {
        fontSize: 14.5,
        fontFamily: fonts.body,
        lineHeight: 18,
        marginTop: 1,
    },
    guardSub: {
        fontSize: 12,
        fontFamily: fonts.bodySemi,
        marginTop: 3,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 7,
    },
    rowYou: {
        flexDirection: "row-reverse",
    },
    author: {
        fontSize: 11,
        fontFamily: fonts.bodyExtra,
        marginBottom: 2,
        marginLeft: 10,
    },
    bubble: {
        borderRadius: 18,
        paddingHorizontal: 13,
        paddingVertical: 9,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
        borderBottomLeftRadius: 4,
    },
    bubbleYou: {
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 4,
    },
    bubbleText: {
        fontSize: 15,
        fontFamily: fonts.body,
        lineHeight: 20,
    },
    check: {
        fontFamily: fonts.bodyExtra,
        color: "#fff",
    },
    correction: {
        fontSize: 12.5,
        fontFamily: fonts.body,
        marginTop: 4,
        marginLeft: 4,
    },
})
