export type GrammarError = {
    start: number
    end: number
    bad: string
    message: string
    type: string
}

export type GrammarCheck = {
    ok: boolean
    corrected: string
    errors: GrammarError[]
}
