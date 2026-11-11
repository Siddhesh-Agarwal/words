import { Store } from '@tanstack/store'
import {
  type LadderStats,
  loadStats,
  recordResult,
  saveStats,
} from '@/games/word-ladder/state'

export const ladderStatsStore = new Store<LadderStats>(loadStats())

ladderStatsStore.subscribe(() => {
  saveStats(ladderStatsStore.state)
})

export function recordLadderResult(
  puzzleNo: number,
  steps: number,
  par: number,
): void {
  const current = ladderStatsStore.state
  const next = recordResult(current, puzzleNo, steps, par)
  if (next !== current) {
    ladderStatsStore.setState(() => next)
  }
}
