import { LightbulbIcon, Share2Icon } from 'lucide-react'
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
import { HelpDialog } from '@/games/cryptogram/components/help-dialog'
import { MappingGrid } from '@/games/cryptogram/components/mapping-grid'
import { QuotePanel } from '@/games/cryptogram/components/quote-panel'
import { StatsDialog } from '@/games/cryptogram/components/stats-dialog'
import { useCryptogramGame } from '@/games/cryptogram/use-cryptogram-game'

const TIER_LABELS = {
  short: 'Short quote',
  medium: 'Medium quote',
  long: 'Long quote',
} as const

const CATEGORY_LABELS = {
  quote: 'Quote',
  proverb: 'Proverb',
  tech: 'Tech quote',
} as const

export function CryptogramPage() {
  const game = useCryptogramGame()

  if (!game.launchReady) {
    return (
      <GameCard>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            Cryptogram
          </CardTitle>
          <CardDescription>The first cryptogram starts soon.</CardDescription>
        </CardHeader>
      </GameCard>
    )
  }

  if (!game.puzzle || !game.state) {
    return (
      <GameCard>
        <CardHeader>
          <CardTitle role="heading" aria-level={1}>
            Cryptogram
          </CardTitle>
          <CardDescription>Loading today’s cryptogram…</CardDescription>
        </CardHeader>
      </GameCard>
    )
  }

  const puzzle = game.puzzle
  const state = game.state
  const letters = [...game.frequency.keys()].sort()

  return (
    <GameCard>
      <CardHeader>
        <CardTitle role="heading" aria-level={1}>
          Cryptogram
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
        <QuotePanel
          cipherText={game.cipherText}
          mapping={state.mapping}
          solved={game.solved}
        />

        {game.solved ? (
          <div className="rounded-md border border-correct bg-secondary p-3">
            <p className="text-sm italic">“{puzzle.quote.text}”</p>
            <p className="mt-1 text-xs text-muted-foreground">
              —{' '}
              {puzzle.quote.attribution ??
                CATEGORY_LABELS[puzzle.quote.category]}
            </p>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{TIER_LABELS[puzzle.tier]}</Badge>
            {game.solved ? <Badge>Solved</Badge> : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={game.hint}
            disabled={game.solved || game.hintsRemaining === 0}
          >
            <LightbulbIcon data-icon="inline-start" />
            Hint · {game.hintsRemaining}
          </Button>
        </div>

        <MappingGrid
          letters={letters}
          frequency={game.frequency}
          mapping={state.mapping}
          revealed={state.revealed}
          disabled={game.solved}
          onChange={game.handleMappingChange}
        />
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
