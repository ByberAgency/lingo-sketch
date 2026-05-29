export function answerYesNo(question: string, word: string): string {
    const q = question.toLowerCase()
    const animals = ["cat", "fish"]

    if (q.includes("animal")) return animals.includes(word) ? "Yes! 🐾" : "Nope!"
    if (q.includes("eat")) return word === "fish" ? "Yes!" : "No, you can't."
    if (q.includes("fly")) return "No, it can't fly."
    if (q.includes("water")) return word === "fish" || word === "boat" ? "Yes!" : "No."
    if (q.includes("big")) return ["house", "boat", "tree", "sun"].includes(word) ? "Quite big!" : "Not really."
    if (q.includes("sky")) return word === "sun" ? "Yes!" : "No."
    if (q.includes("alive") || q.includes("live")) {
        return animals.includes(word) || word === "tree" ? "Sort of!" : "No."
    }
    if (q.includes("color") || q.includes("green") || q.includes("red")) return "Good question!"
    return "Hmm, maybe!"
}

export const YESNO_CHIPS = [
    "Is it an animal?",
    "Can you eat it?",
    "Is it big?",
    "Is it alive?",
] as const

export function isYesNoQuestion(text: string): boolean {
    return /\?\s*$/.test(text.trim())
}
