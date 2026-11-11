import { useEffect, useRef } from 'react'
import { ArrowRightIcon, Share2Icon, Undo2Icon } from 'lucide-react'
import { GameCard } from '@/components/game-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { HelpDialog } from '@/games/word-ladder/components/help-dialog'
import { StatsDialog } from '@/games/word-ladder/components/stats-dialog'
import { useLadderGame } from '@/games/word-ladder/use-ladder-game'

function WordBox({ label, word }: { label: string; word: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="truncate rounded-md border bg-background px-3 py-2 text-center font-mono text-lg uppercase">
        {word}
      </span>
    </div>
  )
}

export function WordLadderPage() {
  const game = useLadderGame()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (game.solved) inputRef.current?.blur()
  }, [game.solved])

  if (game.exhausted) {
    return (
      <GameCard>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            Word Ladder
          </CardTitle>
          <CardDescription>
            The ladder schedule is complete.
          </CardDescription>
        </CardHeader>
      </GameCard>
    )
  }

  if (!game.launchReady) {
    return (
      <GameCard>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            Word Ladder
          </CardTitle>
          <CardDescription>The first ladder starts soon.</CardDescription>
        </CardHeader>
      </GameCard>
    )
  }

  if (game.error) {
    return (
      <GameCard>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            Word Ladder
          </CardTitle>
          <CardDescription>{game.error}</CardDescription>
        </CardHeader>
      </GameCard>
    )
  }

  if (game.loading || !game.pair || !game.state) {
    return (
      <GameCard>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            Word Ladder
          </CardTitle>
          <CardDescription>Loading today’s ladder…</CardDescription>
        </CardHeader>
      </GameCard>
    )
  }

  const pair = game.pair
  const state = game.state
  const steps = state.path.slice(1)
  const wordLength = pair.start.length

  return (
    <GameCard>
      <CardHeader>
        <CardTitle role="heading" aria-level={1}>
          Word Ladder
        </CardTitle>
        <CardDescription className="font-mono text-[11px] uppercase tracking-[0.2em]">
          Puzzle #{game.puzzleNo}
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-1">
            <HelpDialog />
            <StatsDialog stats={game.stats} />
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <WordBox label="Start" word={pair.start} />
          <ArrowRightIcon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          <WordBox label="End" word={pair.end} />
        </div>

        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary">Par {pair.par}</Badge>
          {game.solved ? <Badge>Solved</Badge> : null}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Steps</h2>
            <span className="text-xs text-muted-foreground">
              {game.steps} taken
            </span>
          </div>

          {steps.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No steps yet.
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5" aria-label="Ladder steps">
              {steps.map((word, index) => (
                <li
                  key={word}
                  className="grid grid-cols-[2rem_1fr] items-center gap-2"
                >
                  <span className="text-right text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="rounded-md border bg-background px-3 py-2 font-mono text-base uppercase">
                    {word}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              value={game.currentWord}
              onChange={(event) => game.handleInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  game.submit()
                } else if (
                  event.key.length === 1 &&
                  !/[a-zA-Z]/.test(event.key)
                ) {
                  event.preventDefault()
                }
              }}
              maxLength={wordLength}
              inputMode="text"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-label="Next ladder word"
              placeholder={`${wordLength} letters`}
              className="h-11 font-mono text-lg uppercase tracking-widest"
              disabled={game.solved}
            />
            <Button
              type="button"
              className="h-11"
              onClick={game.submit}
              disabled={game.solved}
            >
              Add step
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={game.undo}
            disabled={game.solved || state.path.length <= 1}
          >
            <Undo2Icon data-icon="inline-start" />
            Undo
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-center gap-2">
        <Button
          type="button"
          onClick={() => void game.share()}
          disabled={!game.solved || game.sharePending}
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
    </GameCard>
  )
}
