'use client'

import { format } from 'date-fns'
import { Calendar, Clock, Coins, Trophy } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatAddress } from '@/lib/dummy-data'
import type { Bet } from '@/lib/types'

import { BetStatusBadge } from './bet-status-badge'
import { UserAvatar } from './user-avatar'

interface BetDetailDialogProps {
  bet: Bet | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BetDetailDialog({
  bet,
  open,
  onOpenChange,
}: BetDetailDialogProps) {
  if (!bet) return null

  const canAccept = bet.status === 'open'
  const isCompleted = bet.status === 'completed'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl">Bet Details</DialogTitle>
            <BetStatusBadge status={bet.status} />
          </div>
          <DialogDescription>ID: {bet.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-muted-foreground mb-2 text-sm font-medium">
              Description
            </h3>
            <p className="text-pretty text-base">{bet.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Coins className="h-4 w-4" />
                <span>Bet Amount</span>
              </div>
              <p className="text-primary text-2xl font-bold">
                {bet.amount} ETH
              </p>
            </div>

            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                <span>Expires</span>
              </div>
              <p className="text-lg font-semibold">
                {format(bet.expiresAt, 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          <div className="border-border bg-muted/30 space-y-3 rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar address={bet.creator} size="md" />
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Creator</p>
                  <p className="font-mono text-sm font-medium">
                    {formatAddress(bet.creator)}
                  </p>
                </div>
              </div>
              {isCompleted && bet.winner === bet.creator && (
                <Trophy className="text-success h-5 w-5" />
              )}
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {bet.acceptedBy ? (
                  <UserAvatar address={bet.acceptedBy} size="md" />
                ) : (
                  <div className="border-muted-foreground/30 flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed">
                    <span className="text-muted-foreground text-xs">?</span>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-muted-foreground text-sm">Counterparty</p>
                  <p className="font-mono text-sm font-medium">
                    {bet.acceptedBy
                      ? formatAddress(bet.acceptedBy)
                      : bet.counterparty
                        ? formatAddress(bet.counterparty)
                        : 'Open to anyone'}
                  </p>
                </div>
              </div>
              {isCompleted && bet.winner === bet.acceptedBy && (
                <Trophy className="text-success h-5 w-5" />
              )}
            </div>
          </div>

          {bet.acceptedAt && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>Accepted on {format(bet.acceptedAt, 'MMM dd, yyyy')}</span>
            </div>
          )}

          {isCompleted && bet.winner && (
            <div className="border-success/30 bg-success/10 rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Trophy className="text-success h-5 w-5" />
                <UserAvatar address={bet.winner} size="sm" />
                <div>
                  <p className="text-success font-semibold">Winner</p>
                  <p className="text-success font-mono text-sm">
                    {formatAddress(bet.winner)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {canAccept && (
            <div className="flex gap-3 pt-4">
              <Button className="flex-1" size="lg">
                Accept Bet
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
