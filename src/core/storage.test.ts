import { describe, expect, it } from 'vitest'
import {
  readJson,
  type StorageLike,
  storageKey,
  writeJson,
} from '@/core/storage'

function memoryStorage(): StorageLike & { removed: string[] } {
  const values = new Map<string, string>()
  const removed: string[] = []
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
      removed.push(key)
    },
    removed,
  }
}

describe('storage', () => {
  it('namespaces keys by version, game, and kind', () => {
    expect(storageKey('wordle', 'state')).toBe('words:v1:wordle:state')
    expect(storageKey('cryptogram', 'stats')).toBe('words:v1:cryptogram:stats')
  })

  it('round-trips JSON', () => {
    const storage = memoryStorage()
    expect(writeJson(storage, 'key', { a: 1 })).toBe(true)
    expect(readJson(storage, 'key')).toEqual({ a: 1 })
  })

  it('discards corrupt JSON', () => {
    const storage = memoryStorage()
    storage.setItem('key', '{bad')
    expect(readJson(storage, 'key')).toBeNull()
    expect(storage.removed).toContain('key')
  })

  it('fails closed when storage throws', () => {
    const throwing: StorageLike = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    }
    expect(readJson(throwing, 'key')).toBeNull()
    expect(writeJson(throwing, 'key', { a: 1 })).toBe(false)
  })
})
