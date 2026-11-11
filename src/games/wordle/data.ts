import answersJson from '@/data/wordle-answers.json'
import guessesJson from '@/data/wordle-guesses.json'

export const WORDLE_ANSWERS = answersJson as string[]
export const WORDLE_GUESSES = guessesJson as string[]
export const WORDLE_GUESS_SET = new Set(WORDLE_GUESSES)

export function answerForPuzzle(puzzleNo: number): string {
  if (!Number.isInteger(puzzleNo) || puzzleNo < 0) {
    throw new Error('Puzzle number must be a non-negative integer')
  }
  return WORDLE_ANSWERS[puzzleNo % WORDLE_ANSWERS.length]
}
