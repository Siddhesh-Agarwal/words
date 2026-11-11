import { useEffect, useRef, type ReactNode } from 'react'
import { Share2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Board } from '@/games/wordle/components/board'
import { HelpDialog } from '@/games/wordle/components/help-dialog'
import { StatsDialog } from '@/games/wordle/components/stats-dialog'
import { WORD_LENGTH } from '@/games/wordle/logic'
import { isTerminal } from '@/games/wordle/state'
import { useWordleGame } from '@/games/wordle/use-wordle-game'

const CORNERS = [
  'top-[-7px] left-[-7px] border-t-2 border-l-2',
  'top-[-7px] right-[-7px] border-t-2 border-r-2',
  'bottom-[-7px] left-[-7px] border-b-2 border-l-2',
  'bottom-[-7px] right-[-7px] border-b-2 border-r-2',
]

function WordleCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <div className="relative">
        {CORNERS.map((className) => (
          <span
            key={className}
            aria-hidden="true"
            className={`pointer-events-none absolute size-3 border-foreground ${className}`}
          />
        ))}
        <Card className="border-2 border-foreground bg-card ring-0 shadow-[6px_6px_0_hsl(var(--ink)/0.15)] [--card-spacing:1.5rem]">
          {children}
        </Card>
      </div>
    </div>
  )
}

export function WordlePage() {
  const game = useWordleGame()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isTerminal(game.state.status)) inputRef.current?.blur()
  }, [game.state.status])

  if (!game.launchReady) {
    return (
      <WordleCard>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            Wordle
          </CardTitle>
          <CardDescription>The first puzzle starts soon.</CardDescription>
        </CardHeader>
      </WordleCard>
    )
  }

  return (
    <WordleCard>
      <CardHeader>
        <CardTitle role="heading" aria-level={1}>
          Wordle
        </CardTitle>
        <CardDescription className="font-mono text-[11px] uppercase tracking-[0.2em]">
          Puzzle #{game.puzzleNo}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-1">
            <HelpDialog
              hardMode={game.state.hardMode}
              onToggleHardMode={game.toggleHardMode}
            />
            <StatsDialog stats={game.stats} />
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="relative rounded-md focus-within:ring-2 focus-within:ring-ring">
          <input
            ref={inputRef}
            type="text"
            value={game.currentGuess}
            onChange={(event) => game.handleInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                game.handleKey('Enter')
              } else if (
                event.key.length === 1 &&
                !/[a-zA-Z]/.test(event.key)
              ) {
                event.preventDefault()
              }
            }}
            maxLength={WORD_LENGTH}
            inputMode="text"
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-label="Type your Wordle guess"
            className="absolute inset-0 z-10 size-full cursor-text opacity-0"
          />
          <Board
            guesses={game.state.guesses}
            currentGuess={game.currentGuess}
            answer={game.answer}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground sm:hidden">
          Tap the board to type.
        </p>
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2">
        <Button
          type="button"
          onClick={() => void game.share()}
          disabled={!isTerminal(game.state.status) || game.sharePending}
        >
          <Share2Icon data-icon="inline-start" />
          {game.sharePending ? 'Sharing…' : 'Share'}
        </Button>
        <p
          aria-live="polite"
          className="min-h-5 text-center text-sm text-muted-foreground"
        >
          {game.message}
        </p>
      </CardFooter>
    </WordleCard>
  )
}
