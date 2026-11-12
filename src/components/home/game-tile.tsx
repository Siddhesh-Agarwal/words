import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { ArrowRightIcon } from 'lucide-react'
import { correctPositions } from '@/games/word-ladder/logic'

type GameTileProps = {
  variant: 'wordle' | 'word-ladder' | 'cryptogram'
  title: string
  description: string
  puzzleNo: number
  to: '/game/wordle' | '/game/word-ladder' | '/game/cryptogram'
  featured?: boolean
  className?: string
}

const CORNERS = [
  'top-[-7px] left-[-7px] border-t-2 border-l-2',
  'top-[-7px] right-[-7px] border-t-2 border-r-2',
  'bottom-[-7px] left-[-7px] border-b-2 border-l-2',
  'bottom-[-7px] right-[-7px] border-b-2 border-r-2',
]

const WORDLE_TILES: {
  id: string
  letter: string
  state: 'correct' | 'present' | 'empty'
}[] = [
  { id: 's', letter: 'S', state: 'correct' },
  { id: 'h', letter: 'H', state: 'present' },
  { id: 'e1', letter: 'E', state: 'empty' },
  { id: 'e2', letter: 'E', state: 'empty' },
  { id: 't', letter: 'T', state: 'empty' },
]

const WORDLE_TILE_CLASSES = {
  correct: 'border-primary bg-primary text-primary-foreground',
  present: 'border-accent bg-accent text-accent-foreground',
  empty: 'border-border bg-background text-foreground',
} as const

const LADDER_ROWS = [
  { id: 'cold', word: 'COLD' },
  { id: 'cord', word: 'CORD' },
  { id: 'card', word: 'CARD' },
]

const LADDER_TARGET = 'CARD'
const TILE_KEYS = ['tile-0', 'tile-1', 'tile-2', 'tile-3']

const CRYPTO_PAIRS: { cipher: string; plain: string | null }[] = [
  { cipher: 'X', plain: 'D' },
  { cipher: 'Q', plain: 'A' },
  { cipher: 'M', plain: null },
  { cipher: 'Z', plain: 'L' },
  { cipher: 'B', plain: 'Y' },
  { cipher: 'K', plain: 'E' },
  { cipher: 'V', plain: 'R' },
  { cipher: 'H', plain: 'N' },
]

function WordleMotif({ featured }: { featured: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid w-full grid-cols-5 gap-1.5',
        featured ? 'max-w-72' : 'max-w-56',
      )}
    >
      {WORDLE_TILES.map((tile) => (
        <span
          key={tile.id}
          className={cn(
            'flex aspect-square items-center justify-center rounded-md border font-semibold uppercase',
            featured ? 'text-lg sm:text-xl' : 'text-sm',
            WORDLE_TILE_CLASSES[tile.state],
          )}
        >
          {tile.letter}
        </span>
      ))}
    </div>
  )
}

function LadderMotif({ featured }: { featured: boolean }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        Target {LADDER_TARGET}
      </span>
      {LADDER_ROWS.map((row) => {
        const matches = correctPositions(row.word, LADDER_TARGET)

        return (
          <div
            key={row.id}
            className={cn(
              'grid grid-cols-4 gap-1',
              featured ? 'max-w-64' : 'max-w-48',
            )}
          >
            {TILE_KEYS.map((tileKey, index) => (
              <span
                key={tileKey}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-sm border font-mono uppercase',
                  featured ? 'text-base' : 'text-xs',
                  matches[index]
                    ? 'border-correct bg-correct text-primary-foreground'
                    : 'border-border bg-background text-foreground',
                )}
              >
                {row.word[index]}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}

function CryptogramMotif({ featured }: { featured: boolean }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-1.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        Cipher / plain
      </span>
      <div className="flex flex-wrap gap-1.5">
        {CRYPTO_PAIRS.map((pair) => (
          <span
            key={pair.cipher}
            className={cn(
              'flex flex-col items-center rounded-md border bg-background px-2 py-1',
              pair.plain
                ? 'border-border'
                : 'border-dashed border-muted-foreground/50',
              featured ? 'min-w-9' : 'min-w-7',
            )}
          >
            <span className="text-[9px] leading-none text-muted-foreground">
              {pair.cipher}
            </span>
            <span
              className={cn(
                'font-mono leading-tight',
                featured ? 'text-base' : 'text-sm',
                pair.plain ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {pair.plain ?? '?'}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function GameTile({
  variant,
  title,
  description,
  puzzleNo,
  to,
  featured = false,
  className,
}: GameTileProps) {
  const ready = puzzleNo >= 0
  const shortTitle =
    variant === 'word-ladder'
      ? 'Ladder'
      : variant === 'cryptogram'
        ? 'Cryptogram'
        : 'Wordle'

  return (
    <div className={cn('group relative', className)}>
      {featured
        ? CORNERS.map((corner) => (
            <span
              key={corner}
              aria-hidden="true"
              className={`pointer-events-none absolute size-3 border-foreground ${corner}`}
            />
          ))
        : null}

      <article
        className={cn(
          'relative flex flex-col rounded-xl border-2 border-foreground bg-card text-card-foreground shadow-[4px_4px_0_hsl(var(--ink)/0.12)]',
          featured ? 'gap-4 p-5 sm:p-6' : 'h-full gap-3 p-4',
          ready
            ? 'motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:shadow-[6px_6px_0_hsl(var(--ink)/0.16)]'
            : 'opacity-70',
          'has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50',
        )}
      >
        <div
          className={cn(
            'flex flex-col',
            featured
              ? 'gap-4 sm:flex-row sm:items-center sm:justify-between'
              : 'gap-3',
          )}
        >
          <div className={cn('flex flex-col gap-1', featured && 'sm:max-w-52')}>
            <h2
              className={cn(
                'font-semibold tracking-tight',
                featured ? 'text-2xl' : 'text-lg',
              )}
            >
              {title}
            </h2>
            <p
              className={cn(
                'text-muted-foreground',
                featured ? 'text-sm' : 'text-xs',
              )}
            >
              {description}
            </p>
          </div>

          {variant === 'wordle' ? <WordleMotif featured={featured} /> : null}
          {variant === 'word-ladder' ? (
            <LadderMotif featured={featured} />
          ) : null}
          {variant === 'cryptogram' ? (
            <CryptogramMotif featured={featured} />
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {ready ? `Puzzle #${puzzleNo}` : 'Starts soon'}
          </span>

          {ready ? (
            <Link
              to={to}
              aria-label={`Play ${title}, puzzle ${puzzleNo}`}
              className="inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary after:absolute after:inset-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none"
            >
              Play {shortTitle}
              <ArrowRightIcon
                aria-hidden="true"
                className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
              />
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">Not open yet</span>
          )}
        </div>
      </article>
    </div>
  )
}
