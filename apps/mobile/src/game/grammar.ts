import type { GrammarCheck, GrammarError } from "./types"

const VERB3: Record<string, string> = {
    draw: "draws",
    look: "looks",
    see: "sees",
    seem: "seems",
    go: "goes",
    guess: "guesses",
    think: "thinks",
    run: "runs",
    jump: "jumps",
    eat: "eats",
    fly: "flies",
    swim: "swims",
    hold: "holds",
    wear: "wears",
    smile: "smiles",
    have: "has",
    do: "does",
    sit: "sits",
    stand: "stands",
    mean: "means",
    want: "wants",
    need: "needs",
    live: "lives",
    make: "makes",
    shine: "shines",
    grow: "grows",
    float: "floats",
}

const VERBS = Object.keys(VERB3).join("|")

type Rule = {
    re: RegExp
    type: string
    message: string
    fix: (...args: string[]) => string
}

const RULES: Rule[] = [
    {
        re: /\b(\w+) \1\b/gi,
        type: "repeat",
        message: "You repeated a word.",
        fix: (_m, w) => w,
    },
    {
        re: /\bi (is|are|was|were)\b/g,
        type: "be",
        message: 'With "I", use "am".',
        fix: () => "I am",
    },
    {
        re: /\b(you|we|they) is\b/gi,
        type: "be",
        message: "With you / we / they, use \"are\".",
        fix: (_m, s) => `${s} are`,
    },
    {
        re: /\b(you|we|they) was\b/gi,
        type: "be",
        message: "With you / we / they, use \"were\".",
        fix: (_m, s) => `${s} were`,
    },
    {
        re: /\b(he|she|it) (are|am)\b/gi,
        type: "be",
        message: "With he / she / it, use \"is\".",
        fix: (_m, s) => `${s} is`,
    },
    {
        re: /\b(he|she|it) don't\b/gi,
        type: "agree",
        message: 'With he / she / it, use "doesn\'t".',
        fix: (_m, s) => `${s} doesn't`,
    },
    {
        re: new RegExp(`\\b(he|she|it) (${VERBS})\\b`, "gi"),
        type: "agree",
        message: 'After he / she / it, the verb takes an "-s".',
        fix: (_m, s, v) => `${s} ${VERB3[v.toLowerCase()]}`,
    },
    {
        re: /\ba (?=[aeiou])/gi,
        type: "article",
        message: 'Use "an" before a vowel sound.',
        fix: () => "an ",
    },
    {
        re: /\ban (?=[bcdfghjklmnpqrstvwxyz])/gi,
        type: "article",
        message: 'Use "a" before a consonant sound.',
        fix: () => "a ",
    },
    {
        re: /\bi\b/g,
        type: "capital-i",
        message: 'Always write "I" with a capital letter.',
        fix: () => "I",
    },
]

function detectSpans(text: string): GrammarError[] {
    const spans: GrammarError[] = []
    for (const rule of RULES) {
        rule.re.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = rule.re.exec(text)) !== null) {
            if (m[0].length === 0) {
                rule.re.lastIndex++
                continue
            }
            const trimmed = m[0].replace(/\s+$/, "")
            spans.push({
                start: m.index,
                end: m.index + trimmed.length,
                bad: trimmed,
                message: rule.message,
                type: rule.type,
            })
        }
    }
    const fm = text.match(/[a-z]/)
    if (fm && text.search(/[A-Za-z]/) === fm.index && /[a-z]/.test(text[fm.index])) {
        const i = fm.index
        if (text.slice(0, i).trim() === "") {
            spans.push({
                start: i,
                end: i + 1,
                bad: text[i],
                message: "Start your sentence with a capital letter.",
                type: "capital",
            })
        }
    }
    spans.sort((a, b) => a.start - b.start || b.end - a.end)
    const out: GrammarError[] = []
    let lastEnd = -1
    for (const s of spans) {
        if (s.start >= lastEnd) {
            out.push(s)
            lastEnd = s.end
        }
    }
    return out
}

function buildCorrected(text: string): string {
    let s = text
    for (const rule of RULES) {
        rule.re.lastIndex = 0
        s = s.replace(rule.re, (...args) => rule.fix(...(args as string[])))
    }
    s = s.replace(/^(\s*)([a-z])/, (_m, sp, c) => sp + c.toUpperCase())
    s = s.replace(/\s{2,}/g, " ").replace(/\s+([?!.,])/g, "$1")
    return s
}

export function checkGrammar(text: string): GrammarCheck {
    const raw = text || ""
    if (!raw.trim()) return { ok: true, corrected: raw, errors: [] }
    const errors = detectSpans(raw)
    const corrected = buildCorrected(raw)
    const ok = errors.length === 0 && corrected.trim() === raw.trim()
    return { ok, corrected, errors }
}

export function guardCopy(tone: string) {
    switch (tone) {
        case "neutral":
            return {
                lead: "Correction",
                verb: "Suggested",
                cheer: "Correct.",
                nudge: "Check the highlighted words.",
            }
        case "strict":
            return {
                lead: "Fix this",
                verb: "Required",
                cheer: "Acceptable.",
                nudge: "This is not correct yet.",
            }
        case "mascot":
            return {
                lead: "Gus says",
                verb: "Try",
                cheer: "Wahoo! Perfect English!",
                nudge: "Ooh, almost! Tap to tidy it up.",
            }
        default:
            return {
                lead: "Almost!",
                verb: "Try",
                cheer: "Nice — perfect grammar!",
                nudge: "Small fix and it's perfect.",
            }
    }
}
