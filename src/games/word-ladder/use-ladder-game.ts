import { useStore } from '@tanstack/react-store'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { resolvePuzzleNumber } from '@/core/date'
import { shareText } from '@/core/share'
import {
  LADDER_DICTIONARY,
  LADDER_TOTAL_PAIRS,
  type LadderPair,
  loadLadderPuzzle,
} from '@/games/word-ladder/data'
import {
  isSolved,
  type LadderStepError,
  normalizeLadderInput,
  stepsTaken,
  validateStep,
} from '@/games/word-ladder/logic'
import { buildLadderShare } from '@/games/word-ladder/share'
import {
  addStep,
  type LadderState,
  type LadderStats,
  loadState,
  saveState,
  undoStep,
} from '@/games/word-ladder/state'
import {
  ladderStatsStore,
  recordLadderResult,
} from '@/games/word-ladder/stats-store'

function stepMessage(
  error: Exclude<LadderStepError, null>,
  wordLength: number,
): string {
  if (error === 'length') return `Enter a ${wordLength}-letter word.`
  if (error === 'dictionary') return 'Not in the word list.'
  if (error === 'one-letter') return 'Change exactly one letter.'
  return 'You already used that word.'
}

export type LadderGame = {
  puzzleNo: number
  launchReady: boolean
  exhausted: boolean
  loading: boolean
  error: string | null
  pair: LadderPair | null
  state: LadderState | null
  stats: LadderStats
  currentWord: string
  message: string
  solved: boolean
  steps: number
  sharePending: boolean
  handleInput: (value: string) => void
  submit: () => void
  undo: () => void
  share: () => Promise<void>
}

export function useLadderGame(): LadderGame {
  const [puzzleNo] = useState(() =>
    resolvePuzzleNumber('word-ladder', {
      search: typeof window === 'undefined' ? '' : window.location.search,
    }),
  )
  const launchReady = puzzleNo >= 0 && puzzleNo < LADDER_TOTAL_PAIRS
  const exhausted = puzzleNo >= LADDER_TOTAL_PAIRS
  const [pair, setPair] = useState<LadderPair | null>(null)
  const [state, setState] = useState<LadderState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentWord, setCurrentWord] = useState('')
  const [message, setMessage] = useState('')
  const [sharePending, setSharePending] = useState(false)
  const stats = useStore(ladderStatsStore)

  useEffect(() => {
    let cancelled = false

    setPair(null)
    setState(null)
    setError(null)
    setCurrentWord('')
    setMessage('')

    if (!launchReady) {
      setLoading(false)
      return
    }

    setLoading(true)
    loadLadderPuzzle(puzzleNo)
      .then((nextPair) => {
        if (cancelled) return
        const nextState = loadState(puzzleNo, nextPair.start)
        setPair(nextPair)
        setState(nextState)
        setLoading(false)

        if (isSolved(nextState.path, nextPair.end)) {
          setMessage(
            `Solved in ${stepsTaken(nextState.path)} steps (par ${nextPair.par}).`,
          )
        }
      })
      .catch((nextError: unknown) => {
        if (cancelled) return
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Could not load this ladder.',
        )
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [launchReady, puzzleNo])

  const solved = Boolean(pair && state && isSolved(state.path, pair.end))
  const steps = state ? stepsTaken(state.path) : 0

  const handleInput = useCallback(
    (value: string) => {
      if (!pair || !state || solved) return
      setMessage('')
      setCurrentWord(normalizeLadderInput(value, pair.start.length))
    },
    [pair, solved, state],
  )

  const submit = useCallback(() => {
    if (!pair || !state || solved) return

    const validation = validateStep(
      currentWord,
      state.path,
      LADDER_DICTIONARY,
      pair.start.length,
    )

    if (validation) {
      const nextMessage = stepMessage(validation, pair.start.length)
      setMessage(nextMessage)
      toast.error(nextMessage)
      return
    }

    const next = addStep(state, currentWord)
    setState(next)
    saveState(next)
    setCurrentWord('')

    if (isSolved(next.path, pair.end)) {
      const nextSteps = stepsTaken(next.path)
      recordLadderResult(puzzleNo, nextSteps, pair.par)
      setMessage(`Solved in ${nextSteps} steps (par ${pair.par}).`)
    } else {
      setMessage('')
    }
  }, [currentWord, pair, puzzleNo, solved, state])

  const undo = useCallback(() => {
    if (!pair || !state || solved) return
    const next = undoStep(state)
    setState(next)
    saveState(next)
    setCurrentWord('')
    setMessage('')
  }, [pair, solved, state])

  const share = useCallback(async () => {
    if (!pair || !solved) return

    setSharePending(true)
    const result = await shareText(
      `Ladder #${puzzleNo}`,
      buildLadderShare({ puzzleNo, steps, par: pair.par }),
    )
    setSharePending(false)

    if (result === 'copied') toast.success('Copied to clipboard')
    if (result === 'shared') toast.success('Shared')
    if (result === 'failed') toast.error('Could not share')
  }, [pair, puzzleNo, solved, steps])

  return {
    puzzleNo,
    launchReady,
    exhausted,
    loading,
    error,
    pair,
    state,
    stats,
    currentWord,
    message,
    solved,
    steps,
    sharePending,
    handleInput,
    submit,
    undo,
    share,
  }
}
