import { scoreGuess } from '@/games/wordle/logic'
import type { WordleStatus } from '@/games/wordle/state'

const EMOJI = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛',
} as const

export type WordleShareInput = {
  puzzleNo: number
  guesses: readonly string[]
  answer: string
  status: WordleStatus
}

export function buildWordleShare({
  puzzleNo,
  guesses,
  answer,
  status,
}: WordleShareInput): string {
  const score = status === 'won' ? `${guesses.length}/6` : 'X/6'
  const grid = guesses
    .map((guess) => scoreGuess(guess, answer).map((state) => EMOJI[state]).join(''))
    .join('\n')
  return `Wordle #${puzzleNo} ${score}\n\n${grid}`
}
