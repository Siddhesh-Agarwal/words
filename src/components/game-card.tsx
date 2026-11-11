import type { ReactNode } from 'react'
import { Card } from '@/components/ui/card'

const CORNERS = [
  'top-[-7px] left-[-7px] border-t-2 border-l-2',
  'top-[-7px] right-[-7px] border-t-2 border-r-2',
  'bottom-[-7px] left-[-7px] border-b-2 border-l-2',
  'bottom-[-7px] right-[-7px] border-b-2 border-r-2',
]

export function GameCard({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <div className="relative">
        {CORNERS.map((className) => (
          <span
            key={className}
            aria-hidden="true"
            className={`pointer-events-none absolute size-3 border-foreground ${className}`}
          />
        ))}
        <Card className="border-2 border-foreground bg-card ring-0 shadow-[6px_6px_0_hsl(var(--ink)/0.15)] [--card-spacing:1.5rem]">
          {children}
        </Card>
      </div>
    </div>
  )
}
