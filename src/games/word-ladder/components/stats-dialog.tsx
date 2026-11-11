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
import type { LadderStats } from '@/games/word-ladder/state'

type StatsDialogProps = {
  stats: LadderStats
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
          <DialogDescription>Your ladder record.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ['Solved', stats.solved],
            ['Current streak', stats.currentStreak],
            ['Max streak', stats.maxStreak],
            ['Best steps', stats.bestSteps ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xl font-semibold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Badge variant="secondary">
            {stats.perfect} par {stats.perfect === 1 ? 'win' : 'wins'}
          </Badge>
        </div>
      </DialogContent>
    </Dialog>
  )
}
