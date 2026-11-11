import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from '@tanstack/react-store'
import { toast } from 'sonner'
import { resolvePuzzleNumber } from '@/core/date'
import { shareText } from '@/core/share'
import {
  buildCipher,
  buildInitialMapping,
  encodeText,
  isSolved,
  letterFrequency,
  nextHintLetter,
  normalizeMapping,
} from '@/games/cryptogram/cipher'
import { quoteForPuzzle, type CryptogramPuzzle } from '@/games/cryptogram/data'
import { buildCryptogramShare } from '@/games/cryptogram/share'
import {
  MAX_HINTS,
  applyHint,
  applyRevealed,
  createInitialState,
  loadState,
  saveState,
  setMapping,
  type CryptogramState,
  type CryptogramStats,
} from '@/games/cryptogram/state'
import {
  cryptogramStatsStore,
  recordCryptogramResult,
} from '@/games/cryptogram/stats-store'

export type CryptogramGame = {
  puzzleNo: number
  launchReady: boolean
  puzzle: CryptogramPuzzle | null
  cipherText: string
  frequency: Map<string, number>
  state: CryptogramState | null
  stats: CryptogramStats
  solved: boolean
  hintsRemaining: number
  message: string
  sharePending: boolean
  handleMappingChange: (cipherLetter: string, value: string) => void
  hint: () => void
  share: () => Promise<void>
}

export function useCryptogramGame(): CryptogramGame {
  const [puzzleNo] = useState(() =>
    resolvePuzzleNumber('cryptogram', {
      search: typeof window === 'undefined' ? '' : window.location.search,
    }),
  )
  const launchReady = puzzleNo >= 0
  const [puzzle] = useState(() =>
    launchReady ? quoteForPuzzle(puzzleNo) : null,
  )
  const cipher = useMemo(
    () => (launchReady ? buildCipher(puzzleNo) : null),
    [launchReady, puzzleNo],
  )
  const cipherText = useMemo(
    () => (puzzle && cipher ? encodeText(puzzle.quote.text, cipher) : ''),
    [cipher, puzzle],
  )
  const frequency = useMemo(() => letterFrequency(cipherText), [cipherText])
  const [state, setState] = useState<CryptogramState | null>(() => {
    if (!puzzle || !cipher) return null

    const initial = createInitialState(
      puzzleNo,
      buildInitialMapping(cipherText, cipher, puzzle.preRevealedCount),
    )
    const stored = loadState(puzzleNo)
    return stored ? applyRevealed(stored, cipher.cipherToPlain) : initial
  })
  const [sharePending, setSharePending] = useState(false)
  const stats = useStore(cryptogramStatsStore)

  useEffect(() => {
    if (state) saveState(state)
  }, [state])

  const solved = Boolean(
    state && cipher && isSolved(cipherText, state.mapping, cipher),
  )
  const hintsUsed = state?.hintsUsed ?? 0

  useEffect(() => {
    if (solved) recordCryptogramResult(puzzleNo, hintsUsed)
  }, [hintsUsed, puzzleNo, solved])

  const handleMappingChange = useCallback(
    (cipherLetter: string, value: string) => {
      const plainLetter = normalizeMapping(value)
      setState((current) =>
        current ? setMapping(current, cipherLetter, plainLetter) : current,
      )
    },
    [],
  )

  const hint = useCallback(() => {
    if (!cipher || !state || solved) return
    if (state.hintsUsed >= MAX_HINTS) return

    const cipherLetter = nextHintLetter(cipherText, state.mapping, cipher)
    if (!cipherLetter) return

    const plainLetter = cipher.cipherToPlain[cipherLetter]
    setState((current) =>
      current ? applyHint(current, cipherLetter, plainLetter) : current,
    )
    toast.success(`Revealed ${cipherLetter} is ${plainLetter}`)
  }, [cipher, cipherText, solved, state])

  const share = useCallback(async () => {
    if (!solved) return

    setSharePending(true)
    const result = await shareText(
      `Cryptogram #${puzzleNo}`,
      buildCryptogramShare({ puzzleNo, hintsUsed }),
    )
    setSharePending(false)

    if (result === 'copied') toast.success('Copied to clipboard')
    if (result === 'shared') toast.success('Shared')
    if (result === 'failed') toast.error('Could not share')
  }, [hintsUsed, puzzleNo, solved])

  const message = solved
    ? hintsUsed === 0
      ? 'Solved without hints.'
      : `Solved with ${hintsUsed} ${hintsUsed === 1 ? 'hint' : 'hints'}.`
    : ''

  return {
    puzzleNo,
    launchReady,
    puzzle,
    cipherText,
    frequency,
    state,
    stats,
    solved,
    hintsRemaining: Math.max(0, MAX_HINTS - hintsUsed),
    message,
    sharePending,
    handleMappingChange,
    hint,
    share,
  }
}
