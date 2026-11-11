import { Store } from '@tanstack/store'
import {
  loadStats,
  recordResult,
  saveStats,
  type WordleStats,
} from '@/games/wordle/state'

export const wordleStatsStore = new Store<WordleStats>(loadStats())

wordleStatsStore.subscribe(() => {
  saveStats(wordleStatsStore.state)
})

export function recordWordleResult(
  puzzleNo: number,
  won: boolean,
  guessCount: number,
): void {
  const current = wordleStatsStore.state
  const next = recordResult(current, puzzleNo, won, guessCount)
  if (next !== current) {
    wordleStatsStore.setState(() => next)
  }
}
