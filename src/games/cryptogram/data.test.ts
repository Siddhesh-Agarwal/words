import { describe, expect, it } from 'vitest'
import {
  CRYPTOGRAM_QUOTES,
  CRYPTOGRAM_TIERS,
  preRevealCount,
  quoteForPuzzle,
  tierForWeekday,
} from '@/games/cryptogram/data'

describe('Cryptogram data', () => {
  it('keeps the expected pool and tier counts', () => {
    expect(CRYPTOGRAM_QUOTES).toHaveLength(60)
    expect(CRYPTOGRAM_TIERS.short).toHaveLength(24)
    expect(CRYPTOGRAM_TIERS.medium).toHaveLength(23)
    expect(CRYPTOGRAM_TIERS.long).toHaveLength(13)
  })

  it('assigns length tiers by weekday', () => {
    expect(tierForWeekday(0)).toBe('short')
    expect(tierForWeekday(1)).toBe('short')
    expect(tierForWeekday(2)).toBe('medium')
    expect(tierForWeekday(3)).toBe('medium')
    expect(tierForWeekday(4)).toBe('medium')
    expect(tierForWeekday(5)).toBe('long')
    expect(tierForWeekday(6)).toBe('long')
  })

  it('reveals fewer letters as the week progresses', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(preRevealCount)).toEqual([
      3, 2, 1, 0, 0, 0, 0,
    ])
  })

  it('selects the right tier and rotates within it', () => {
    const wednesday = quoteForPuzzle(0)
    const sunday = quoteForPuzzle(4)
    const monday = quoteForPuzzle(5)
    const nextWednesday = quoteForPuzzle(7)

    expect(wednesday.tier).toBe('medium')
    expect(wednesday.quote.text.length).toBeGreaterThanOrEqual(60)
    expect(wednesday.quote.text.length).toBeLessThan(88)

    expect(sunday.tier).toBe('long')
    expect(sunday.quote.text.length).toBeGreaterThanOrEqual(88)

    expect(monday.tier).toBe('short')
    expect(monday.quote.text.length).toBeLessThan(60)

    expect(nextWednesday.quote.id).not.toBe(wednesday.quote.id)
  })

  it('rejects negative puzzle numbers', () => {
    expect(() => quoteForPuzzle(-1)).toThrow()
  })

  it('gives each weekday in a tier a different quote', () => {
    const ids = (puzzleNos: number[]) =>
      puzzleNos.map((puzzleNo) => quoteForPuzzle(puzzleNo).quote.id)

    const short = ids([5, 6, 12, 13])
    const medium = ids([7, 8, 9])
    const long = ids([10, 11])

    expect(new Set(short).size).toBe(short.length)
    expect(new Set(medium).size).toBe(medium.length)
    expect(new Set(long).size).toBe(long.length)
  })
})
