import { describe, expect, it } from 'vitest'
import {
  answerForPuzzle,
  WORDLE_ANSWERS,
  WORDLE_GUESS_SET,
  WORDLE_GUESSES,
} from '@/games/wordle/data'

describe('Wordle data', () => {
  it('keeps the expected answer and guess counts', () => {
    expect(WORDLE_ANSWERS).toHaveLength(3416)
    expect(WORDLE_GUESSES).toHaveLength(10938)
    expect(WORDLE_GUESS_SET.size).toBe(10938)
  })

  it('includes every answer in the guess dictionary', () => {
    for (const answer of WORDLE_ANSWERS) {
      expect(WORDLE_GUESS_SET.has(answer)).toBe(true)
    }
  })

  it('selects answers by puzzle number with wraparound', () => {
    expect(answerForPuzzle(0)).toBe(WORDLE_ANSWERS[0])
    expect(answerForPuzzle(WORDLE_ANSWERS.length)).toBe(WORDLE_ANSWERS[0])
    expect(() => answerForPuzzle(-1)).toThrow()
  })
})
