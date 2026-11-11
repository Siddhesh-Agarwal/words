import { describe, expect, it } from 'vitest'
import { hashLabel, mulberry32, rngFor, shuffle } from '@/core/seed'

describe('seeded randomness', () => {
  it('matches the shared mulberry32 sequence', () => {
    const rng = mulberry32(12345)
    expect(Array.from({ length: 5 }, () => rng())).toEqual([
      0.9797282677609473, 0.3067522644996643, 0.484205421525985,
      0.817934412509203, 0.5094283693470061,
    ])
  })

  it('hashes labels deterministically', () => {
    expect(hashLabel('words:v1:wordle:0')).toBe(hashLabel('words:v1:wordle:0'))
    expect(hashLabel('wordle:0')).not.toBe(hashLabel('wordle:1'))
  })

  it('produces repeatable game RNGs and complete shuffles', () => {
    const first = shuffle(['a', 'b', 'c', 'd'], rngFor('wordle', 3))
    const second = shuffle(['a', 'b', 'c', 'd'], rngFor('wordle', 3))
    expect(first).toEqual(second)
    expect([...first].sort()).toEqual(['a', 'b', 'c', 'd'])
  })
})
