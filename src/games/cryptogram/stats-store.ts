import { Store } from '@tanstack/store'
import {
  type CryptogramStats,
  loadStats,
  recordResult,
  saveStats,
} from '@/games/cryptogram/state'

export const cryptogramStatsStore = new Store<CryptogramStats>(loadStats())

cryptogramStatsStore.subscribe(() => {
  saveStats(cryptogramStatsStore.state)
})

export function recordCryptogramResult(
  puzzleNo: number,
  hintsUsed: number,
): void {
  const current = cryptogramStatsStore.state
  const next = recordResult(current, puzzleNo, hintsUsed)
  if (next !== current) {
    cryptogramStatsStore.setState(() => next)
  }
}
