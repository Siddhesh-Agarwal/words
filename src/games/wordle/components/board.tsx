import { CheckIcon, MinusIcon, XIcon } from 'lucide-react'
import { cn } from 'cn'
import {
  scoreGuess,
  WORD_LENGTH,
  type LetterState,
} from '@/games/wordle/logic'

const ROW_KEYS = ['row-0', 'row-1', 'row-2', 'row-3', 'row-4', 'row-5']
const COLUMN_KEYS = ['col-0', 'col-1', 'col-2', 'col-3', 'col-4']

type TileState = LetterState | 'active' | 'empty'

const tileClasses: Record<TileState, string> = {
  correct: 'border-primary bg-primary text-primary-foreground',
  present: 'border-accent bg-accent text-accent-foreground',
  absent: 'border-muted bg-muted text-muted-foreground',
  active: 'border-foreground bg-background text-foreground',
  empty: 'border-border bg-background text-foreground',
}

const stateLabels: Record<TileState, string> = {
  correct: 'correct',
  present: 'present in another position',
  absent: 'not in the word',
  active: 'current',
  empty: 'empty',
}

type BoardProps = {
  guesses: readonly string[]
  currentGuess: string
  answer: string
}

function Tile({ letter, state }: { letter: string; state: TileState }) {
  const Icon =
    state === 'correct'
      ? CheckIcon
      : state === 'present'
        ? MinusIcon
        : state === 'absent'
          ? XIcon
          : null

  return (
    <div
      data-state={state}
      className={cn(
        'relative flex aspect-square w-full items-center justify-center rounded-md border text-lg font-semibold uppercase',
        tileClasses[state],
      )}
    >
      {letter}
      <span className="sr-only">{stateLabels[state]}</span>
      {Icon ? (
        <Icon
          aria-hidden="true"
          className="absolute right-1 bottom-1 size-2.5 opacity-70"
        />
      ) : null}
    </div>
  )
}

export function Board({ guesses, currentGuess, answer }: BoardProps) {
  return (
    <table className="mx-auto w-full max-w-sm table-fixed border-separate border-spacing-1.5">
      <caption className="sr-only">Wordle board</caption>
      <tbody>
        {ROW_KEYS.map((rowKey, rowIndex) => {
          const guess = guesses[rowIndex]
          const tiles: Array<{ letter: string; state: TileState }> = []

          if (guess) {
            const result = scoreGuess(guess, answer)
            for (let index = 0; index < WORD_LENGTH; index += 1) {
              tiles.push({ letter: guess[index], state: result[index] })
            }
          } else if (rowIndex === guesses.length) {
            for (let index = 0; index < WORD_LENGTH; index += 1) {
              const letter = currentGuess[index] ?? ''
              tiles.push({
                letter,
                state:
                  letter || index === currentGuess.length ? 'active' : 'empty',
              })
            }
          } else {
            for (let index = 0; index < WORD_LENGTH; index += 1) {
              tiles.push({ letter: '', state: 'empty' })
            }
          }

          return (
            <tr key={rowKey}>
              {tiles.map((tile, index) => (
                <td key={COLUMN_KEYS[index]} className="p-0 align-middle">
                  <Tile letter={tile.letter} state={tile.state} />
                </td>
              ))}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
