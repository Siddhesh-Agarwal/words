import { CircleHelpIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

type HelpDialogProps = {
  hardMode: boolean
  onToggleHardMode: () => void
}

export function HelpDialog({
  hardMode,
  onToggleHardMode,
}: HelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="How to play">
          <CircleHelpIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How to play</DialogTitle>
          <DialogDescription>
            Guess the five-letter word in six tries.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
          <li>Each guess must be a five-letter word.</li>
          <li>A check means the letter is in the right spot.</li>
          <li>A dash means the letter is in the word but in another spot.</li>
          <li>An x means the letter is not in the word.</li>
        </ul>

        <p className="text-sm text-muted-foreground">
          Tap the board to type on mobile. Press Enter to submit and Backspace
          to delete.
        </p>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="hard-mode">Hard mode</Label>
            <p className="text-sm text-muted-foreground">
              Revealed hints must be used in later guesses.
            </p>
          </div>
          <Switch
            id="hard-mode"
            checked={hardMode}
            onCheckedChange={() => onToggleHardMode()}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
