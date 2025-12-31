'use client'

import { X } from 'lucide-react'

import { STATUS_CONFIG, StatusPennant } from '@/components/status-pennant'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import type { BetStatus } from '@/lib/types'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Order of statuses to display in the welcome modal
const STATUS_ORDER: BetStatus[] = ['open', 'active', 'cancelled', 'completed']

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
              {STATUS_ORDER.map((status) => {
                const config = STATUS_CONFIG[status]
                return (
                  <div key={status} className="flex items-center gap-3">
                    <StatusPennant status={status} />
                    <p>
                      <span className="font-bold">{config.label}</span>
                      <span className="text-wb-taupe">
                        {' '}
                        - {config.description}
                      </span>
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
