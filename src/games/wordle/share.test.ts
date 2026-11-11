import { describe, expect, it } from 'vitest'
import { buildWordleShare } from '@/games/wordle/share'

describe('Wordle share text', () => {
  it('builds an emoji grid for a win', () => {
    const text = buildWordleShare({
      puzzleNo: 12,
      guesses: ['crane', 'crate'],
      answer: 'crate',
      status: 'won',
    })
    expect(text).toBe('Wordle #12 2/6\n\n🟩🟩🟩⬛🟩\n🟩🟩🟩🟩🟩')
  })

  it('uses X/6 after a loss and never leaks the answer', () => {
    const text = buildWordleShare({
      puzzleNo: 3,
      guesses: ['crane', 'slate', 'adieu', 'audio', 'roate', 'raise'],
      answer: 'abbey',
      status: 'lost',
    })
    expect(text).toContain('Wordle #3 X/6')
    expect(text).not.toContain('abbey')
  })
})
