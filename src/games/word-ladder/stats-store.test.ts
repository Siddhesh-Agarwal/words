import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialStats } from '@/games/word-ladder/state'
import {
  ladderStatsStore,
  recordLadderResult,
} from '@/games/word-ladder/stats-store'

beforeEach(() => {
  ladderStatsStore.setState(() => createInitialStats())
})

describe('Word Ladder stats store', () => {
  it('records a solve', () => {
    recordLadderResult(0, 6, 5)

    expect(ladderStatsStore.state).toMatchObject({
      solved: 1,
      currentStreak: 1,
      bestSteps: 6,
      perfect: 0,
      lastPlayedPuzzleNo: 0,
    })
  })

  it('does not record the same puzzle twice', () => {
    recordLadderResult(0, 6, 5)
    recordLadderResult(0, 6, 5)

    expect(ladderStatsStore.state.solved).toBe(1)
  })

  it('tracks perfect games and best steps', () => {
    recordLadderResult(0, 6, 5)
    recordLadderResult(1, 5, 5)

    expect(ladderStatsStore.state.bestSteps).toBe(5)
    expect(ladderStatsStore.state.perfect).toBe(1)
    expect(ladderStatsStore.state.currentStreak).toBe(2)
  })
})
