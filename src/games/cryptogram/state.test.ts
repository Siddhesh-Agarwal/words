import { describe, expect, it } from 'vitest'
import type { StorageLike } from '@/core/storage'
import {
  MAX_HINTS,
  applyHint,
  applyRevealed,
  createInitialState,
  createInitialStats,
  loadState,
  loadStats,
  recordResult,
  saveState,
  saveStats,
  setMapping,
} from '@/games/cryptogram/state'

function memoryStorage(): StorageLike {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
    removeItem: (key) => {
      values.delete(key)
    },
  }
}

describe('Cryptogram state', () => {
  it('starts from the pre-revealed mapping', () => {
    const state = createInitialState(3, { Q: 'E', Z: 'T' })
    expect(state).toMatchObject({
      puzzleNo: 3,
      mapping: { Q: 'E', Z: 'T' },
      revealed: ['Q', 'Z'],
      hintsUsed: 0,
    })
  })

  it('sets and clears editable mappings but locks revealed letters', () => {
    let state = createInitialState(0, { Q: 'E' })

    state = setMapping(state, 'X', 'A')
    expect(state.mapping.X).toBe('A')

    state = setMapping(state, 'X', '')
    expect(state.mapping.X).toBeUndefined()

    const locked = setMapping(state, 'Q', 'Z')
    expect(locked).toBe(state)
  })

  it('reveals up to three hint letters and counts them', () => {
    let state = createInitialState(0, {})
    state = applyHint(state, 'X', 'A')
    state = applyHint(state, 'Y', 'B')
    state = applyHint(state, 'Z', 'C')

    expect(state.hintsUsed).toBe(MAX_HINTS)
    expect(state.revealed).toEqual(['X', 'Y', 'Z'])
    expect(applyHint(state, 'W', 'D')).toBe(state)
    expect(applyHint(state, 'X', 'A')).toBe(state)
  })

  it('forces revealed letters back to their correct values', () => {
    const state = {
      ...createInitialState(0, { Q: 'E' }),
      mapping: { Q: 'Z' },
    }
    expect(applyRevealed(state, { Q: 'E' }).mapping.Q).toBe('E')
  })

  it('loads only the matching puzzle and discards invalid state', () => {
    const storage = memoryStorage()
    const state = setMapping(createInitialState(4, { Q: 'E' }), 'X', 'A')
    saveState(state, storage)

    expect(loadState(4, storage)).toEqual(state)
    expect(loadState(5, storage)).toBeNull()

    storage.setItem('words:v1:cryptogram:state', '{bad')
    expect(loadState(4, storage)).toBeNull()

    storage.setItem(
      'words:v1:cryptogram:state',
      JSON.stringify({ ...state, hintsUsed: 9 }),
    )
    expect(loadState(4, storage)).toBeNull()
  })
})

describe('Cryptogram stats', () => {
  it('starts empty', () => {
    expect(createInitialStats()).toEqual({
      solved: 0,
      currentStreak: 0,
      maxStreak: 0,
      bestHints: null,
      perfect: 0,
      lastPlayedPuzzleNo: null,
    })
  })

  it('records solves, streaks, best hints, and perfect games once', () => {
    let stats = createInitialStats()

    stats = recordResult(stats, 0, 2)
    expect(stats).toMatchObject({
      solved: 1,
      currentStreak: 1,
      maxStreak: 1,
      bestHints: 2,
      perfect: 0,
      lastPlayedPuzzleNo: 0,
    })

    expect(recordResult(stats, 0, 2)).toBe(stats)

    stats = recordResult(stats, 1, 0)
    expect(stats).toMatchObject({
      solved: 2,
      currentStreak: 2,
      maxStreak: 2,
      bestHints: 0,
      perfect: 1,
      lastPlayedPuzzleNo: 1,
    })
  })

  it('resets the streak after a gap', () => {
    let stats = createInitialStats()
    stats = recordResult(stats, 0, 1)
    stats = recordResult(stats, 3, 1)
    expect(stats.currentStreak).toBe(1)
    expect(stats.solved).toBe(2)
  })

  it('persists stats and tolerates corrupt storage', () => {
    const storage = memoryStorage()
    const stats = recordResult(createInitialStats(), 0, 1)
    saveStats(stats, storage)
    expect(loadStats(storage)).toEqual(stats)

    storage.setItem('words:v1:cryptogram:stats', '{bad')
    expect(loadStats(storage)).toEqual(createInitialStats())
  })
})
