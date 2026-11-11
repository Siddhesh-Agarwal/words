import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Button
          asChild
          variant="ghost"
          className="px-0 text-base font-semibold hover:bg-transparent"
        >
          <Link to="/">words</Link>
        </Button>
        <nav aria-label="Game navigation" className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link to="/game/wordle">Wordle</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
