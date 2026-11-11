import {
  browserStorage,
  readJson,
  storageKey,
  writeJson,
  type StorageLike,
} from '@/core/storage'

export type LadderState = {
  puzzleNo: number
  path: string[]
}

export type LadderStats = {
  solved: number
  currentStreak: number
  maxStreak: number
  bestSteps: number | null
  perfect: number
  lastPlayedPuzzleNo: number | null
}

export function createInitialState(
  puzzleNo: number,
  start: string,
): LadderState {
  return { puzzleNo, path: [start] }
}

export function createInitialStats(): LadderStats {
  return {
    solved: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestSteps: null,
    perfect: 0,
    lastPlayedPuzzleNo: null,
  }
}

export function addStep(state: LadderState, word: string): LadderState {
  return { ...state, path: [...state.path, word] }
}

export function undoStep(state: LadderState): LadderState {
  if (state.path.length <= 1) return state
  return { ...state, path: state.path.slice(0, -1) }
}

export function recordResult(
  stats: LadderStats,
  puzzleNo: number,
  steps: number,
  par: number,
): LadderStats {
  if (stats.lastPlayedPuzzleNo === puzzleNo) return stats

  const continues = stats.lastPlayedPuzzleNo === puzzleNo - 1
  const currentStreak = continues ? stats.currentStreak + 1 : 1

  return {
    solved: stats.solved + 1,
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    bestSteps:
      stats.bestSteps === null ? steps : Math.min(stats.bestSteps, steps),
    perfect: stats.perfect + (steps === par ? 1 : 0),
    lastPlayedPuzzleNo: puzzleNo,
  }
}

function isLadderState(
  value: unknown,
  puzzleNo: number,
  start: string,
): value is LadderState {
  if (typeof value !== 'object' || value === null) return false
  const state = value as Partial<LadderState>
  const wordLength = start.length

  return (
    state.puzzleNo === puzzleNo &&
    Array.isArray(state.path) &&
    state.path.length >= 1 &&
    state.path[0] === start &&
    state.path.every(
      (word) =>
        typeof word === 'string' &&
        word.length === wordLength &&
        /^[a-z]+$/.test(word),
    ) &&
    new Set(state.path).size === state.path.length
  )
}

function isLadderStats(value: unknown): value is LadderStats {
  if (typeof value !== 'object' || value === null) return false
  const stats = value as Partial<LadderStats>

  return (
    Number.isInteger(stats.solved) &&
    Number.isInteger(stats.currentStreak) &&
    Number.isInteger(stats.maxStreak) &&
    (stats.bestSteps === null || Number.isInteger(stats.bestSteps)) &&
    Number.isInteger(stats.perfect) &&
    (stats.lastPlayedPuzzleNo === null ||
      Number.isInteger(stats.lastPlayedPuzzleNo))
  )
}

export function loadState(
  puzzleNo: number,
  start: string,
  storage: StorageLike | null = browserStorage(),
): LadderState {
  const raw = readJson<unknown>(storage, storageKey('word-ladder', 'state'))
  return isLadderState(raw, puzzleNo, start)
    ? raw
    : createInitialState(puzzleNo, start)
}

export function saveState(
  state: LadderState,
  storage: StorageLike | null = browserStorage(),
): boolean {
  return writeJson(storage, storageKey('word-ladder', 'state'), state)
}

export function loadStats(
  storage: StorageLike | null = browserStorage(),
): LadderStats {
  const raw = readJson<unknown>(storage, storageKey('word-ladder', 'stats'))
  return isLadderStats(raw) ? raw : createInitialStats()
}

export function saveStats(
  stats: LadderStats,
  storage: StorageLike | null = browserStorage(),
): boolean {
  return writeJson(storage, storageKey('word-ladder', 'stats'), stats)
}
