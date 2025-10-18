'use client'

import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { BetStatusBadge } from '@/components/bet-status-badge'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import type { Bet } from '@/lib/types'

interface BetsTableProps {
  bets: Bet[]
}

export function BetsTable({ bets }: BetsTableProps) {
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)

  return (
    <>
      <div className="space-y-3">
        {bets.map((bet) => (
          <Card
            key={bet.id}
            className="hover:border-primary/50 cursor-pointer p-4 transition-all hover:shadow-md"
            onClick={() => setSelectedBet(bet)}
          >
            <div className="space-y-3">
              {/* VS Header - Show who's competing */}
              {bet.acceptedBy ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      user={bet.creator}
                      size="sm"
                      clickable={false}
                    />
                    <span className="font-semibold">
                      @{bet.creator.username}
                    </span>
                  </div>
                  <span className="text-primary text-xl font-bold">VS</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      @{bet.acceptedBy.username}
                    </span>
                    <UserAvatar
                      user={bet.acceptedBy}
                      size="sm"
                      clickable={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserAvatar user={bet.creator} size="sm" clickable={false} />
                  <span className="font-semibold">@{bet.creator.username}</span>
                  <span className="text-muted-foreground text-sm">
                    is looking for an opponent
                  </span>
                </div>
              )}

              {/* Bet Description */}
              <p className="font-medium leading-tight">{bet.description}</p>

              {/* Bottom Row: Amount, Status, Time */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">{bet.amount}</span>
                  <span className="text-muted-foreground text-sm">ETH</span>
                </div>
                <div className="flex items-center gap-2">
                  <BetStatusBadge status={bet.status} />
                  <span className="text-muted-foreground text-xs">
                    {formatDistanceToNow(bet.createdAt, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedBet && (
        <BetDetailDialog
          bet={selectedBet}
          open={!!selectedBet}
          onOpenChange={(open) => !open && setSelectedBet(null)}
        />
      )}
    </>
  )
}
