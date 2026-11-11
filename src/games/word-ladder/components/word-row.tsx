import { cn } from 'cn'
import { correctPositions } from '@/games/word-ladder/logic'

const TILE_KEYS = ['tile-0', 'tile-1', 'tile-2', 'tile-3']

type WordRowProps = {
  label: string
  word: string
  target: string
  kind: 'target' | 'path' | 'current'
}

export function WordRow({ label, word, target, kind }: WordRowProps) {
  const matches = correctPositions(word, target)

  return (
    <div className="grid grid-cols-[3rem_1fr] items-center gap-2">
      <span className="text-right text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="grid grid-cols-4 gap-1.5">
        {TILE_KEYS.map((tileKey, index) => {
          const letter = word[index] ?? ''
          const isCorrect = kind !== 'target' && matches[index]

          return (
            <span
              key={tileKey}
              className={cn(
                'flex aspect-square items-center justify-center rounded-md border font-mono text-lg uppercase',
                kind === 'target'
                  ? 'border-foreground bg-secondary text-secondary-foreground'
                  : isCorrect
                    ? 'border-correct bg-correct text-primary-foreground'
                    : 'border-border bg-background text-foreground',
              )}
            >
              {letter}
              <span className="sr-only">
                {letter ? (isCorrect ? ', correct position' : '') : ', empty'}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
