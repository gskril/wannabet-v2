'use client'

import Image from 'next/image'
import { useState } from 'react'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { StatusPennant } from '@/components/status-pennant'
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
            className="bg-wb-sand relative cursor-pointer border-0 p-4 transition-all hover:shadow-md"
            onClick={() => setSelectedBet(bet)}
          >
            {/* Status pennant positioned absolutely in top-right */}
            <div className="absolute right-2 top-0">
              <StatusPennant status={bet.status} />
            </div>

            <div className="flex flex-col gap-3">
              {/* Line 1: Avatars and usernames */}
              <div className="flex items-center gap-2">
                <div
                  className={`relative rounded-full ring-2 ${
                    bet.status === 'completed' &&
                    bet.winner?.fid === bet.maker.fid
                      ? 'ring-wb-gold'
                      : 'ring-wb-taupe'
                  } ${
                    bet.status === 'completed' &&
                    bet.winner &&
                    bet.winner.fid !== bet.maker.fid
                      ? 'grayscale'
                      : ''
                  }`}
                >
                  <UserAvatar user={bet.maker} size="sm" clickable={false} />
                  {bet.status === 'completed' &&
                    bet.winner?.fid === bet.maker.fid && (
                      <span className="absolute -bottom-1 -right-1 text-sm">
                        🏆
                      </span>
                    )}
                </div>
                <span className="text-wb-brown text-sm font-semibold">
                  {bet.maker.username}
                </span>
                <span className="text-wb-taupe text-sm">vs</span>
                <div
                  className={`relative rounded-full ring-2 ${
                    bet.status === 'completed' &&
                    bet.winner?.fid === bet.taker.fid
                      ? 'ring-wb-gold'
                      : 'ring-wb-taupe'
                  } ${
                    bet.status === 'completed' &&
                    bet.winner &&
                    bet.winner.fid !== bet.taker.fid
                      ? 'grayscale'
                      : ''
                  }`}
                >
                  <UserAvatar user={bet.taker} size="sm" clickable={false} />
                  {bet.status === 'completed' &&
                    bet.winner?.fid === bet.taker.fid && (
                      <span className="absolute -bottom-1 -right-1 text-sm">
                        🏆
                      </span>
                    )}
                </div>
                <span className="text-wb-brown text-sm font-semibold">
                  {bet.taker.username}
                </span>
              </div>

              {/* Line 2: Description */}
              <p className="text-wb-brown line-clamp-2 text-base font-medium leading-snug">
                {bet.description}
              </p>

              {/* Line 3: Amount and date */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-wb-brown text-sm font-bold">
                    {bet.amount}
                  </span>
                  <Image
                    src="/img/usdc.png"
                    alt="USDC"
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                </div>
                <span className="text-wb-taupe text-sm">
                  {new Intl.DateTimeFormat('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(bet.expiresAt)}
                </span>
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
