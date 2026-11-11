import dictionaryJson from '@/data/ladder-dictionary.json'
import manifestJson from '@/data/ladder/manifest.json'

export type LadderPair = {
  start: string
  end: string
  par: number
}

export type LadderManifest = {
  version: number
  dictionary: string
  chunkSize: number
  chunkCount: number
  totalPairs: number
  parRange: [number, number]
  length: number
  endpointMaxSize: number
  dictionaryMaxSize: number
  seed: string
}

export const LADDER_MANIFEST = manifestJson as LadderManifest
export const LADDER_DICTIONARY = new Set(dictionaryJson as string[])
export const LADDER_WORD_LENGTH = LADDER_MANIFEST.length
export const LADDER_TOTAL_PAIRS = LADDER_MANIFEST.totalPairs

const ladderChunks = import.meta.glob<{ default: LadderPair[] }>(
  '/src/data/ladder/[0-9][0-9][0-9].json',
)

export function ladderChunkForPuzzle(puzzleNo: number): {
  chunk: number
  index: number
} {
  if (
    !Number.isInteger(puzzleNo) ||
    puzzleNo < 0 ||
    puzzleNo >= LADDER_TOTAL_PAIRS
  ) {
    throw new Error('Puzzle is outside the ladder schedule')
  }

  return {
    chunk: Math.floor(puzzleNo / LADDER_MANIFEST.chunkSize),
    index: puzzleNo % LADDER_MANIFEST.chunkSize,
  }
}

export async function loadLadderPuzzle(puzzleNo: number): Promise<LadderPair> {
  const { chunk, index } = ladderChunkForPuzzle(puzzleNo)
  const key = `/src/data/ladder/${String(chunk).padStart(3, '0')}.json`
  const loader = ladderChunks[key]

  if (!loader) {
    throw new Error(`Missing ladder chunk ${chunk}`)
  }

  const pair = (await loader()).default[index]
  if (!pair) {
    throw new Error('Puzzle is outside the ladder schedule')
  }

  return pair
}
