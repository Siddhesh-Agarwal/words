import quotesJson from '@/data/cryptogram-quotes.json'
import { puzzleWeekday } from '@/core/date'

export type CryptogramCategory = 'quote' | 'proverb' | 'tech'

export type CryptogramQuote = {
  id: string
  text: string
  attribution: string | null
  category: CryptogramCategory
}

export type CryptogramTier = 'short' | 'medium' | 'long'

export type CryptogramPuzzle = {
  quote: CryptogramQuote
  tier: CryptogramTier
  weekday: number
  weekIndex: number
  preRevealedCount: number
}

export const CRYPTOGRAM_QUOTES = quotesJson as CryptogramQuote[]

export const CRYPTOGRAM_TIERS: Record<CryptogramTier, CryptogramQuote[]> = {
  short: CRYPTOGRAM_QUOTES.filter((quote) => quote.text.length < 60),
  medium: CRYPTOGRAM_QUOTES.filter(
    (quote) => quote.text.length >= 60 && quote.text.length < 88,
  ),
  long: CRYPTOGRAM_QUOTES.filter((quote) => quote.text.length >= 88),
}

const TIER_BY_WEEKDAY: CryptogramTier[] = [
  'short',
  'short',
  'medium',
  'medium',
  'medium',
  'long',
  'long',
]

const OFFSET_BY_WEEKDAY = [0, 1, 0, 1, 2, 0, 1]

const DAYS_IN_TIER: Record<CryptogramTier, number> = {
  short: 2,
  medium: 3,
  long: 2,
}

export function tierForWeekday(weekday: number): CryptogramTier {
  return TIER_BY_WEEKDAY[weekday]
}

export function preRevealCount(weekday: number): number {
  return Math.max(0, 3 - weekday)
}

export function quoteForPuzzle(puzzleNo: number): CryptogramPuzzle {
  if (!Number.isInteger(puzzleNo) || puzzleNo < 0) {
    throw new Error('Puzzle number must be a non-negative integer')
  }

  const weekday = puzzleWeekday('cryptogram', puzzleNo)
  const tier = tierForWeekday(weekday)
  const pool = CRYPTOGRAM_TIERS[tier]
  const weekIndex = Math.floor(puzzleNo / 7)
  const index =
    (weekIndex * DAYS_IN_TIER[tier] + OFFSET_BY_WEEKDAY[weekday]) % pool.length

  return {
    quote: pool[index],
    tier,
    weekday,
    weekIndex,
    preRevealedCount: preRevealCount(weekday),
  }
}
