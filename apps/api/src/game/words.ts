export type WordEntry = {
    word: string
    article: string
    hint: string
}

export const WORD_BANK: WordEntry[] = [
    { word: "cat", article: "a", hint: "an animal" },
    { word: "house", article: "a", hint: "a place you live" },
    { word: "fish", article: "a", hint: "it lives in water" },
    { word: "sun", article: "the", hint: "it is in the sky" },
    { word: "tree", article: "a", hint: "it grows outside" },
    { word: "boat", article: "a", hint: "it floats on water" },
    { word: "car", article: "a", hint: "you drive it" },
    { word: "apple", article: "an", hint: "a fruit" },
    { word: "dog", article: "a", hint: "a pet animal" },
    { word: "flower", article: "a", hint: "it grows in a garden" },
]

export function pickWordSuggestions(count = 3): WordEntry[] {
    const pool = [...WORD_BANK]
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, count)
}

export function answerYesNo(question: string, word: string): string {
    const q = question.toLowerCase()
    const animals = ["cat", "fish", "dog"]

    if (q.includes("animal")) return animals.includes(word) ? "Yes! 🐾" : "Nope!"
    if (q.includes("eat")) return word === "fish" || word === "apple" ? "Yes!" : "No, you can't."
    if (q.includes("fly")) return "No, it can't fly."
    if (q.includes("water")) return word === "fish" || word === "boat" ? "Yes!" : "No."
    if (q.includes("big")) return ["house", "boat", "tree", "sun", "car"].includes(word) ? "Quite big!" : "Not really."
    if (q.includes("sky")) return word === "sun" ? "Yes!" : "No."
    if (q.includes("alive") || q.includes("live")) {
        return animals.includes(word) || word === "tree" || word === "flower" ? "Sort of!" : "No."
    }
    if (q.includes("color") || q.includes("green") || q.includes("red")) return "Good question!"
    return "Hmm, maybe!"
}

export function isYesNoQuestion(text: string): boolean {
    return /\?\s*$/.test(text.trim())
}

export function isCorrectGuess(text: string, word: string): boolean {
    return new RegExp(`\\b${word}\\b`, "i").test(text)
}
