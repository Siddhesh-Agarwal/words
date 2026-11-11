import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4">
        <Button
          asChild
          variant="ghost"
          className="px-0 text-base font-semibold uppercase hover:bg-transparent"
        >
          <Link to="/">words</Link>
        </Button>
        <nav aria-label="Game navigation" className="flex items-center gap-1">
          <a
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            href="https://github.com/Siddhesh-Agarwal/words"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
