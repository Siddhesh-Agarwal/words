import {
  browserStorage,
  readJson,
  type StorageLike,
  storageKey,
  writeJson,
} from '@/core/storage'

export type WordleStatus = 'playing' | 'won' | 'lost'

export type WordleState = {
  puzzleNo: number
  guesses: string[]
  status: WordleStatus
  hardMode: boolean
}

export type WordleStats = {
  played: number
  wins: number
  currentStreak: number
  maxStreak: number
  distribution: number[]
  lastPlayedPuzzleNo: number | null
}

export function createInitialState(puzzleNo: number): WordleState {
  return {
    puzzleNo,
    guesses: [],
    status: 'playing',
    hardMode: false,
  }
}

export function createInitialStats(): WordleStats {
  return {
    played: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
    lastPlayedPuzzleNo: null,
  }
}

export function isTerminal(status: WordleStatus): boolean {
  return status !== 'playing'
}

export function addGuess(
  state: WordleState,
  guess: string,
  answer: string,
): WordleState {
  const guesses = [...state.guesses, guess]
  const status: WordleStatus =
    guess === answer ? 'won' : guesses.length >= 6 ? 'lost' : 'playing'
  return { ...state, guesses, status }
}

export function recordResult(
  stats: WordleStats,
  puzzleNo: number,
  won: boolean,
  guessCount: number,
): WordleStats {
  if (stats.lastPlayedPuzzleNo === puzzleNo) return stats

  const distribution = [...stats.distribution]
  if (won) {
    const bucket = Math.min(Math.max(guessCount, 1), 6) - 1
    distribution[bucket] += 1
  }

  const continues = stats.lastPlayedPuzzleNo === puzzleNo - 1
  const currentStreak = won ? (continues ? stats.currentStreak + 1 : 1) : 0

  return {
    played: stats.played + 1,
    wins: stats.wins + (won ? 1 : 0),
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    distribution,
    lastPlayedPuzzleNo: puzzleNo,
  }
}

function isWordleState(value: unknown): value is WordleState {
  if (typeof value !== 'object' || value === null) return false
  const state = value as Partial<WordleState>
  return (
    Number.isInteger(state.puzzleNo) &&
    Array.isArray(state.guesses) &&
    state.guesses.every(
      (guess) => typeof guess === 'string' && guess.length === 5,
    ) &&
    (state.status === 'playing' ||
      state.status === 'won' ||
      state.status === 'lost') &&
    typeof state.hardMode === 'boolean'
  )
}

function isWordleStats(value: unknown): value is WordleStats {
  if (typeof value !== 'object' || value === null) return false
  const stats = value as Partial<WordleStats>
  return (
    Number.isInteger(stats.played) &&
    Number.isInteger(stats.wins) &&
    Number.isInteger(stats.currentStreak) &&
    Number.isInteger(stats.maxStreak) &&
    Array.isArray(stats.distribution) &&
    stats.distribution.length === 6 &&
    stats.distribution.every(
      (count) => Number.isInteger(count) && count >= 0,
    ) &&
    (stats.lastPlayedPuzzleNo === null ||
      Number.isInteger(stats.lastPlayedPuzzleNo))
  )
}

export function loadState(
  puzzleNo: number,
  storage: StorageLike | null = browserStorage(),
): WordleState {
  const raw = readJson<unknown>(storage, storageKey('wordle', 'state'))
  if (isWordleState(raw) && raw.puzzleNo === puzzleNo) return raw
  return createInitialState(puzzleNo)
}

export function saveState(
  state: WordleState,
  storage: StorageLike | null = browserStorage(),
): boolean {
  return writeJson(storage, storageKey('wordle', 'state'), state)
}

export function loadStats(
  storage: StorageLike | null = browserStorage(),
): WordleStats {
  const raw = readJson<unknown>(storage, storageKey('wordle', 'stats'))
  return isWordleStats(raw) ? raw : createInitialStats()
}

export function saveStats(
  stats: WordleStats,
  storage: StorageLike | null = browserStorage(),
): boolean {
  return writeJson(storage, storageKey('wordle', 'stats'), stats)
}
