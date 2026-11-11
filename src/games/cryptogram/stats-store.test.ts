import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialStats } from '@/games/cryptogram/state'
import {
  cryptogramStatsStore,
  recordCryptogramResult,
} from '@/games/cryptogram/stats-store'

beforeEach(() => {
  cryptogramStatsStore.setState(() => createInitialStats())
})

describe('Cryptogram stats store', () => {
  it('records a solve', () => {
    recordCryptogramResult(0, 1)

    expect(cryptogramStatsStore.state).toMatchObject({
      solved: 1,
      currentStreak: 1,
      bestHints: 1,
      perfect: 0,
      lastPlayedPuzzleNo: 0,
    })
  })

  it('does not record the same puzzle twice', () => {
    recordCryptogramResult(0, 1)
    recordCryptogramResult(0, 1)

    expect(cryptogramStatsStore.state.solved).toBe(1)
  })

  it('tracks perfect solves and best hints', () => {
    recordCryptogramResult(0, 2)
    recordCryptogramResult(1, 0)

    expect(cryptogramStatsStore.state.bestHints).toBe(0)
    expect(cryptogramStatsStore.state.perfect).toBe(1)
    expect(cryptogramStatsStore.state.currentStreak).toBe(2)
  })
})
