import { describe, expect, it } from 'vitest'
import type { StorageLike } from '@/core/storage'
import {
  addGuess,
  createInitialState,
  createInitialStats,
  loadState,
  loadStats,
  recordResult,
  saveState,
  saveStats,
} from '@/games/wordle/state'

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

describe('Wordle state', () => {
  it('creates a fresh playing state', () => {
    const state = createInitialState(0)
    expect(state).toEqual({
      puzzleNo: 0,
      guesses: [],
      status: 'playing',
      hardMode: false,
    })
  })

  it('wins and loses from guesses', () => {
    const won = addGuess(createInitialState(0), 'crane', 'crane')
    expect(won.status).toBe('won')
    expect(won.guesses).toEqual(['crane'])

    let lost = createInitialState(0)
    for (const guess of [
      'aaaaa',
      'bbbbb',
      'ccccc',
      'ddddd',
      'eeeee',
      'fffff',
    ]) {
      lost = addGuess(lost, guess, 'crane')
    }
    expect(lost.status).toBe('lost')
    expect(lost.guesses).toHaveLength(6)
  })

  it('loads only the matching puzzle and discards invalid state', () => {
    const storage = memoryStorage()
    saveState(createInitialState(4), storage)
    expect(loadState(4, storage)?.puzzleNo).toBe(4)
    expect(loadState(5, storage)?.puzzleNo).toBe(5)

    storage.setItem('words:v1:wordle:state', '{bad')
    expect(loadState(5, storage)?.guesses).toEqual([])
  })
})

describe('Wordle stats', () => {
  it('starts empty', () => {
    expect(createInitialStats()).toEqual({
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
      lastPlayedPuzzleNo: null,
    })
  })

  it('records wins, losses, streaks, and the distribution once', () => {
    let stats = createInitialStats()
    stats = recordResult(stats, 0, true, 2)
    expect(stats).toMatchObject({
      played: 1,
      wins: 1,
      currentStreak: 1,
      maxStreak: 1,
      lastPlayedPuzzleNo: 0,
    })
    expect(stats.distribution[1]).toBe(1)

    expect(recordResult(stats, 0, true, 2)).toBe(stats)

    stats = recordResult(stats, 1, true, 4)
    expect(stats.currentStreak).toBe(2)
    expect(stats.maxStreak).toBe(2)
    expect(stats.distribution[3]).toBe(1)

    stats = recordResult(stats, 2, false, 6)
    expect(stats).toMatchObject({
      played: 3,
      wins: 2,
      currentStreak: 0,
      maxStreak: 2,
      lastPlayedPuzzleNo: 2,
    })

    stats = recordResult(stats, 3, true, 3)
    expect(stats.currentStreak).toBe(1)
  })

  it('resets the streak after a gap', () => {
    let stats = createInitialStats()
    stats = recordResult(stats, 0, true, 3)
    stats = recordResult(stats, 2, true, 3)
    expect(stats.currentStreak).toBe(1)
  })

  it('persists stats and tolerates corrupt storage', () => {
    const storage = memoryStorage()
    const stats = recordResult(createInitialStats(), 0, true, 3)
    saveStats(stats, storage)
    expect(loadStats(storage)).toEqual(stats)
    storage.setItem('words:v1:wordle:stats', '{bad')
    expect(loadStats(storage)).toEqual(createInitialStats())
  })
})
