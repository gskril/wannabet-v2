'use client'

import { formatDistanceStrict } from 'date-fns'
import { useState } from 'react'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { BetStatusBadge } from '@/components/bet-status-badge'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import type { Bet } from '@/lib/types'

interface BetsTableProps {
  bets: Bet[]
}

function getTimeRemaining(expiresAt: Date): string {
  const now = new Date()
  if (expiresAt <= now) {
    return 'Expired'
  }

  const distance = formatDistanceStrict(expiresAt, now, {
    addSuffix: false,
    unit: 'day',
  })

  // If less than a day, show hours
  const diffInHours = Math.floor(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
  )
  if (diffInHours < 24) {
    return `${diffInHours}h left`
  }

  return `${distance} left`
}

export function BetsTable({ bets }: BetsTableProps) {
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)

  // Filter out open bets (MVP doesn't support "anyone" bets)
  const filteredBets = bets.filter((bet) => bet.status !== 'open')

  return (
    <>
      <div className="space-y-3">
        {filteredBets.map((bet) => (
          <Card
            key={bet.id}
            className="hover:border-primary/50 cursor-pointer p-4 transition-all hover:shadow-md"
            onClick={() => setSelectedBet(bet)}
          >
            <div className="flex gap-4">
              <UserAvatar user={bet.maker} size="lg" clickable={false} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-1.5 text-sm">
                    <span className="font-semibold">
                      {bet.maker.displayName}
                    </span>
                    <span className="text-muted-foreground">bets</span>
                    {bet.acceptedBy && (
                      <span className="font-semibold">
                        {bet.acceptedBy.displayName}
                      </span>
                    )}
                    <span className="text-primary font-bold">
                      {bet.amount} USDC
                    </span>
                  </div>
                  <div className="shrink-0">
                    {bet.status === 'active' ? (
                      <span className="text-muted-foreground whitespace-nowrap text-xs">
                        {getTimeRemaining(bet.expiresAt)}
                      </span>
                    ) : (
                      <BetStatusBadge status={bet.status} />
                    )}
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-2 text-base font-medium leading-snug">
                  {bet.description}
                </p>
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
