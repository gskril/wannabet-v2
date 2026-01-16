'use client'

import { Bell, BellOff, Check, X } from 'lucide-react'
import { useState } from 'react'

import { useMiniApp } from '@/components/sdk-provider'
import { STATUS_CONFIG, StatusPennant } from '@/components/status-pennant'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { BetStatus } from 'indexer/types'

interface WelcomeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Order of statuses to display in the welcome modal
const STATUS_ORDER: BetStatus[] = [
  BetStatus.PENDING,
  BetStatus.ACTIVE,
  BetStatus.JUDGING,
  BetStatus.CANCELLED,
  BetStatus.RESOLVED,
]

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
  const { isMiniApp, notificationsEnabled, enableNotifications } = useMiniApp()
  const [isEnabling, setIsEnabling] = useState(false)
  const [justEnabled, setJustEnabled] = useState(false)

  const handleEnableNotifications = async () => {
    setIsEnabling(true)
    const result = await enableNotifications()
    setIsEnabling(false)
    if (result.success && result.enabled) {
      setJustEnabled(true)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-wb-sand max-h-[85vh] w-[90vw] max-w-sm gap-0 overflow-hidden rounded-xl border-0 p-0 [&>button:last-child]:hidden">
        {/* Coral Header */}
        <div className="bg-wb-coral flex items-center justify-between px-4 py-3">
          <DialogTitle className="text-wb-brown text-lg font-bold">
            Info
          </DialogTitle>
          <DialogClose className="rounded-sm text-white opacity-80 transition-opacity hover:opacity-100">
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        {/* Sand Body - Scrollable */}
        <div className="bg-wb-sand text-wb-brown max-h-[calc(85vh-52px)] space-y-4 overflow-y-auto px-4 py-4">
          {/* What is WannaBet */}
          <section>
            <h3 className="mb-1 text-base font-bold">What is WannaBet?</h3>
            <p className="text-wb-taupe text-sm">
              A peer-to-peer social betting app. Make trustless wagers with
              friends using smart contract escrow.
            </p>
          </section>

          {/* The Process */}
          <section>
            <h3 className="mb-2 text-base font-bold">The Process</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="bg-wb-coral text-wb-cream flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  1
                </div>
                <p className="text-sm">
                  <span className="font-bold">Create a Bet</span>
                  <span className="text-wb-taupe">
                    {' '}
                    - Set opponent, stakes, judge, and end date.
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="bg-wb-coral text-wb-cream flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  2
                </div>
                <p className="text-sm">
                  <span className="font-bold">Opponent Accepts</span>
                  <span className="text-wb-taupe">
                    {' '}
                    - Stakes are locked in the contract.
                  </span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="bg-wb-coral text-wb-cream flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  3
                </div>
                <p className="text-sm">
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
            <h3 className="mb-2 text-base font-bold">Status Indicators</h3>
            <div className="space-y-1.5">
              {STATUS_ORDER.map((status) => {
                const config = STATUS_CONFIG[status]
                return (
                  <div key={status} className="flex items-center gap-2">
                    <StatusPennant status={status} size="sm" />
                    <p className="text-sm">
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

          {/* Notifications - only show in MiniApp context */}
          {isMiniApp && (
            <section>
              <h3 className="mb-2 text-base font-bold">Notifications</h3>
              {notificationsEnabled || justEnabled ? (
                <div className="bg-wb-cream flex items-center gap-2 rounded-lg px-3 py-2">
                  <Check className="text-wb-mint h-5 w-5" />
                  <span className="text-sm">
                    Notifications enabled! You'll be notified about bet activity.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-wb-taupe text-sm">
                    Get notified when someone challenges you, accepts your bet, or
                    when a ruling is needed.
                  </p>
                  <button
                    onClick={handleEnableNotifications}
                    disabled={isEnabling}
                    className="bg-wb-coral hover:bg-wb-coral/90 text-wb-cream flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {isEnabling ? (
                      <>Enabling...</>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        Enable Notifications
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
