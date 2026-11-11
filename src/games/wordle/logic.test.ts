import { describe, expect, it } from 'vitest'
import {
  isWinning,
  isValidGuess,
  scoreGuess,
  validateHardMode,
} from '@/games/wordle/logic'

describe('Wordle scoring', () => {
  it('marks an exact answer green', () => {
    expect(scoreGuess('crane', 'crane')).toEqual([
      'correct',
      'correct',
      'correct',
      'correct',
      'correct',
    ])
  })

  it('limits yellow matches by remaining letter counts', () => {
    expect(scoreGuess('allee', 'apple')).toEqual([
      'correct',
      'present',
      'absent',
      'absent',
      'correct',
    ])
    expect(scoreGuess('eerie', 'there')).toEqual([
      'present',
      'absent',
      'present',
      'absent',
      'correct',
    ])
  })

  it('validates guesses against the dictionary', () => {
    const allowed = new Set(['crane'])
    expect(isValidGuess('crane', allowed)).toBe(true)
    expect(isValidGuess('cranes', allowed)).toBe(false)
    expect(isValidGuess('slate', allowed)).toBe(false)
  })

  it('detects a winning guess', () => {
    expect(isWinning('crane', 'crane')).toBe(true)
    expect(isWinning('crate', 'crane')).toBe(false)
  })
})

describe('hard mode', () => {
  it('keeps revealed green positions', () => {
    expect(validateHardMode('crane', ['crate'], 'crane')).toBe(true)
    expect(validateHardMode('crazy', ['crate'], 'crane')).toBe(false)
    expect(validateHardMode('crate', ['crate'], 'crane')).toBe(true)
  })

  it('reuses yellow letters', () => {
    expect(validateHardMode('cared', ['crane'], 'abbey')).toBe(true)
    expect(validateHardMode('cried', ['crane'], 'abbey')).toBe(false)
  })

  it('accepts any guess with no previous guesses', () => {
    expect(validateHardMode('slate', [], 'crane')).toBe(true)
  })
})
