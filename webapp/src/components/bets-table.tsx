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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3">
                  <UserAvatar user={bet.creator} size="sm" clickable={false} />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium leading-tight">
                      {bet.description}
                    </p>
                    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                      <span>@{bet.creator.username}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(bet.createdAt, {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold">{bet.amount}</span>
                  <span className="text-muted-foreground text-sm">ETH</span>
                </div>
                <BetStatusBadge status={bet.status} />
              </div>
            </div>

            {bet.acceptedBy && (
              <div className="text-muted-foreground mt-3 flex items-center gap-2 border-t pt-3 text-sm">
                <span>vs</span>
                <UserAvatar user={bet.acceptedBy} size="sm" clickable={false} />
                <span>@{bet.acceptedBy.username}</span>
              </div>
            )}
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
