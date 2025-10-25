'use client'

import Image from 'next/image'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-w-lg">
        <DrawerHeader>
          <div className="flex flex-col items-center gap-4">
            <Image
              src="/img/bettingmutt.png"
              alt="Betting Mutt"
              width={120}
              height={120}
              className="rounded-full"
            />
            <DrawerTitle className="text-center text-2xl">
              Welcome to WannaBet!
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="space-y-4 px-4 pb-6">
          <h3 className="text-lg font-semibold">How it works</h3>

          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 font-semibold text-purple-600 dark:text-purple-400">
                1
              </div>
              <div>
                <h4 className="font-semibold">Create a peer-to-peer bet</h4>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-semibold text-blue-600 dark:text-blue-400">
                2
              </div>
              <div>
                <h4 className="font-semibold">Opponent Accepts</h4>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-green-500/10 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 font-semibold text-green-600 dark:text-green-400">
                3
              </div>
              <div>
                <h4 className="font-semibold">Judge Settles</h4>
              </div>
            </div>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="h-12 w-full text-base font-semibold"
            size="lg"
          >
            Let&apos;s Go! 🎲
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
