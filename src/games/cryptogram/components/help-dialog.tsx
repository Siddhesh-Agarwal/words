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
            Each letter stands for a different letter. Decode the quote.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
          <li>Every cipher letter maps to exactly one plain letter.</li>
          <li>No letter ever stands for itself.</li>
          <li>Type a plain letter under a cipher letter to fill it in.</li>
          <li>The quote updates as you map letters.</li>
          <li>Use Hints to reveal a mapping. Three are available.</li>
          <li>Solve every used letter to finish the puzzle.</li>
        </ul>

        <p className="text-sm text-muted-foreground">
          Stuck? Letter counts under each cipher letter help with common letters
          like E and T.
        </p>
      </DialogContent>
    </Dialog>
  )
}
