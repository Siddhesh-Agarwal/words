import { describe, expect, it } from 'vitest'
import {
  correctPositions,
  isOneLetterApart,
  isSolved,
  normalizeLadderInput,
  stepsTaken,
  validateStep,
} from '@/games/word-ladder/logic'

const dictionary = new Set(['cold', 'cord', 'card', 'ward', 'warm'])

describe('Word Ladder logic', () => {
  it('normalizes input to the ladder word length', () => {
    expect(normalizeLadderInput('  Co4rd! ', 4)).toBe('cord')
    expect(normalizeLadderInput('abcdefg', 4)).toBe('abcd')
  })

  it('marks letters already in the target position', () => {
    expect(correctPositions('deed', 'mugs')).toEqual([
      false,
      false,
      false,
      false,
    ])
    expect(correctPositions('muse', 'mugs')).toEqual([true, true, false, false])
    expect(correctPositions('mugs', 'mugs')).toEqual([true, true, true, true])
    expect(correctPositions('mu', 'mugs')).toEqual([true, true, false, false])
  })

  it('detects exactly one changed letter', () => {
    expect(isOneLetterApart('cold', 'cord')).toBe(true)
    expect(isOneLetterApart('cold', 'warm')).toBe(false)
    expect(isOneLetterApart('cold', 'cold')).toBe(false)
    expect(isOneLetterApart('cold', 'colder')).toBe(false)
  })

  it('validates length, dictionary, repeats, and the one-letter rule', () => {
    const path = ['cold', 'cord']

    expect(validateStep('cor', path, dictionary, 4)).toBe('length')
    expect(validateStep('card', ['cold'], dictionary, 4)).toBe('one-letter')
    expect(validateStep('card', path, dictionary, 4)).toBeNull()
    expect(validateStep('cold', path, dictionary, 4)).toBe('repeat')
    expect(validateStep('word', path, dictionary, 4)).toBe('dictionary')
  })

  it('counts steps and detects the end word', () => {
    const path = ['cold', 'cord', 'card']
    expect(stepsTaken(path)).toBe(2)
    expect(stepsTaken(['cold'])).toBe(0)
    expect(isSolved(path, 'card')).toBe(true)
    expect(isSolved(path, 'ward')).toBe(false)
  })
})
