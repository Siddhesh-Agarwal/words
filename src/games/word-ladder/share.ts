export type LadderShareInput = {
  puzzleNo: number
  steps: number
  par: number
}

export function buildLadderShare({
  puzzleNo,
  steps,
  par,
}: LadderShareInput): string {
  return `Ladder #${puzzleNo} · ${steps} steps (par ${par})`
}
