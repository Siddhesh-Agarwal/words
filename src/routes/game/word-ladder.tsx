import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/game/word-ladder')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/game/word-ladder"!</div>
}
