import { ChartColumnIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { CryptogramStats } from '@/games/cryptogram/state'

type StatsDialogProps = {
  stats: CryptogramStats
}

export function StatsDialog({ stats }: StatsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Statistics">
          <ChartColumnIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Statistics</DialogTitle>
          <DialogDescription>Your cryptogram record.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ['Solved', stats.solved],
            ['Current streak', stats.currentStreak],
            ['Max streak', stats.maxStreak],
            ['Best hints', stats.bestHints ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xl font-semibold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Badge variant="secondary">
            {stats.perfect} perfect {stats.perfect === 1 ? 'solve' : 'solves'}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}
