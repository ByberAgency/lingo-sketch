import { useEffect, useRef } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import Svg, { Path } from "react-native-svg"
import type { GrammarError } from "../game/types"
import { mixColor } from "../theme/colors"
import { fonts } from "../theme/typography"
import { RenderWithErrors } from "./RenderWithErrors"

type Props = {
    value: string
    onChange: (v: string) => void
    onSend: () => void
    errors?: GrammarError[]
    showUnderline?: boolean
    placeholder?: string
    canSend?: boolean
    checking?: boolean
    theme: { ink: string; surface: string; primary: string; guard: string }
}

export function GuardedInput({
    value,
    onChange,
    onSend,
    errors = [],
    showUnderline,
    placeholder,
    canSend,
    checking,
    theme,
}: Props) {
    const inputRef = useRef<TextInput>(null)
    const hasErr = showUnderline && errors.length > 0

    return (
        <View style={styles.row}>
            <View
                style={[
                    styles.field,
                    {
                        backgroundColor: theme.surface,
                        borderColor: hasErr ? theme.guard : "transparent",
                        shadowColor: hasErr ? theme.guard : "#000",
                        shadowOpacity: hasErr ? 0.28 : 0.06,
                    },
                ]}
            >
                {showUnderline && value.length > 0 && (
                    <View style={styles.mirror} pointerEvents="none">
                        <RenderWithErrors
                            text={value}
                            errors={errors}
                            ink={theme.ink}
                            guard={theme.guard}
                        />
                    </View>
                )}
                <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: theme.ink }]}
                    value={value}
                    placeholder={placeholder}
                    placeholderTextColor={mixColor(theme.ink, "#ffffff", 0.38)}
                    onChangeText={onChange}
                    onSubmitEditing={() => canSend && onSend()}
                    returnKeyType="send"
                />
            </View>
            <Pressable
                style={[
                    styles.send,
                    {
                        backgroundColor: theme.primary,
                        opacity: canSend && !checking ? 1 : 0.45,
                    },
                ]}
                onPress={onSend}
                disabled={!canSend || checking}
            >
                <Svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    style={{ transform: [{ rotate: "180deg" }] }}
                >
                    <Path d="M4 12l16-8-6 8 6 8z" fill="#fff" />
                </Svg>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 9,
    },
    field: {
        flex: 1,
        position: "relative",
        borderWidth: 2,
        borderRadius: 22,
        minHeight: 46,
        justifyContent: "center",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 10,
        elevation: 2,
    },
    mirror: {
        position: "absolute",
        left: 16,
        right: 16,
        top: 12,
        zIndex: 1,
        opacity: 0,
    },
    input: {
        fontFamily: fonts.bodySemi,
        fontSize: 15.5,
        lineHeight: 21,
        letterSpacing: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        textAlignVertical: "center",
        zIndex: 2,
    },
    send: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
    },
})
