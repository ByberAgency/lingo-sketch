import { Injectable, Logger } from "@nestjs/common"
import { checkGrammarRules } from "./rules"
import { GeminiService } from "./gemini.service"
import type { GrammarCheck } from "./grammar.types"

const CACHE_MAX = 200

@Injectable()
export class GrammarService {
    private readonly logger = new Logger(GrammarService.name)
    private readonly cache = new Map<string, GrammarCheck>()

    constructor(private readonly gemini: GeminiService) {}

    async check(text: string): Promise<GrammarCheck> {
        const raw = text || ""
        if (!raw.trim()) {
            return { ok: true, corrected: raw, errors: [] }
        }

        const cacheKey = raw.trim().toLowerCase()
        const cached = this.cache.get(cacheKey)
        if (cached) return cached

        let result: GrammarCheck | null = null

        if (this.gemini.isConfigured()) {
            try {
                result = await this.gemini.check(raw)
            } catch (err) {
                this.logger.warn(
                    `Gemini grammar check failed, using rules fallback: ${err instanceof Error ? err.message : err}`,
                )
            }
        }

        if (!result) {
            result = checkGrammarRules(raw)
        }

        result = this.normalize(result, raw)
        this.setCache(cacheKey, result)
        return result
    }

    private normalize(check: GrammarCheck, original: string): GrammarCheck {
        const corrected = check.corrected.trim() === original.trim()
            ? original
            : check.corrected
        const ok =
            check.errors.length === 0 &&
            corrected.trim().toLowerCase() === original.trim().toLowerCase()
        return { ok, corrected, errors: check.errors }
    }

    private setCache(key: string, value: GrammarCheck) {
        if (this.cache.size >= CACHE_MAX) {
            const first = this.cache.keys().next().value
            if (first) this.cache.delete(first)
        }
        this.cache.set(key, value)
    }
}
