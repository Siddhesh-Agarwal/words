export const WORD_LENGTH = 5

export type LetterState = 'correct' | 'present' | 'absent'

export function scoreGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent')
  const remaining = new Map<string, number>()

  for (const letter of answer) {
    remaining.set(letter, (remaining.get(letter) ?? 0) + 1)
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = 'correct'
      remaining.set(guess[index], (remaining.get(guess[index]) ?? 0) - 1)
    }
  }

  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (result[index] === 'correct') continue
    const count = remaining.get(guess[index]) ?? 0
    if (count > 0) {
      result[index] = 'present'
      remaining.set(guess[index], count - 1)
    }
  }

  return result
}

export function normalizeGuessInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, WORD_LENGTH)
}

export function isValidGuess(
  guess: string,
  allowed: ReadonlySet<string>,
): boolean {
  return (
    guess.length === WORD_LENGTH && /^[a-z]+$/.test(guess) && allowed.has(guess)
  )
}

export function isWinning(guess: string, answer: string): boolean {
  return guess === answer
}

export function validateHardMode(
  guess: string,
  previousGuesses: readonly string[],
  answer: string,
): boolean {
  for (const previous of previousGuesses) {
    const states = scoreGuess(previous, answer)
    const requiredPositions = new Map<number, string>()
    const requiredCounts = new Map<string, number>()

    states.forEach((state, index) => {
      const letter = previous[index]
      if (state === 'correct') {
        requiredPositions.set(index, letter)
        requiredCounts.set(letter, (requiredCounts.get(letter) ?? 0) + 1)
      } else if (state === 'present') {
        requiredCounts.set(letter, (requiredCounts.get(letter) ?? 0) + 1)
      }
    })

    for (const [index, letter] of requiredPositions) {
      if (guess[index] !== letter) return false
    }

    const guessCounts = new Map<string, number>()
    for (const letter of guess) {
      guessCounts.set(letter, (guessCounts.get(letter) ?? 0) + 1)
    }

    for (const [letter, count] of requiredCounts) {
      if ((guessCounts.get(letter) ?? 0) < count) return false
    }
  }

  return true
}
