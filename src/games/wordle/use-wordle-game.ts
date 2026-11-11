import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { resolvePuzzleNumber } from '@/core/date'
import { shareText } from '@/core/share'
import { answerForPuzzle, WORDLE_GUESS_SET } from '@/games/wordle/data'
import {
  isValidGuess,
  scoreGuess,
  validateHardMode,
  WORD_LENGTH,
  type LetterState,
} from '@/games/wordle/logic'
import { buildWordleShare } from '@/games/wordle/share'
import {
  addGuess,
  isTerminal,
  loadState,
  loadStats,
  recordResult,
  saveState,
  saveStats,
  type WordleState,
  type WordleStats,
} from '@/games/wordle/state'

export type WordleGame = {
  puzzleNo: number
  launchReady: boolean
  answer: string
  state: WordleState
  stats: WordleStats
  currentGuess: string
  message: string
  keyboardStates: ReadonlyMap<string, LetterState>
  sharePending: boolean
  handleKey: (key: string) => void
  share: () => Promise<void>
  toggleHardMode: () => void
}

export function useWordleGame(): WordleGame {
  const [puzzleNo] = useState(() =>
    resolvePuzzleNumber('wordle', {
      search: typeof window === 'undefined' ? '' : window.location.search,
    }),
  )
  const launchReady = puzzleNo >= 0
  const answer = useMemo(
    () => (launchReady ? answerForPuzzle(puzzleNo) : ''),
    [launchReady, puzzleNo],
  )
  const [state, setState] = useState<WordleState>(() => loadState(puzzleNo))
  const [stats, setStats] = useState<WordleStats>(() => loadStats())
  const [currentGuess, setCurrentGuess] = useState('')
  const [message, setMessage] = useState('')
  const [sharePending, setSharePending] = useState(false)

  const handleKey = useCallback(
    (key: string) => {
      if (!launchReady || isTerminal(state.status)) return

      if (key === 'Enter') {
        if (currentGuess.length !== WORD_LENGTH) {
          setMessage('Not enough letters')
          toast.error('Not enough letters')
          return
        }
        if (!isValidGuess(currentGuess, WORDLE_GUESS_SET)) {
          setMessage('Not in word list')
          toast.error('Not in word list')
          return
        }
        if (
          state.hardMode &&
          !validateHardMode(currentGuess, state.guesses, answer)
        ) {
          setMessage('Hard mode: use the revealed hints')
          toast.error('Hard mode: use the revealed hints')
          return
        }

        const next = addGuess(state, currentGuess, answer)
        setState(next)
        saveState(next)
        setCurrentGuess('')

        if (isTerminal(next.status)) {
          const nextStats = recordResult(
            stats,
            puzzleNo,
            next.status === 'won',
            next.guesses.length,
          )
          setStats(nextStats)
          saveStats(nextStats)
          setMessage(
            next.status === 'won'
              ? 'You solved it.'
              : `The word was ${answer}.`,
          )
        } else {
          setMessage('')
        }
        return
      }

      if (key === 'Backspace') {
        setMessage('')
        setCurrentGuess((previous) => previous.slice(0, -1))
        return
      }

      if (/^[a-zA-Z]$/.test(key)) {
        setMessage('')
        setCurrentGuess((previous) =>
          previous.length < WORD_LENGTH
            ? previous + key.toLowerCase()
            : previous,
        )
      }
    },
    [answer, currentGuess, launchReady, puzzleNo, state, stats],
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('button, a, input, textarea, select, [role="dialog"]')
      ) {
        return
      }
      if (document.querySelector('[role="dialog"][data-state="open"]')) return
      if (
        event.key === 'Enter' ||
        event.key === 'Backspace' ||
        /^[a-zA-Z]$/.test(event.key)
      ) {
        event.preventDefault()
        handleKey(event.key)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  const keyboardStates = useMemo(() => {
    const states = new Map<string, LetterState>()
    const rank: Record<LetterState, number> = {
      absent: 0,
      present: 1,
      correct: 2,
    }

    for (const guess of state.guesses) {
      const result = scoreGuess(guess, answer)
      guess.split('').forEach((letter, index) => {
        const next = result[index]
        const previous = states.get(letter)
        if (!previous || rank[next] > rank[previous]) {
          states.set(letter, next)
        }
      })
    }

    return states
  }, [answer, state.guesses])

  const share = useCallback(async () => {
    if (isTerminal(state.status) === false) return

    setSharePending(true)
    const text = buildWordleShare({
      puzzleNo,
      guesses: state.guesses,
      answer,
      status: state.status,
    })
    const result = await shareText(`Wordle #${puzzleNo}`, text)
    setSharePending(false)

    if (result === 'copied') toast.success('Copied to clipboard')
    if (result === 'shared') toast.success('Shared')
    if (result === 'failed') toast.error('Could not share')
  }, [answer, puzzleNo, state])

  const toggleHardMode = useCallback(() => {
    const next = { ...state, hardMode: !state.hardMode }
    setState(next)
    saveState(next)
  }, [state])

  return {
    puzzleNo,
    launchReady,
    answer,
    state,
    stats,
    currentGuess,
    message,
    keyboardStates,
    sharePending,
    handleKey,
    share,
    toggleHardMode,
  }
}
