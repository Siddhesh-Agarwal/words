import { describe, expect, it } from 'vitest'
import {
  LADDER_DICTIONARY,
  LADDER_MANIFEST,
  LADDER_TOTAL_PAIRS,
  ladderChunkForPuzzle,
  loadLadderPuzzle,
} from '@/games/word-ladder/data'

describe('Word Ladder data', () => {
  it('loads the expected dictionary and manifest', () => {
    expect(LADDER_DICTIONARY.size).toBe(2139)
    expect(LADDER_MANIFEST.totalPairs).toBe(303316)
    expect(LADDER_MANIFEST.chunkCount).toBe(84)
    expect(LADDER_MANIFEST.length).toBe(4)
  })

  it('maps puzzle numbers to chunks', () => {
    expect(ladderChunkForPuzzle(0)).toEqual({ chunk: 0, index: 0 })
    expect(ladderChunkForPuzzle(3650)).toEqual({ chunk: 1, index: 0 })
    expect(ladderChunkForPuzzle(LADDER_TOTAL_PAIRS - 1)).toEqual({
      chunk: 83,
      index: 365,
    })
    expect(() => ladderChunkForPuzzle(-1)).toThrow()
    expect(() => ladderChunkForPuzzle(LADDER_TOTAL_PAIRS)).toThrow()
  })

  it('loads valid first and last pairs', async () => {
    for (const puzzleNo of [0, LADDER_TOTAL_PAIRS - 1]) {
      const pair = await loadLadderPuzzle(puzzleNo)
      expect(LADDER_DICTIONARY.has(pair.start)).toBe(true)
      expect(LADDER_DICTIONARY.has(pair.end)).toBe(true)
      expect(pair.start).not.toBe(pair.end)
      expect(pair.par).toBeGreaterThanOrEqual(4)
      expect(pair.par).toBeLessThanOrEqual(7)
    }

    await expect(loadLadderPuzzle(LADDER_TOTAL_PAIRS)).rejects.toThrow()
  })
})
