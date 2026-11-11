import { describe, expect, it } from 'vitest'
import {
  EPOCHS,
  parsePuzzleOverride,
  puzzleNumberFor,
  puzzleWeekday,
  resolvePuzzleNumber,
  type GameId,
} from '@/core/date'

describe('puzzle dates', () => {
  it('starts each game at its own epoch', () => {
    for (const game of Object.keys(EPOCHS) as GameId[]) {
      const [year, month, day] = EPOCHS[game].split('-').map(Number)
      expect(puzzleNumberFor(game, new Date(year, month - 1, day, 12))).toBe(0)
      expect(puzzleNumberFor(game, new Date(year, month - 1, day + 1, 0, 0, 1))).toBe(1)
      expect(puzzleNumberFor(game, new Date(year, month - 1, day - 1, 23, 59))).toBe(-1)
    }
  })

  it('maps puzzle numbers to Monday-first weekdays', () => {
    expect(puzzleWeekday('wordle', 0)).toBe(2)
    expect(puzzleWeekday('wordle', 1)).toBe(3)
    expect(puzzleWeekday('wordle', 2)).toBe(4)
    expect(puzzleWeekday('wordle', 3)).toBe(5)
    expect(puzzleWeekday('wordle', 4)).toBe(6)
    expect(puzzleWeekday('wordle', 5)).toBe(0)
    expect(puzzleWeekday('wordle', 6)).toBe(1)
  })

  it('parses valid dev overrides', () => {
    expect(parsePuzzleOverride('?puzzle=12')).toBe(12)
    expect(parsePuzzleOverride('?puzzle=0')).toBe(0)
    expect(parsePuzzleOverride('?puzzle=-1')).toBeNull()
    expect(parsePuzzleOverride('?puzzle=abc')).toBeNull()
    expect(parsePuzzleOverride('?foo=1')).toBeNull()
  })

  it('applies the override only when allowed', () => {
    const now = new Date(2026, 10, 20)
    expect(
      resolvePuzzleNumber('wordle', {
        now,
        search: '?puzzle=12',
        allowOverride: true,
      }),
    ).toBe(12)
    expect(
      resolvePuzzleNumber('wordle', {
        now,
        search: '?puzzle=12',
        allowOverride: false,
      }),
    ).toBe(puzzleNumberFor('wordle', now))
  })
})
