import AsyncStorage from "@react-native-async-storage/async-storage"
import { LS_KEY } from "./constants"
import type { SavedState } from "./types"

export async function loadState(): Promise<SavedState> {
    try {
        const raw = await AsyncStorage.getItem(LS_KEY)
        return raw ? (JSON.parse(raw) as SavedState) : {}
    } catch {
        return {}
    }
}

export async function saveState(state: SavedState): Promise<void> {
    try {
        await AsyncStorage.setItem(LS_KEY, JSON.stringify(state))
    } catch {
        // ignore persistence errors
    }
}
