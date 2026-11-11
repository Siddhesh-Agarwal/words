import { rngFor, shuffle } from '@/core/seed'

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']

export type Cipher = {
  plainToCipher: Record<string, string>
  cipherToPlain: Record<string, string>
}

function letterMapping(puzzleNo: number): string[] {
  const mapping = shuffle(ALPHABET, rngFor('cryptogram', puzzleNo))

  for (let index = 0; index < mapping.length; index += 1) {
    if (mapping[index] === ALPHABET[index]) {
      const next = (index + 1) % mapping.length
      ;[mapping[index], mapping[next]] = [mapping[next], mapping[index]]
    }
  }

  return mapping
}

export function buildCipher(puzzleNo: number): Cipher {
  const mapping = letterMapping(puzzleNo)
  const plainToCipher: Record<string, string> = {}
  const cipherToPlain: Record<string, string> = {}

  mapping.forEach((cipherLetter, index) => {
    const plainLetter = ALPHABET[index]
    plainToCipher[plainLetter] = cipherLetter
    cipherToPlain[cipherLetter] = plainLetter
  })

  return { plainToCipher, cipherToPlain }
}

export function encodeText(text: string, cipher: Cipher): string {
  return [...text.toUpperCase()]
    .map((letter) => cipher.plainToCipher[letter] ?? letter)
    .join('')
}

export function usedCipherLetters(text: string): string[] {
  return [...new Set([...text.toUpperCase()].filter((char) => /[A-Z]/.test(char)))].sort()
}

export function letterFrequency(text: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const letter of usedCipherLetters(text)) counts.set(letter, 0)
  for (const char of text.toUpperCase()) {
    if (counts.has(char)) counts.set(char, (counts.get(char) ?? 0) + 1)
  }
  return counts
}

export function frequencyOrder(text: string): string[] {
  const counts = letterFrequency(text)
  return usedCipherLetters(text).sort(
    (left, right) =>
      (counts.get(right) ?? 0) - (counts.get(left) ?? 0) ||
      left.localeCompare(right),
  )
}

export function buildInitialMapping(
  cipherText: string,
  cipher: Cipher,
  count: number,
): Record<string, string> {
  return Object.fromEntries(
    frequencyOrder(cipherText)
      .slice(0, count)
      .map((letter) => [letter, cipher.cipherToPlain[letter]]),
  )
}

export function nextHintLetter(
  cipherText: string,
  mapping: Readonly<Record<string, string>>,
  cipher: Cipher,
): string | null {
  return (
    frequencyOrder(cipherText).find(
      (letter) => mapping[letter] !== cipher.cipherToPlain[letter],
    ) ?? null
  )
}

export function isSolved(
  cipherText: string,
  mapping: Readonly<Record<string, string>>,
  cipher: Cipher,
): boolean {
  return usedCipherLetters(cipherText).every(
    (letter) => mapping[letter] === cipher.cipherToPlain[letter],
  )
}

export function normalizeMapping(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1)
}
