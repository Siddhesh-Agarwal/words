import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/game/wordle')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/game/wordle"!</div>
}
