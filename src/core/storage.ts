import type { GameId } from '@/core/date'

export type StorageKind = 'state' | 'stats'

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function storageKey(game: GameId, kind: StorageKind): string {
  return `words:v1:${game}:${kind}`
}

export function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readJson<T>(
  storage: StorageLike | null,
  key: string,
): T | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    try {
      storage.removeItem(key)
    } catch {
      // Storage is unavailable; nothing to clean up.
    }
    return null
  }
}

export function writeJson(
  storage: StorageLike | null,
  key: string,
  value: unknown,
): boolean {
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
