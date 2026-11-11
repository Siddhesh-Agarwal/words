import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/game/cryptogram')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/game/cryptogram"!</div>
}
