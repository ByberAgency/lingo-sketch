import type { Doodle, Stroke } from "./types"

function arc(cx: number, cy: number, r: number, a0: number, a1: number, n?: number): [number, number][] {
    const pts: [number, number][] = []
    const steps = n ?? Math.max(10, Math.round(Math.abs(a1 - a0) / (Math.PI / 16)))
    for (let i = 0; i <= steps; i++) {
        const a = a0 + (a1 - a0) * (i / steps)
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
    }
    return pts
}

const circle = (cx: number, cy: number, r: number) => arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5)

function ellipse(cx: number, cy: number, rx: number, ry: number, n?: number): [number, number][] {
    const pts: [number, number][] = []
    const steps = n ?? 40
    for (let i = 0; i <= steps; i++) {
        const a = -Math.PI / 2 + Math.PI * 2 * (i / steps)
        pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry])
    }
    return pts
}

const dot = (cx: number, cy: number, r: number) => circle(cx, cy, r)

export const DOODLES: Doodle[] = [
    {
        word: "cat",
        article: "a",
        hint: "an animal",
        strokes: [
            { pts: circle(150, 150, 66), w: 7 },
            { pts: [[95, 105], [78, 48], [128, 88]], w: 7 },
            { pts: [[205, 105], [222, 48], [172, 88]], w: 7 },
            { pts: dot(126, 142, 7), w: 6 },
            { pts: dot(174, 142, 7), w: 6 },
            { pts: [[143, 162], [157, 162], [150, 172]], w: 6 },
            { pts: [[150, 172], [150, 182]], w: 5 },
            { pts: arc(135, 182, 16, 0, Math.PI, 10), w: 5 },
            { pts: arc(165, 182, 16, 0, Math.PI, 10), w: 5 },
            { pts: [[120, 158], [70, 150]], w: 4 },
            { pts: [[120, 168], [70, 172]], w: 4 },
            { pts: [[180, 158], [230, 150]], w: 4 },
            { pts: [[180, 168], [230, 172]], w: 4 },
        ],
    },
    {
        word: "house",
        article: "a",
        hint: "a place you live",
        strokes: [
            { pts: [[88, 250], [88, 152], [212, 152], [212, 250], [88, 250]], w: 7 },
            { pts: [[74, 152], [150, 80], [226, 152]], w: 7 },
            { pts: [[132, 250], [132, 198], [168, 198], [168, 250]], w: 6 },
            { pts: [[104, 172], [134, 172], [134, 200], [104, 200], [104, 172]], w: 5 },
            { pts: [[119, 172], [119, 200]], w: 4 },
            { pts: [[104, 186], [134, 186]], w: 4 },
            { pts: [[176, 250], [176, 198], [200, 198], [200, 250]], w: 5 },
        ],
    },
    {
        word: "fish",
        article: "a",
        hint: "it lives in water",
        strokes: [
            { pts: ellipse(146, 156, 74, 52), w: 7 },
            { pts: [[214, 156], [262, 116], [262, 196], [214, 156]], w: 7 },
            { pts: dot(110, 142, 6), w: 6 },
            { pts: arc(120, 168, 18, 0.1, Math.PI - 0.1, 12), w: 5 },
            { pts: arc(150, 130, 22, Math.PI + 0.4, Math.PI * 2 - 0.4, 10), w: 4 },
            { pts: [[150, 130], [150, 108]], w: 4 },
        ],
    },
    {
        word: "sun",
        article: "the",
        hint: "it is in the sky",
        strokes: [
            { pts: circle(150, 150, 52), w: 8 },
            ...[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const a = (deg * Math.PI) / 180
                return {
                    pts: [
                        [150 + Math.cos(a) * 64, 150 + Math.sin(a) * 64],
                        [150 + Math.cos(a) * 96, 150 + Math.sin(a) * 96],
                    ] as [number, number][],
                    w: 7,
                }
            }),
            { pts: dot(132, 142, 5), w: 5 },
            { pts: dot(168, 142, 5), w: 5 },
            { pts: arc(150, 158, 22, 0.2, Math.PI - 0.2, 12), w: 5 },
        ],
    },
    {
        word: "tree",
        article: "a",
        hint: "it grows in a forest",
        strokes: [
            { pts: [[138, 270], [138, 180], [162, 180], [162, 270]], w: 7 },
            { pts: circle(150, 132, 60), w: 7 },
            { pts: circle(104, 158, 38), w: 6 },
            { pts: circle(196, 158, 38), w: 6 },
            { pts: [[150, 270], [120, 270]], w: 6 },
            { pts: [[150, 270], [180, 270]], w: 6 },
        ],
    },
    {
        word: "boat",
        article: "a",
        hint: "it floats on the sea",
        strokes: [
            { pts: [[70, 190], [230, 190], [205, 248], [95, 248], [70, 190]], w: 7 },
            { pts: [[150, 188], [150, 80]], w: 7 },
            { pts: [[150, 90], [150, 175], [215, 165], [150, 90]], w: 6 },
            { pts: arc(150, 268, 40, Math.PI + 0.3, Math.PI * 2 - 0.3, 14), w: 4 },
            { pts: arc(70, 270, 30, Math.PI + 0.3, Math.PI * 2 - 0.3, 10), w: 4 },
        ],
    },
]

export function strokeToPath(pts: [number, number][]): string {
    if (pts.length === 0) return ""
    const [first, ...rest] = pts
    return `M ${first[0]} ${first[1]} ${rest.map(([x, y]) => `L ${x} ${y}`).join(" ")}`
}

export function strokeLength(pts: [number, number][]): number {
    let len = 0
    for (let i = 1; i < pts.length; i++) {
        const dx = pts[i][0] - pts[i - 1][0]
        const dy = pts[i][1] - pts[i - 1][1]
        len += Math.hypot(dx, dy)
    }
    return len
}

export function pickRounds(count = 2): number[] {
    const idx = DOODLES.map((_, i) => i)
    for (let i = idx.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0
        ;[idx[i], idx[j]] = [idx[j], idx[i]]
    }
    return idx.slice(0, count)
}

export const SCRIPTS: Record<string, [string, number][]> = {
    cat: [
        ["i think it is a animal", 1100],
        ["it have pointy ears", 3000],
        ["is it a tiger?", 5200],
    ],
    house: [
        ["i think it is a building", 1100],
        ["it have a red roof", 3000],
        ["is it a barn?", 5200],
    ],
    fish: [
        ["i think it live in water", 1100],
        ["it have small fins", 3000],
        ["is it a shark?", 5200],
    ],
    sun: [
        ["i think it shine in the sky", 1100],
        ["it is yellow and hot", 3000],
        ["is it a star?", 5200],
    ],
    tree: [
        ["i think it grow outside", 1100],
        ["it have green leaves", 3000],
        ["is it a bush?", 5200],
    ],
    boat: [
        ["i think it float on water", 1100],
        ["it have a big sail", 3000],
        ["is it a ship?", 5200],
    ],
}

export type StrokeRender = Stroke & { path: string; length: number; cumulativeStart: number }

export function prepareStrokes(doodle: Doodle): { strokes: StrokeRender[]; totalLength: number } {
    let cumulative = 0
    const strokes = doodle.strokes.map((st) => {
        const path = strokeToPath(st.pts)
        const length = strokeLength(st.pts)
        const item: StrokeRender = { ...st, path, length, cumulativeStart: cumulative }
        cumulative += length
        return item
    })
    return { strokes, totalLength: cumulative }
}
