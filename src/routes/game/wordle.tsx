import { createFileRoute } from '@tanstack/react-router'
import { WordlePage } from '@/games/wordle/wordle-page'

export const Route = createFileRoute('/game/wordle')({
  component: WordlePage,
})
