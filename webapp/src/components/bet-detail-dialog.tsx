'use client'

import { format } from 'date-fns'
import { Calendar, Coins, Trophy, Users } from 'lucide-react'

import { BetStatusBadge } from '@/components/bet-status-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UserAvatar } from '@/components/user-avatar'
import type { Bet } from '@/lib/types'

interface BetDetailDialogProps {
  bet: Bet
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BetDetailDialog({
  bet,
  open,
  onOpenChange,
}: BetDetailDialogProps) {
  const handleAcceptBet = () => {
    console.log('Accept bet:', bet.id)
    // TODO: Implement bet acceptance
    alert('Bet acceptance coming soon!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{bet.description}</DialogTitle>
              <DialogDescription className="mt-2">
                <BetStatusBadge status={bet.status} />
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount */}
          <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Coins className="text-primary h-5 w-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Bet Amount</p>
              <p className="text-2xl font-bold">{bet.amount} ETH</p>
            </div>
          </div>

          {/* Participants */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>Participants</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <UserAvatar user={bet.creator} size="md" />
                <div className="flex-1">
                  <p className="font-medium">{bet.creator.displayName}</p>
                  <p className="text-muted-foreground text-sm">
                    @{bet.creator.username}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">Creator</span>
              </div>

              {bet.acceptedBy ? (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <UserAvatar user={bet.acceptedBy} size="md" />
                  <div className="flex-1">
                    <p className="font-medium">{bet.acceptedBy.displayName}</p>
                    <p className="text-muted-foreground text-sm">
                      @{bet.acceptedBy.username}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Opponent
                  </span>
                </div>
              ) : (
                <div className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed p-6 text-sm">
                  {bet.counterparty
                    ? `Waiting for @${bet.counterparty.username} to accept`
                    : 'Open to anyone'}
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              <span>Timeline</span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {format(bet.createdAt, 'MMM d, yyyy')}
                </span>
              </div>
              {bet.acceptedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Accepted</span>
                  <span className="font-medium">
                    {format(bet.acceptedAt, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium">
                  {format(bet.expiresAt, 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Winner */}
          {bet.winner && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4" />
                <span>Winner</span>
              </div>

              <div className="flex items-center gap-3 rounded-lg border bg-green-500/10 p-3">
                <UserAvatar user={bet.winner} size="md" />
                <div className="flex-1">
                  <p className="font-medium">{bet.winner.displayName}</p>
                  <p className="text-muted-foreground text-sm">
                    @{bet.winner.username}
                  </p>
                </div>
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
            </div>
          )}

          {/* Actions */}
          {bet.status === 'open' && !bet.counterparty && (
            <Button onClick={handleAcceptBet} className="w-full" size="lg">
              Accept Bet ({bet.amount} ETH)
            </Button>
          )}

          {bet.status === 'active' && (
            <Button variant="outline" className="w-full" size="lg" disabled>
              View on Etherscan (Coming Soon)
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
