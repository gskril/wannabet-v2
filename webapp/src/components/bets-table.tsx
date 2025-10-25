'use client'

import { formatDistanceStrict } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { BetStatusBadge } from '@/components/bet-status-badge'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import type { Bet } from '@/lib/types'

interface BetsTableProps {
  bets: Bet[]
}

const BASE_EXPLORER = 'https://basescan.org'

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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

  return (
    <>
      <div className="space-y-3">
        {bets.map((bet) => (
          <Card
            key={bet.id}
            className={`hover:border-primary/50 cursor-pointer p-4 transition-all hover:shadow-md ${
              bet.status === 'open' ? 'opacity-60' : ''
            }`}
            onClick={() => setSelectedBet(bet)}
          >
            <div className="flex gap-4">
              <div className="flex gap-2">
                <UserAvatar user={bet.maker} size="lg" clickable={false} />
                {bet.taker && (
                  <>
                    <span className="text-muted-foreground self-center text-sm">
                      vs
                    </span>
                    <UserAvatar user={bet.taker} size="lg" clickable={false} />
                  </>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-1.5 text-sm">
                    <span className="font-semibold">
                      {bet.maker.displayName}
                    </span>
                    <span className="text-muted-foreground">
                      {bet.status === 'open' ? 'challenges' : 'bets'}
                    </span>
                    {bet.taker && (
                      <span className="font-semibold">
                        {bet.taker.displayName}
                      </span>
                    )}
                    {!bet.taker && bet.acceptedBy && (
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
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href={`${BASE_EXPLORER}/address/${bet.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono text-xs transition-colors"
                  >
                    {shortenAddress(bet.id)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-muted-foreground text-xs">•</span>
                  <span className="text-muted-foreground text-xs">
                    Created {new Date(bet.createdAt).toLocaleDateString()}
                  </span>
                  {bet.status === 'open' && (
                    <>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-xs text-amber-600">
                        Pending acceptance
                      </span>
                    </>
                  )}
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
