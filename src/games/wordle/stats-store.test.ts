import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialStats } from '@/games/wordle/state'
import {
  recordWordleResult,
  wordleStatsStore,
} from '@/games/wordle/stats-store'

beforeEach(() => {
  wordleStatsStore.setState(() => createInitialStats())
})

describe('Wordle stats store', () => {
  it('records a completed game', () => {
    recordWordleResult(0, true, 3)

    expect(wordleStatsStore.state).toMatchObject({
      played: 1,
      wins: 1,
      currentStreak: 1,
      maxStreak: 1,
      lastPlayedPuzzleNo: 0,
    })
    expect(wordleStatsStore.state.distribution[2]).toBe(1)
  })

  it('does not record the same puzzle twice', () => {
    recordWordleResult(0, true, 3)
    recordWordleResult(0, true, 3)

    expect(wordleStatsStore.state.played).toBe(1)
    expect(wordleStatsStore.state.distribution[2]).toBe(1)
  })

  it('resets the streak after a loss and continues after the next win', () => {
    recordWordleResult(0, true, 3)
    recordWordleResult(1, false, 6)
    expect(wordleStatsStore.state.currentStreak).toBe(0)

    recordWordleResult(2, true, 4)
    expect(wordleStatsStore.state.currentStreak).toBe(1)
    expect(wordleStatsStore.state.played).toBe(3)
  })
})
