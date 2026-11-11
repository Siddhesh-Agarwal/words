import { describe, expect, it } from 'vitest'
import {
  buildCipher,
  buildInitialMapping,
  encodeText,
  frequencyOrder,
  isSolved,
  letterFrequency,
  nextHintLetter,
  normalizeMapping,
  usedCipherLetters,
} from '@/games/cryptogram/cipher'

describe('Cryptogram cipher', () => {
  it('is deterministic and has no fixed points', () => {
    for (let puzzleNo = 0; puzzleNo < 30; puzzleNo += 1) {
      const first = buildCipher(puzzleNo)
      const second = buildCipher(puzzleNo)
      expect(first).toEqual(second)

      for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
        expect(first.plainToCipher[letter]).not.toBe(letter)
      }
    }
  })

  it('round-trips letters and preserves punctuation and spacing', () => {
    const cipher = buildCipher(4)
    const plain = 'A SHORT QUOTE — WITH PUNCTUATION!'
    const encoded = encodeText(plain, cipher)

    expect(encoded).toHaveLength(plain.length)
    expect(encoded).toContain(' — ')
    expect(encoded.endsWith('!')).toBe(true)

    const decoded = [...encoded]
      .map((char) => cipher.cipherToPlain[char] ?? char)
      .join('')
    expect(decoded).toBe(plain)
  })

  it('finds used letters, frequencies, and hint order', () => {
    expect(usedCipherLetters('AB A!')).toEqual(['A', 'B'])
    expect([...letterFrequency('AB A!')]).toEqual([
      ['A', 2],
      ['B', 1],
    ])
    expect(frequencyOrder('AB A!')).toEqual(['A', 'B'])
  })

  it('builds revealed mappings and finds the next hint', () => {
    const cipher = buildCipher(1)
    const text = encodeText('THE QUICK BROWN FOX', cipher)
    const initial = buildInitialMapping(text, cipher, 2)

    expect(Object.keys(initial)).toHaveLength(2)
    for (const [letter, plain] of Object.entries(initial)) {
      expect(cipher.cipherToPlain[letter]).toBe(plain)
    }

    const hint = nextHintLetter(text, initial, cipher)
    expect(hint).not.toBeNull()
    expect(initial[hint ?? '']).toBeUndefined()
  })

  it('detects a completed mapping', () => {
    const cipher = buildCipher(2)
    const text = encodeText('A COMPLETE MAPPING', cipher)
    const full = Object.fromEntries(
      usedCipherLetters(text).map((letter) => [
        letter,
        cipher.cipherToPlain[letter],
      ]),
    )

    expect(isSolved(text, full, cipher)).toBe(true)
    expect(isSolved(text, {}, cipher)).toBe(false)
  })

  it('normalizes a single mapping letter', () => {
    expect(normalizeMapping(' q ')).toBe('Q')
    expect(normalizeMapping('4')).toBe('')
    expect(normalizeMapping('abc')).toBe('A')
  })
})
