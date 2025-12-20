'use client'

import { X } from 'lucide-react'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PENNANT_CLIP = 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)'

type StatusItem = {
  bg: string
  emoji: string
  label: string
  desc: string
  emojiSize?: string
}

const STATUS_ITEMS: StatusItem[] = [
  {
    bg: 'bg-wb-yellow',
    emoji: '⏳',
    label: 'Pending',
    desc: 'Waiting for opponent to accept',
  },
  { bg: 'bg-wb-mint', emoji: '🤝', label: 'Live', desc: 'Bet is active' },
  {
    bg: 'bg-wb-pink',
    emoji: '❌',
    label: 'Not Live',
    desc: 'Bet was canceled or expired',
    emojiSize: 'text-xl',
  },
  {
    bg: 'bg-wb-gold',
    emoji: '🏆',
    label: 'Resolved',
    desc: 'Winner was decided',
  },
]

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-wb-sand max-w-md gap-0 overflow-hidden rounded-xl border-0 p-0 [&>button:last-child]:hidden">
        {/* Coral Header */}
        <div className="bg-wb-coral flex items-center justify-between px-6 py-4">
          <DialogTitle className="text-wb-brown text-2xl font-bold">
            How WannaBet Works
          </DialogTitle>
          <DialogClose className="rounded-sm text-white opacity-80 transition-opacity hover:opacity-100">
            <X className="h-7 w-7" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Sand Body */}
        <div className="bg-wb-sand text-wb-brown space-y-5 px-6 py-5">
          {/* What is WannaBet */}
          <section>
            <h3 className="mb-1 text-xl font-bold">What is WannaBet?</h3>
            <p className="text-wb-taupe">
              A peer-to-peer social betting app. Make trustless wagers with
              friends using smart contract escrow.
            </p>
          </section>

          {/* The Process */}
          <section>
            <h3 className="mb-3 text-xl font-bold">The Process</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-wb-coral text-wb-cream flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  1
                </div>
                <p>
                  <span className="font-bold">Create a Bet</span>
                  <span className="text-wb-taupe">
                    {' '}
                    - Set opponent, stakes, judge, and end date.
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-wb-coral text-wb-cream flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  2
                </div>
                <p>
                  <span className="font-bold">Opponent Accepts</span>
                  <span className="text-wb-taupe">
                    {' '}
                    - Stakes are locked in the contract.
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-wb-coral text-wb-cream flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                  3
                </div>
                <p>
                  <span className="font-bold">Judge Settles</span>
                  <span className="text-wb-taupe">
                    {' '}
                    - Determines winner who gets paid.
                  </span>
                </p>
              </div>
            </div>
          </section>

          {/* Status Indicators */}
          <section>
            <h3 className="mb-3 text-xl font-bold">Status Indicators</h3>
            <div className="space-y-2">
              {STATUS_ITEMS.map(({ bg, emoji, label, desc, emojiSize }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className={`${bg} flex h-10 w-8 items-center justify-center pb-2`}
                    style={{ clipPath: PENNANT_CLIP }}
                  >
                    <span className={emojiSize ?? 'text-2xl'}>{emoji}</span>
                  </div>
                  <p>
                    <span className="font-bold">{label}</span>
                    <span className="text-wb-taupe"> - {desc}</span>
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
