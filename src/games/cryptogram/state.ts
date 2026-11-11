import {
  browserStorage,
  readJson,
  type StorageLike,
  storageKey,
  writeJson,
} from '@/core/storage'

export const MAX_HINTS = 3

export type CryptogramState = {
  puzzleNo: number
  mapping: Record<string, string>
  revealed: string[]
  hintsUsed: number
}

export type CryptogramStats = {
  solved: number
  currentStreak: number
  maxStreak: number
  bestHints: number | null
  perfect: number
  lastPlayedPuzzleNo: number | null
}

export function createInitialState(
  puzzleNo: number,
  initialMapping: Record<string, string>,
): CryptogramState {
  return {
    puzzleNo,
    mapping: { ...initialMapping },
    revealed: Object.keys(initialMapping).sort(),
    hintsUsed: 0,
  }
}

export function createInitialStats(): CryptogramStats {
  return {
    solved: 0,
    currentStreak: 0,
    maxStreak: 0,
    bestHints: null,
    perfect: 0,
    lastPlayedPuzzleNo: null,
  }
}

export function setMapping(
  state: CryptogramState,
  cipherLetter: string,
  plainLetter: string,
): CryptogramState {
  if (state.revealed.includes(cipherLetter)) return state

  const mapping = { ...state.mapping }
  if (plainLetter) {
    if (mapping[cipherLetter] === plainLetter) return state
    mapping[cipherLetter] = plainLetter
  } else {
    if (!(cipherLetter in mapping)) return state
    delete mapping[cipherLetter]
  }

  return { ...state, mapping }
}

export function applyHint(
  state: CryptogramState,
  cipherLetter: string,
  plainLetter: string,
): CryptogramState {
  if (state.hintsUsed >= MAX_HINTS) return state
  if (state.revealed.includes(cipherLetter)) return state

  return {
    ...state,
    mapping: { ...state.mapping, [cipherLetter]: plainLetter },
    revealed: [...state.revealed, cipherLetter].sort(),
    hintsUsed: state.hintsUsed + 1,
  }
}

export function applyRevealed(
  state: CryptogramState,
  cipherToPlain: Record<string, string>,
): CryptogramState {
  const mapping = { ...state.mapping }
  for (const letter of state.revealed) {
    const plainLetter = cipherToPlain[letter]
    if (plainLetter) mapping[letter] = plainLetter
  }
  return { ...state, mapping }
}

export function recordResult(
  stats: CryptogramStats,
  puzzleNo: number,
  hintsUsed: number,
): CryptogramStats {
  if (stats.lastPlayedPuzzleNo === puzzleNo) return stats

  const continues = stats.lastPlayedPuzzleNo === puzzleNo - 1
  const currentStreak = continues ? stats.currentStreak + 1 : 1

  return {
    solved: stats.solved + 1,
    currentStreak,
    maxStreak: Math.max(stats.maxStreak, currentStreak),
    bestHints:
      stats.bestHints === null
        ? hintsUsed
        : Math.min(stats.bestHints, hintsUsed),
    perfect: stats.perfect + (hintsUsed === 0 ? 1 : 0),
    lastPlayedPuzzleNo: puzzleNo,
  }
}

function isMapping(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  return Object.entries(value).every(
    ([key, plainLetter]) =>
      /^[A-Z]$/.test(key) &&
      typeof plainLetter === 'string' &&
      /^[A-Z]$/.test(plainLetter),
  )
}

function isCryptogramState(
  value: unknown,
  puzzleNo: number,
): value is CryptogramState {
  if (typeof value !== 'object' || value === null) return false
  const state = value as Partial<CryptogramState>

  if (state.puzzleNo !== puzzleNo || !isMapping(state.mapping)) return false
  if (!Array.isArray(state.revealed)) return false

  const revealed = state.revealed
  const unique = new Set(revealed)

  return (
    revealed.length === unique.size &&
    revealed.every(
      (letter) => typeof letter === 'string' && /^[A-Z]$/.test(letter),
    ) &&
    revealed.every((letter) => typeof state.mapping?.[letter] === 'string') &&
    Number.isInteger(state.hintsUsed) &&
    (state.hintsUsed ?? -1) >= 0 &&
    (state.hintsUsed ?? MAX_HINTS + 1) <= MAX_HINTS
  )
}

function isCryptogramStats(value: unknown): value is CryptogramStats {
  if (typeof value !== 'object' || value === null) return false
  const stats = value as Partial<CryptogramStats>

  return (
    Number.isInteger(stats.solved) &&
    Number.isInteger(stats.currentStreak) &&
    Number.isInteger(stats.maxStreak) &&
    (stats.bestHints === null || Number.isInteger(stats.bestHints)) &&
    Number.isInteger(stats.perfect) &&
    (stats.lastPlayedPuzzleNo === null ||
      Number.isInteger(stats.lastPlayedPuzzleNo))
  )
}

export function loadState(
  puzzleNo: number,
  storage: StorageLike | null = browserStorage(),
): CryptogramState | null {
  const raw = readJson<unknown>(storage, storageKey('cryptogram', 'state'))
  return isCryptogramState(raw, puzzleNo) ? raw : null
}

export function saveState(
  state: CryptogramState,
  storage: StorageLike | null = browserStorage(),
): boolean {
  return writeJson(storage, storageKey('cryptogram', 'state'), state)
}

export function loadStats(
  storage: StorageLike | null = browserStorage(),
): CryptogramStats {
  const raw = readJson<unknown>(storage, storageKey('cryptogram', 'stats'))
  return isCryptogramStats(raw) ? raw : createInitialStats()
}

export function saveStats(
  stats: CryptogramStats,
  storage: StorageLike | null = browserStorage(),
): boolean {
  return writeJson(storage, storageKey('cryptogram', 'stats'), stats)
}
