import { ChartColumnIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import type { WordleStats } from '@/games/wordle/state'

const DISTRIBUTION_KEYS = ['1', '2', '3', '4', '5', '6']

type StatsDialogProps = {
  stats: WordleStats
}

export function StatsDialog({ stats }: StatsDialogProps) {
  const winRate =
    stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100)
  const maxBucket = Math.max(1, ...stats.distribution)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Statistics">
          <ChartColumnIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Statistics</DialogTitle>
          <DialogDescription>Your Wordle record.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ['Played', stats.played],
            ['Win %', winRate],
            ['Current streak', stats.currentStreak],
            ['Max streak', stats.maxStreak],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xl font-semibold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Guess distribution</h3>
          {stats.distribution.map((count, index) => (
            <div
              key={DISTRIBUTION_KEYS[index]}
              className="grid grid-cols-[1rem_1fr_2rem] items-center gap-2"
            >
              <span className="text-sm text-muted-foreground">{index + 1}</span>
              <Progress
                value={(count / maxBucket) * 100}
                aria-label={`${count} wins in ${index + 1} guesses`}
              />
              <span className="text-right text-sm">{count}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
