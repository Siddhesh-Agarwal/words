import { describe, expect, it } from 'vitest'
import {
  EPOCHS,
  type GameId,
  parsePuzzleOverride,
  puzzleNumberFor,
  puzzleWeekday,
  resolvePuzzleNumber,
} from '@/core/date'

describe('puzzle dates', () => {
  it('starts each game at its own epoch', () => {
    for (const game of Object.keys(EPOCHS) as GameId[]) {
      const [year, month, day] = EPOCHS[game].split('-').map(Number)
      expect(
        puzzleNumberFor(game, new Date(Date.UTC(year, month - 1, day, 12))),
      ).toBe(1)
      expect(
        puzzleNumberFor(
          game,
          new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 1)),
        ),
      ).toBe(2)
      expect(
        puzzleNumberFor(
          game,
          new Date(Date.UTC(year, month - 1, day - 1, 23, 59)),
        ),
      ).toBe(0)
    }
  })

  it('flips at 00:00 UTC', () => {
    expect(
      puzzleNumberFor('wordle', new Date(Date.UTC(2026, 10, 10, 23, 59, 59))),
    ).toBe(0)
    expect(
      puzzleNumberFor('wordle', new Date(Date.UTC(2026, 10, 11, 0, 0, 0))),
    ).toBe(1)
  })

  it('maps puzzle numbers to Monday-first weekdays', () => {
    expect(puzzleWeekday('wordle', 1)).toBe(2)
    expect(puzzleWeekday('wordle', 2)).toBe(3)
    expect(puzzleWeekday('wordle', 3)).toBe(4)
    expect(puzzleWeekday('wordle', 4)).toBe(5)
    expect(puzzleWeekday('wordle', 5)).toBe(6)
    expect(puzzleWeekday('wordle', 6)).toBe(0)
    expect(puzzleWeekday('wordle', 7)).toBe(1)
  })

  it('agrees with the date-to-puzzle-number mapping', () => {
    const date = new Date(Date.UTC(2026, 10, 18))
    expect(puzzleNumberFor('wordle', date)).toBe(8)
    expect(puzzleWeekday('wordle', 8)).toBe(2)
  })

  it('parses valid dev overrides', () => {
    expect(parsePuzzleOverride('?puzzle=12')).toBe(12)
    expect(parsePuzzleOverride('?puzzle=0')).toBe(0)
    expect(parsePuzzleOverride('?puzzle=-1')).toBeNull()
    expect(parsePuzzleOverride('?puzzle=abc')).toBeNull()
    expect(parsePuzzleOverride('?foo=1')).toBeNull()
  })

  it('applies the override only when allowed', () => {
    const now = new Date(Date.UTC(2026, 10, 20))
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
