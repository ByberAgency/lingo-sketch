import { Injectable, Logger } from "@nestjs/common"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { z } from "zod"
import env from "../lib/env"
import type { GrammarCheck } from "./grammar.types"

const GrammarErrorSchema = z.object({
    start: z.number().int().min(0),
    end: z.number().int().min(0),
    bad: z.string(),
    message: z.string(),
    type: z.string(),
})

const GeminiResponseSchema = z.object({
    ok: z.boolean(),
    corrected: z.string(),
    errors: z.array(GrammarErrorSchema),
})

const SYSTEM_PROMPT = `You are an ESL grammar tutor for a word-guessing game.
Fix grammar and typos in the user's English message.
Preserve meaning and intent — questions stay questions, guesses stay guesses.
Make minimal changes; do not rewrite unnecessarily.
Return ONLY valid JSON with this exact shape:
{"ok":boolean,"corrected":string,"errors":[{"start":number,"end":number,"bad":string,"message":string,"type":string}]}
- "ok" is true only when the original is already correct (no changes needed).
- "corrected" is the fixed sentence (same as input when ok is true).
- "errors" lists each mistake with character offsets in the ORIGINAL text (0-based, end exclusive).
- Keep error messages short and friendly for learners.`

@Injectable()
export class GeminiService {
    private readonly logger = new Logger(GeminiService.name)
    private client: GoogleGenerativeAI | null = null

    isConfigured(): boolean {
        return Boolean(env.GEMINI_API_KEY)
    }

    private getClient(): GoogleGenerativeAI {
        if (!env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY is not configured")
        }
        if (!this.client) {
            this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY)
        }
        return this.client
    }

    async check(text: string): Promise<GrammarCheck | null> {
        if (!this.isConfigured()) return null

        const client = this.getClient()
        const model = client.getGenerativeModel({
            model: env.GEMINI_MODEL,
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1,
            },
        })

        const timeoutMs = 3000
        const result = await Promise.race([
            model.generateContent([
                { text: SYSTEM_PROMPT },
                { text: `Check this message:\n${text}` },
            ]),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Gemini timeout")), timeoutMs),
            ),
        ])

        const raw = result.response.text()
        const parsed = GeminiResponseSchema.parse(JSON.parse(raw))

        return {
            ok: parsed.ok,
            corrected: parsed.corrected,
            errors: parsed.errors.filter(e => e.end > e.start && e.end <= text.length),
        }
    }
}
