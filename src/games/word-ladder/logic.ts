export type LadderStepError =
  | 'length'
  | 'dictionary'
  | 'one-letter'
  | 'repeat'
  | null

export function normalizeLadderInput(
  value: string,
  wordLength: number,
): string {
  return value
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .slice(0, wordLength)
}

export function correctPositions(word: string, target: string): boolean[] {
  return Array.from(
    { length: target.length },
    (_, index) => word[index] === target[index],
  )
}

export function isOneLetterApart(left: string, right: string): boolean {
  if (left.length !== right.length) return false

  let differences = 0
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      differences += 1
      if (differences > 1) return false
    }
  }

  return differences === 1
}

export function validateStep(
  word: string,
  path: readonly string[],
  dictionary: ReadonlySet<string>,
  wordLength: number,
): LadderStepError {
  if (word.length !== wordLength || /^[a-z]+$/.test(word) === false) {
    return 'length'
  }

  if (!dictionary.has(word)) return 'dictionary'
  if (path.includes(word)) return 'repeat'

  const previous = path[path.length - 1]
  return isOneLetterApart(previous, word) ? null : 'one-letter'
}

export function stepsTaken(path: readonly string[]): number {
  return Math.max(0, path.length - 1)
}

export function isSolved(path: readonly string[], end: string): boolean {
  return path[path.length - 1] === end
}
