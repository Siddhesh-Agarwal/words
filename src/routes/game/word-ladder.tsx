import { createFileRoute } from '@tanstack/react-router'
import { WordLadderPage } from '@/games/word-ladder/word-ladder-page'

export const Route = createFileRoute('/game/word-ladder')({
  component: WordLadderPage,
})
