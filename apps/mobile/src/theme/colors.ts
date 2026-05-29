export const SHARED = {
    correct: "#2FB98E",
    amber: "#F6A92B",
    guard: "#7C5CFF",
} as const

export const THEMES = {
    warm: {
        bg: "#FBF4EE",
        surface: "#FFFFFF",
        ink: "#3B2F2A",
        primary: "#FF7A5C",
        label: "Warm",
    },
} as const

export type ThemeKey = keyof typeof THEMES
export type Theme = (typeof THEMES)[ThemeKey] & typeof SHARED

export function getTheme(key: ThemeKey = "warm"): Theme {
    return { ...THEMES[key], ...SHARED }
}

function parseHex(hex: string): [number, number, number] {
    const h = hex.replace("#", "")
    return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
    ]
}

function toHex(r: number, g: number, b: number): string {
    const c = (n: number) => Math.round(n).toString(16).padStart(2, "0")
    return `#${c(r)}${c(g)}${c(b)}`
}

/** Approximate CSS color-mix for RN */
export function mixColor(base: string, tint: string, ratio: number): string {
    const [br, bg, bb] = parseHex(base)
    const [tr, tg, tb] = parseHex(tint)
    const t = Math.max(0, Math.min(1, ratio))
    return toHex(br + (tr - br) * t, bg + (tg - bg) * t, bb + (tb - bb) * t)
}

export function inkMuted(ink: string, ratio = 0.55): string {
    return mixColor(ink, "#ffffff", 1 - ratio)
}
