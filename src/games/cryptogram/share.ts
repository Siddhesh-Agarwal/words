export type CryptogramShareInput = {
  puzzleNo: number
  hintsUsed: number
}

export function buildCryptogramShare({
  puzzleNo,
  hintsUsed,
}: CryptogramShareInput): string {
  if (hintsUsed <= 0) return `Cryptogram #${puzzleNo} · solved`

  return `Cryptogram #${puzzleNo} · solved · ${hintsUsed} ${
    hintsUsed === 1 ? 'hint' : 'hints'
  }`
}
