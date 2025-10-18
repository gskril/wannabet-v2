'use client'

import { format } from 'date-fns'
import { Calendar, ChevronDown, ChevronUp, Coins, Trophy } from 'lucide-react'
import { useState } from 'react'

import { BetStatusBadge } from '@/components/bet-status-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
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
  const [timelineExpanded, setTimelineExpanded] = useState(false)

  const handleAcceptBet = () => {
    console.log('Accept bet:', bet.id)
    // TODO: Implement bet acceptance
    alert('Bet acceptance coming soon!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          {/* Status Badge - Minimal in top right */}
          <div className="absolute right-6 top-6">
            <BetStatusBadge status={bet.status} />
          </div>

          {/* Hero Bet Description */}
          <div className="px-4 py-8 text-center">
            <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {bet.description}
            </h2>
          </div>
        </DialogHeader>

        <div className="space-y-8 px-2">
          {/* Players Section with Floating Amount */}
          <div className="relative">
            {bet.acceptedBy ? (
              <div className="flex items-start justify-center gap-10">
                {/* Player 1 */}
                <div className="flex flex-col items-center gap-2">
                  <UserAvatar user={bet.maker} size="lg" clickable={false} />
                  <p className="font-semibold">{bet.maker.displayName}</p>
                </div>

                {/* VS + Amount Badge */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-muted-foreground/40 text-xl font-light">
                    vs
                  </span>
                  {/* Floating Amount Badge */}
                  <div className="bg-muted/30 flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm">
                    <Coins className="text-muted-foreground h-3 w-3" />
                    <span className="text-xs font-medium">
                      {bet.amount} USDC
                    </span>
                  </div>
                </div>

                {/* Player 2 */}
                <div className="flex flex-col items-center gap-2">
                  <UserAvatar
                    user={bet.acceptedBy}
                    size="lg"
                    clickable={false}
                  />
                  <p className="font-semibold">{bet.acceptedBy.displayName}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <UserAvatar user={bet.maker} size="lg" clickable={false} />
                  <p className="font-semibold">{bet.maker.displayName}</p>
                </div>

                {/* Amount Badge for Open Bet */}
                <div className="bg-muted/30 flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm">
                  <Coins className="text-muted-foreground h-3 w-3" />
                  <span className="text-xs font-medium">{bet.amount} USDC</span>
                </div>

                {/* Challenge Status - Minimal */}
                <p className="text-muted-foreground text-xs">
                  {bet.taker
                    ? `Waiting for @${bet.taker.username} to accept`
                    : 'Open challenge'}
                </p>
              </div>
            )}
          </div>

          {/* Winner Section - Compact */}
          {bet.winner && (
            <div className="flex items-center justify-center gap-3 rounded-xl border bg-green-500/5 px-4 py-3">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <UserAvatar user={bet.winner} size="sm" />
              <div>
                <p className="text-sm font-medium">{bet.winner.displayName}</p>
                <p className="text-muted-foreground text-xs">Winner</p>
              </div>
            </div>
          )}

          {/* Judge Section - Minimal */}
          {bet.judge && (
            <div className="flex items-center justify-center gap-2">
              <UserAvatar user={bet.judge} size="sm" />
              <p className="text-muted-foreground text-sm">
                Judge:{' '}
                <span className="text-foreground font-medium">
                  {bet.judge.displayName}
                </span>
              </p>
            </div>
          )}

          {/* Timeline - Collapsible */}
          <div className="border-t pt-6">
            <button
              onClick={() => setTimelineExpanded(!timelineExpanded)}
              className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-2 text-sm transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Timeline</span>
              {timelineExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {timelineExpanded && (
              <div className="mt-4 space-y-2 text-xs">
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
            )}
          </div>

          {/* Actions */}
          {bet.status === 'open' && !bet.taker && (
            <div className="pb-2">
              <Button onClick={handleAcceptBet} className="w-full" size="lg">
                Accept Bet ({bet.amount} USDC)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
