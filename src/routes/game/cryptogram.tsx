import { createFileRoute } from '@tanstack/react-router'
import { CryptogramPage } from '@/games/cryptogram/cryptogram-page'

export const Route = createFileRoute('/game/cryptogram')({
  component: CryptogramPage,
})
