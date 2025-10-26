'use client'

import { formatDistanceStrict } from 'date-fns'
import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { BetStatusBadge } from '@/components/bet-status-badge'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import type { Bet } from '@/lib/types'
import { cn } from '@/lib/utils'

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

  return (
    <>
      <div className="space-y-3">
        {bets.map((bet) => (
          <Card
            key={bet.id}
            className={cn(
              'hover:border-primary/50 relative cursor-pointer p-4 transition-all hover:shadow-md',
              bet.status === 'open' && 'opacity-60'
            )}
            onClick={() => setSelectedBet(bet)}
          >
            {/* Badge positioned absolutely in top-right */}
            {bet.status !== 'active' && (
              <div className="absolute right-2 top-2">
                <div className="opacity-60">
                  <BetStatusBadge status={bet.status} />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div className="mx-auto flex gap-2">
                <div className="relative">
                  <UserAvatar user={bet.maker} size="lg" clickable={false} />
                  {/* Show badge if the maker won */}
                  {bet.winner && bet.winner.fid === bet.maker.fid && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-0.5">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                <span className="text-muted-foreground self-center text-sm">
                  vs
                </span>

                <div className="relative">
                  <UserAvatar user={bet.taker} size="lg" clickable={false} />
                  {/* Show badge if the taker won */}
                  {bet.winner && bet.winner.fid === bet.taker.fid && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-green-500 p-0.5">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              </div>

              <div className="self-center text-center">
                {/* Show amount */}
                <div className="flex items-center gap-1.5">
                  <span className="text-primary text-xl font-bold">
                    {bet.amount}
                  </span>
                  <Image
                    src="/img/usdc.png"
                    alt="USDC"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>

                {/* Show time remaining if the bet is active */}
                {bet.status === 'active' && (
                  <span className="text-muted-foreground whitespace-nowrap text-xs">
                    {getTimeRemaining(bet.expiresAt)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-baseline gap-1.5 text-sm">
                    {(() => {
                      if (bet.winner) {
                        return (
                          <>
                            <span
                              className={cn(
                                'font-semibold',
                                bet.winner.fid === bet.maker.fid &&
                                  'text-green-600'
                              )}
                            >
                              {bet.maker.username}
                            </span>
                            <span className="text-muted-foreground">
                              {bet.winner.fid === bet.maker.fid
                                ? 'won against'
                                : 'lost to'}
                            </span>
                            {bet.taker && (
                              <span
                                className={cn(
                                  'font-semibold',
                                  bet.winner.fid === bet.taker.fid &&
                                    'text-green-600'
                                )}
                              >
                                {bet.taker.username}
                              </span>
                            )}
                          </>
                        )
                      }

                      return (
                        <>
                          <span className="font-semibold">
                            {bet.maker.username}
                          </span>
                          <span className="text-muted-foreground">
                            {bet.status === 'open' ? 'challenges' : 'bets'}
                          </span>
                          {bet.taker && (
                            <span className="font-semibold">
                              {bet.taker.username}
                            </span>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-2 text-base font-medium leading-snug">
                  {bet.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">
                    Created{' '}
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                    }).format(bet.createdAt)}
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
