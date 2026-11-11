import { cn } from 'cn'

type QuotePanelProps = {
  cipherText: string
  mapping: Record<string, string>
  solved: boolean
}

type WordToken = {
  start: number
  chars: { char: string; position: number }[]
}

function tokenize(text: string): WordToken[] {
  const words: WordToken[] = []
  let position = 0

  for (const word of text.split(' ')) {
    const start = position
    const chars = [...word].map((char) => {
      const token = { char, position }
      position += 1
      return token
    })
    words.push({ start, chars })
    position += 1
  }

  return words
}

function decodedText(
  cipherText: string,
  mapping: Record<string, string>,
): string {
  return [...cipherText]
    .map((char) => (/[A-Z]/.test(char) ? (mapping[char] ?? '_') : char))
    .join('')
}

export function QuotePanel({ cipherText, mapping, solved }: QuotePanelProps) {
  const words = tokenize(cipherText)

  return (
    <div className="flex flex-col gap-2">
      <p className="sr-only">
        Current decoding: {decodedText(cipherText, mapping)}
      </p>
      <div
        aria-hidden="true"
        className={cn(
          'flex flex-wrap gap-x-3 gap-y-2 rounded-md border bg-background p-4',
          solved && 'border-correct',
        )}
      >
        {words.map((word) => (
          <span key={word.start} className="inline-flex flex-wrap items-end">
            {word.chars.map(({ char, position }) => {
              const isLetter = /[A-Z]/.test(char)
              const guess = isLetter ? mapping[char] : undefined

              return (
                <span key={position} className="flex flex-col items-center">
                  <span className="text-[9px] leading-none text-muted-foreground">
                    {isLetter ? char : '\u00A0'}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-base leading-tight sm:text-lg',
                      isLetter && !guess && 'text-muted-foreground',
                    )}
                  >
                    {isLetter ? (guess ?? '·') : char}
                  </span>
                </span>
              )
            })}
          </span>
        ))}
      </div>
    </div>
  )
}
