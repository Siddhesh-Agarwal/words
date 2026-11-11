import { describe, expect, it } from 'vitest'
import type { StorageLike } from '@/core/storage'
import {
  addStep,
  createInitialState,
  createInitialStats,
  loadState,
  loadStats,
  recordResult,
  saveState,
  saveStats,
  undoStep,
} from '@/games/word-ladder/state'

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

describe('Word Ladder state', () => {
  it('starts at the start word and supports adding and undoing steps', () => {
    const state = createInitialState(0, 'cold')
    expect(state.path).toEqual(['cold'])

    const stepped = addStep(addStep(state, 'cord'), 'card')
    expect(stepped.path).toEqual(['cold', 'cord', 'card'])

    const undone = undoStep(stepped)
    expect(undone.path).toEqual(['cold', 'cord'])
    expect(undoStep(createInitialState(0, 'cold')).path).toEqual(['cold'])
  })

  it('loads only the matching puzzle and discards invalid state', () => {
    const storage = memoryStorage()
    saveState(addStep(createInitialState(4, 'cold'), 'cord'), storage)

    expect(loadState(4, 'cold', storage).path).toEqual(['cold', 'cord'])
    expect(loadState(5, 'cold', storage).path).toEqual(['cold'])

    storage.setItem('words:v1:word-ladder:state', '{bad')
    expect(loadState(4, 'cold', storage).path).toEqual(['cold'])
  })
})

describe('Word Ladder stats', () => {
  it('starts empty', () => {
    expect(createInitialStats()).toEqual({
      solved: 0,
      currentStreak: 0,
      maxStreak: 0,
      bestSteps: null,
      perfect: 0,
      lastPlayedPuzzleNo: null,
    })
  })

  it('records solves, streaks, best steps, and perfect games once', () => {
    let stats = createInitialStats()

    stats = recordResult(stats, 0, 6, 5)
    expect(stats).toMatchObject({
      solved: 1,
      currentStreak: 1,
      maxStreak: 1,
      bestSteps: 6,
      perfect: 0,
      lastPlayedPuzzleNo: 0,
    })

    expect(recordResult(stats, 0, 6, 5)).toBe(stats)

    stats = recordResult(stats, 1, 5, 5)
    expect(stats).toMatchObject({
      solved: 2,
      currentStreak: 2,
      maxStreak: 2,
      bestSteps: 5,
      perfect: 1,
      lastPlayedPuzzleNo: 1,
    })
  })

  it('resets the streak after a gap', () => {
    let stats = createInitialStats()
    stats = recordResult(stats, 0, 6, 5)
    stats = recordResult(stats, 3, 7, 5)
    expect(stats.currentStreak).toBe(1)
    expect(stats.solved).toBe(2)
  })

  it('persists stats and tolerates corrupt storage', () => {
    const storage = memoryStorage()
    const stats = recordResult(createInitialStats(), 0, 6, 5)
    saveStats(stats, storage)
    expect(loadStats(storage)).toEqual(stats)

    storage.setItem('words:v1:word-ladder:stats', '{bad')
    expect(loadStats(storage)).toEqual(createInitialStats())
  })
})
