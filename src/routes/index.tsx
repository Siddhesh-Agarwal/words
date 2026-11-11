import { createFileRoute } from '@tanstack/react-router'
import { GameTile } from '@/components/home/game-tile'
import { todayPuzzleNumber } from '@/core/date'

export const Route = createFileRoute('/')({ component: Home })

const FACTS = [
  { id: 'same', text: 'Same puzzles for everyone' },
  { id: 'utc', text: 'Resets at 00:00 UTC' },
  { id: 'storage', text: 'Progress saved in your browser' },
]

function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4">
      <section className="grid gap-8 py-10 lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-14">
        <div className="flex flex-col gap-5 lg:col-span-5">
          <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <span aria-hidden="true" className="h-px w-6 bg-foreground/40" />
            Daily word puzzles
          </p>
          <h1 className="text-balance text-4xl font-semibold leading-[0.95] tracking-tighter sm:text-5xl lg:text-[3.4rem]">
            Three puzzles. One fresh sheet.
          </h1>
          <p className="max-w-[42ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Wordle, Word Ladder, and Cryptogram. The same puzzles for everyone,
            reset at 00:00 UTC.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
          <GameTile
            variant="wordle"
            title="Wordle"
            description="Five letters. Six tries."
            puzzleNo={todayPuzzleNumber('wordle')}
            to="/game/wordle"
            featured
            className="sm:col-span-2"
          />
          <GameTile
            variant="word-ladder"
            title="Word Ladder"
            description="One letter at a time."
            puzzleNo={todayPuzzleNumber('word-ladder')}
            to="/game/word-ladder"
          />
          <GameTile
            variant="cryptogram"
            title="Cryptogram"
            description="Crack the quote."
            puzzleNo={todayPuzzleNumber('cryptogram')}
            to="/game/cryptogram"
          />
        </div>
      </section>

      <section aria-label="How the daily puzzles work" className="border-t">
        <ul className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {FACTS.map((fact) => (
            <li
              key={fact.id}
              className="py-4 text-sm text-muted-foreground sm:px-5 sm:first:pl-0 sm:last:pr-0"
            >
              {fact.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
