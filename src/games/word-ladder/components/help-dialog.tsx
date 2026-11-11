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

export function HelpDialog() {
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
            Turn the start word into the end word, one letter at a time.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
          <li>Change exactly one letter on each step.</li>
          <li>Every step must be a dictionary word.</li>
          <li>Words cannot repeat.</li>
          <li>Green means the letter is already in the right position for the end word.</li>
          <li>Reach the end word. Try to match or beat par.</li>
          <li>Use Undo to take back the last step.</li>
        </ul>

        <p className="text-sm text-muted-foreground">
          Tap the word box to type on mobile.
        </p>
      </DialogContent>
    </Dialog>
  )
}
