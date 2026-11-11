import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { todayPuzzleNumber } from '@/core/date'

export const Route = createFileRoute('/')({ component: Home })

type HomeGame = {
  id: string
  title: string
  description: string
  available: boolean
  to: '/game/wordle' | '/game/word-ladder' | '/game/cryptogram'
}

const games: HomeGame[] = [
  {
    id: 'wordle',
    title: 'Wordle',
    description: 'Guess the five-letter word in six tries.',
    available: true,
    to: '/game/wordle',
  },
  {
    id: 'word-ladder',
    title: 'Word Ladder',
    description: 'Change one letter at a time to reach the target word.',
    available: false,
    to: '/game/word-ladder',
  },
  {
    id: 'cryptogram',
    title: 'Cryptogram',
    description: 'Decode a substitution cipher quote, proverb, or tech quote.',
    available: false,
    to: '/game/cryptogram',
  },
]

function Home() {
  const [wordlePuzzleNo] = useState(() => todayPuzzleNumber('wordle'))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Daily word puzzles
        </h1>
        <p className="text-muted-foreground">
          One puzzle a day, the same for everyone. Pick a game and play.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card key={game.id} className="flex h-full flex-col">
            <CardHeader>
              <CardTitle role="heading" aria-level={2}>
                {game.title}
              </CardTitle>
              <CardDescription>{game.description}</CardDescription>
              <CardAction>
                <Badge variant={game.available ? 'default' : 'secondary'}>
                  {game.available ? 'Playable' : 'Soon'}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">
                {game.id === 'wordle'
                  ? wordlePuzzleNo >= 0
                    ? `Puzzle #${wordlePuzzleNo}`
                    : 'Starts soon'
                  : 'This game is still in development.'}
              </p>
            </CardContent>
            <CardFooter>
              {game.available ? (
                <Button asChild className="w-full">
                  <Link to={game.to}>Play {game.title}</Link>
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  Coming soon
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
