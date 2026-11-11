export type GameId = 'wordle' | 'word-ladder' | 'cryptogram'

// Each game has its own launch epoch; update one without shifting the others.
export const EPOCHS = {
  wordle: '2026-11-11',
  'word-ladder': '2026-11-11',
  cryptogram: '2026-11-11',
} as const satisfies Record<GameId, string>

const MS_PER_DAY = 86_400_000

function calendarDayNumber(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month, day) / MS_PER_DAY)
}

function epochDay(game: GameId): number {
  const [year, month, day] = EPOCHS[game].split('-').map(Number)
  return calendarDayNumber(year, month - 1, day)
}

export function puzzleNumberFor(game: GameId, date = new Date()): number {
  return calendarDayNumber(date.getFullYear(), date.getMonth(), date.getDate()) - epochDay(game)
}

export function todayPuzzleNumber(game: GameId): number {
  return puzzleNumberFor(game, new Date())
}

export function parsePuzzleOverride(search: string): number | null {
  const value = new URLSearchParams(search).get('puzzle')
  if (value === null || !/^\d+$/.test(value)) return null
  const puzzleNo = Number(value)
  return Number.isSafeInteger(puzzleNo) ? puzzleNo : null
}

export type PuzzleNumberOptions = {
  now?: Date
  search?: string
  allowOverride?: boolean
}

export function resolvePuzzleNumber(
  game: GameId,
  {
    now = new Date(),
    search = '',
    allowOverride = import.meta.env.DEV,
  }: PuzzleNumberOptions = {},
): number {
  if (allowOverride) {
    const override = parsePuzzleOverride(search)
    if (override !== null) return override
  }
  return puzzleNumberFor(game, now)
}
