import { describe, expect, it } from 'vitest'
import { buildLadderShare } from '@/games/word-ladder/share'

describe('Word Ladder share text', () => {
  it('reports steps and par without the path', () => {
    expect(
      buildLadderShare({ puzzleNo: 12, steps: 6, par: 5 }),
    ).toBe('Ladder #12 · 6 steps (par 5)')
  })
})
