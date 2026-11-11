import { Share2Icon, Undo2Icon } from 'lucide-react'
import { useEffect, useRef } from 'react'
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
import { Separator } from '@/components/ui/separator'
import { HelpDialog } from '@/games/word-ladder/components/help-dialog'
import { StatsDialog } from '@/games/word-ladder/components/stats-dialog'
import { WordRow } from '@/games/word-ladder/components/word-row'
import { useLadderGame } from '@/games/word-ladder/use-ladder-game'

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
          <CardDescription>The ladder schedule is complete.</CardDescription>
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
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">Par {pair.par}</Badge>
          <div className="flex items-center gap-2">
            {game.solved ? <Badge>Solved</Badge> : null}
            <span className="text-xs text-muted-foreground">
              {game.steps} steps
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <WordRow
            kind="target"
            label="End"
            word={pair.end}
            target={pair.end}
          />
          <Separator />
          <ol className="flex flex-col gap-1.5" aria-label="Ladder path">
            {state.path.map((word, index) => (
              <li key={word}>
                <WordRow
                  kind="path"
                  label={index === 0 ? 'Start' : String(index)}
                  word={word}
                  target={pair.end}
                />
              </li>
            ))}
            {game.solved ? null : (
              <li>
                <WordRow
                  kind="current"
                  label="Next"
                  word={game.currentWord}
                  target={pair.end}
                />
              </li>
            )}
          </ol>
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
