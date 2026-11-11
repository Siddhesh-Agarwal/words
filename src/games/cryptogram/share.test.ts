import { describe, expect, it } from 'vitest'
import { buildCryptogramShare } from '@/games/cryptogram/share'

describe('Cryptogram share text', () => {
  it('reports a clean solve without the quote', () => {
    expect(buildCryptogramShare({ puzzleNo: 7, hintsUsed: 0 })).toBe(
      'Cryptogram #7 · solved',
    )
  })

  it('reports hint usage with correct pluralization', () => {
    expect(buildCryptogramShare({ puzzleNo: 7, hintsUsed: 1 })).toBe(
      'Cryptogram #7 · solved · 1 hint',
    )
    expect(buildCryptogramShare({ puzzleNo: 7, hintsUsed: 3 })).toBe(
      'Cryptogram #7 · solved · 3 hints',
    )
  })
})
