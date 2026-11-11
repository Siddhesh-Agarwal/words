import { Share2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Board } from '@/games/wordle/components/board'
import { HelpDialog } from '@/games/wordle/components/help-dialog'
import { Keyboard } from '@/games/wordle/components/keyboard'
import { StatsDialog } from '@/games/wordle/components/stats-dialog'
import { isTerminal } from '@/games/wordle/state'
import { useWordleGame } from '@/games/wordle/use-wordle-game'

export function WordlePage() {
  const game = useWordleGame()

  if (!game.launchReady) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-2 px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Wordle</h1>
        <p className="text-muted-foreground">The first puzzle starts soon.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Wordle</h1>
          <p className="text-sm text-muted-foreground">
            Puzzle #{game.puzzleNo}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <HelpDialog
            hardMode={game.state.hardMode}
            onToggleHardMode={game.toggleHardMode}
          />
          <StatsDialog stats={game.stats} />
        </div>
      </header>

      <Board
        guesses={game.state.guesses}
        currentGuess={game.currentGuess}
        answer={game.answer}
      />

      <Keyboard
        states={game.keyboardStates}
        onKey={game.handleKey}
        disabled={isTerminal(game.state.status)}
      />

      <div className="flex flex-col items-center gap-2">
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
      </div>
    </div>
  )
}
