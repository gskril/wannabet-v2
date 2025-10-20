'use client'

import Image from 'next/image'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGetStarted: () => void
}

export function WelcomeModal({
  open,
  onOpenChange,
  onGetStarted,
}: WelcomeModalProps) {
  const handleGetStarted = () => {
    onOpenChange(false)
    onGetStarted()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/img/bettingmutt.png"
              alt="Betting Mutt"
              width={120}
              height={120}
              className="rounded-full"
            />
            <DialogTitle className="text-center text-2xl">
              Welcome to WannaBet!
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">How it works</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 font-semibold text-purple-600 dark:text-purple-400">
                1
              </div>
              <div>
                <h4 className="font-semibold">Create a bet</h4>
                <p className="text-muted-foreground text-sm">
                  Set the terms, stake, and judge.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-semibold text-blue-600 dark:text-blue-400">
                2
              </div>
              <div>
                <h4 className="font-semibold">Opponent Accepts</h4>
                <p className="text-muted-foreground text-sm">
                  Opponent accepts the bet by depositing bet amount.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-green-500/10 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 font-semibold text-green-600 dark:text-green-400">
                3
              </div>
              <div>
                <h4 className="font-semibold">Judge Settles</h4>
                <p className="text-muted-foreground text-sm">
                  After the bet end date, the judge picks the winner and the
                  payouts are distributed.
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGetStarted}
            className="h-12 w-full text-base font-semibold"
            size="lg"
          >
            Let&apos;s Go! 🎲
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
