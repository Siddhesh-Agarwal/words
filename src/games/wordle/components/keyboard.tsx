import { Button } from '@/components/ui/button'
import type { LetterState } from '@/games/wordle/logic'

const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

function keyVariant(
  state: LetterState | undefined,
): 'default' | 'secondary' | 'ghost' | 'outline' {
  if (state === 'correct') return 'default'
  if (state === 'present') return 'secondary'
  if (state === 'absent') return 'ghost'
  return 'outline'
}

type KeyboardProps = {
  states: ReadonlyMap<string, LetterState>
  onKey: (key: string) => void
  disabled?: boolean
}

export function Keyboard({ states, onKey, disabled = false }: KeyboardProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-1.5">
      {rows.map((row, rowIndex) => (
        <div key={row} className="flex justify-center gap-1">
          {rowIndex === 2 ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 max-w-16 flex-[1.5] px-1 text-xs"
              onClick={() => onKey('Enter')}
              disabled={disabled}
            >
              Enter
            </Button>
          ) : null}

          {row.split('').map((letter) => {
            const state = states.get(letter)
            return (
              <Button
                key={letter}
                type="button"
                variant={keyVariant(state)}
                aria-label={
                  state ? `${letter}, ${state}` : `${letter}, unused`
                }
                data-state={state ?? 'unused'}
                className="h-10 max-w-10 flex-1 px-1 text-xs uppercase sm:text-sm"
                onClick={() => onKey(letter)}
                disabled={disabled}
              >
                {letter}
              </Button>
            )
          })}

          {rowIndex === 2 ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 max-w-16 flex-[1.5] px-1 text-xs"
              onClick={() => onKey('Backspace')}
              disabled={disabled}
            >
              Delete
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  )
}
