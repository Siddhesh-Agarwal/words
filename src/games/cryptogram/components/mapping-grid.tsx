import { cn } from 'cn'
import { type KeyboardEvent, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { normalizeMapping } from '@/games/cryptogram/cipher'

type MappingGridProps = {
  letters: string[]
  frequency: Map<string, number>
  mapping: Record<string, string>
  revealed: string[]
  disabled: boolean
  onChange: (cipherLetter: string, value: string) => void
}

export function MappingGrid({
  letters,
  frequency,
  mapping,
  revealed,
  disabled,
  onChange,
}: MappingGridProps) {
  const inputs = useRef(new Map<string, HTMLInputElement | null>())

  function focusNext(letter: string) {
    const start = letters.indexOf(letter)

    for (let step = 1; step <= letters.length; step += 1) {
      const candidate = letters[(start + step) % letters.length]
      if (!revealed.includes(candidate) && !mapping[candidate]) {
        inputs.current.get(candidate)?.focus()
        return
      }
    }

    for (let step = 1; step <= letters.length; step += 1) {
      const candidate = letters[(start + step) % letters.length]
      if (!revealed.includes(candidate)) {
        inputs.current.get(candidate)?.focus()
        return
      }
    }
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    letter: string,
  ) {
    if (event.key === 'Backspace' && mapping[letter]) {
      event.preventDefault()
      onChange(letter, '')
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      focusNext(letter)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Letter mapping</h2>
        <span className="text-xs text-muted-foreground">
          {letters.length} letters
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-7">
        {letters.map((letter) => {
          const isRevealed = revealed.includes(letter)
          const count = frequency.get(letter) ?? 0

          return (
            <label
              key={letter}
              htmlFor={`cipher-${letter}`}
              className={cn(
                'flex flex-col items-center gap-1 rounded-md border p-1.5',
                isRevealed ? 'bg-secondary' : 'bg-background',
              )}
            >
              <span className="flex w-full items-baseline justify-between px-0.5 text-xs text-muted-foreground">
                <span className="font-mono text-sm font-semibold text-foreground">
                  {letter}
                </span>
                <span>{count}</span>
              </span>
              <Input
                id={`cipher-${letter}`}
                ref={(element) => {
                  inputs.current.set(letter, element)
                }}
                value={mapping[letter] ?? ''}
                onChange={(event) => {
                  const value = normalizeMapping(event.target.value)
                  onChange(letter, value)
                  if (value) focusNext(letter)
                }}
                onKeyDown={(event) => handleKeyDown(event, letter)}
                onFocus={(event) => event.currentTarget.select()}
                readOnly={isRevealed}
                disabled={disabled}
                maxLength={1}
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label={`Cipher letter ${letter}, appears ${count} ${
                  count === 1 ? 'time' : 'times'
                }${isRevealed ? ', revealed' : ''}`}
                className="h-9 rounded-sm px-0 text-center font-mono text-lg uppercase read-only:bg-transparent disabled:opacity-100"
              />
            </label>
          )
        })}
      </div>
    </div>
  )
}
