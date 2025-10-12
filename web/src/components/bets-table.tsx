'use client'

import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, Coins } from 'lucide-react'
import { useState } from 'react'

import { Card } from '@/components/ui/card'
import { formatAddress } from '@/lib/dummy-data'
import type { Bet } from '@/lib/types'

import { BetDetailDialog } from './bet-detail-dialog'
import { BetStatusBadge } from './bet-status-badge'
import { UserAvatar } from './user-avatar'

interface BetsTableProps {
  bets: Bet[]
}

export function BetsTable({ bets }: BetsTableProps) {
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleBetClick = (bet: Bet) => {
    setSelectedBet(bet)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="space-y-3">
        {bets.map((bet) => (
          <Card
            key={bet.id}
            className="hover:bg-muted/30 cursor-pointer p-4 transition-colors"
            onClick={() => handleBetClick(bet)}
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <UserAvatar address={bet.creator} size="md" />

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-2">
                {/* Header with creator and status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">
                        {formatAddress(bet.creator)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        created a bet
                      </span>
                      {bet.acceptedBy && (
                        <>
                          <ArrowRight className="text-muted-foreground h-3 w-3" />
                          <UserAvatar address={bet.acceptedBy} size="sm" />
                          <span className="text-sm font-semibold">
                            {formatAddress(bet.acceptedBy)}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatDistanceToNow(bet.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <BetStatusBadge status={bet.status} />
                </div>

                {/* Bet description */}
                <p className="text-pretty text-sm leading-relaxed">
                  {bet.description}
                </p>

                {/* Amount and metadata */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Coins className="text-primary h-4 w-4" />
                    <span className="text-primary text-sm font-semibold">
                      {bet.amount} ETH
                    </span>
                  </div>
                  {bet.status === 'open' && (
                    <span className="text-muted-foreground text-xs">
                      {bet.counterparty
                        ? `Waiting for ${formatAddress(bet.counterparty)}`
                        : 'Open to anyone'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <BetDetailDialog
        bet={selectedBet}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
