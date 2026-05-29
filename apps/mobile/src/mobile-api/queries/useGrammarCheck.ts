import { useCallback, useEffect, useRef, useState } from "react"
import { checkGrammar as checkGrammarApi } from "@lingo-sketch/api-client"
import { checkGrammar as checkGrammarLocal } from "../../game/grammar"
import type { GrammarCheck } from "../../game/types"

const DEBOUNCE_MS = 400

function emptyCheck(text: string): GrammarCheck {
    return { ok: true, corrected: text, errors: [] }
}

function toCheck(data: { ok: boolean; corrected: string; errors?: GrammarCheck["errors"] }): GrammarCheck {
    return {
        ok: data.ok,
        corrected: data.corrected,
        errors: data.errors ?? [],
    }
}

export function useGrammarCheck(text: string) {
    const [check, setCheck] = useState<GrammarCheck>(() =>
        text.trim() ? checkGrammarLocal(text) : emptyCheck(text),
    )
    const [checking, setChecking] = useState(false)
    const reqId = useRef(0)

    useEffect(() => {
        const raw = text || ""
        if (!raw.trim()) {
            setCheck(emptyCheck(raw))
            setChecking(false)
            return
        }

        setCheck(checkGrammarLocal(raw))
        setChecking(true)

        const id = ++reqId.current
        const timer = setTimeout(async () => {
            try {
                const { data, error } = await checkGrammarApi({
                    body: { text: raw },
                })
                if (id !== reqId.current) return
                if (data && !error) {
                    setCheck(toCheck(data))
                } else {
                    setCheck(checkGrammarLocal(raw))
                }
            } catch {
                if (id === reqId.current) {
                    setCheck(checkGrammarLocal(raw))
                }
            } finally {
                if (id === reqId.current) setChecking(false)
            }
        }, DEBOUNCE_MS)

        return () => clearTimeout(timer)
    }, [text])

    const refresh = useCallback(async (): Promise<GrammarCheck> => {
        const raw = text || ""
        if (!raw.trim()) {
            const result = emptyCheck(raw)
            setCheck(result)
            return result
        }

        setChecking(true)
        const id = ++reqId.current
        try {
            const { data, error } = await checkGrammarApi({ body: { text: raw } })
            if (id !== reqId.current) return check
            const result =
                data && !error ? toCheck(data) : checkGrammarLocal(raw)
            setCheck(result)
            return result
        } catch {
            const result = checkGrammarLocal(raw)
            setCheck(result)
            return result
        } finally {
            if (id === reqId.current) setChecking(false)
        }
    }, [text, check])

    return { check, checking, refresh }
}
