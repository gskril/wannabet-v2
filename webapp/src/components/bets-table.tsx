'use client'

import Image from 'next/image'
import { useState } from 'react'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { StatusPennant } from '@/components/status-pennant'
import { UserAvatar } from '@/components/user-avatar'
import { BetStatus, type Bet } from 'indexer/types'
import { getUsername } from '@/lib/utils'

interface BetsTableProps {
  bets: Bet[]
}

export function BetsTable({ bets }: BetsTableProps) {
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)

  return (
    <>
      <div className="flex flex-col gap-3">
        {bets.map((bet, index) => (
          <div
            key={bet.address}
            className="animate-card-mount cursor-pointer rounded-3xl border-0 bg-white p-6 shadow-clay transition-all hover:-translate-y-[3px]"
            style={{ animationDelay: `${50 + index * 50}ms` }}
            onClick={() => setSelectedBet(bet)}
          >
            {/* Header row: Avatars + names + status badge */}
            <div className="mb-3.5 flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className={`relative rounded-full ring-2 ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner?.address?.toLowerCase() === bet.maker.address?.toLowerCase()
                        ? 'ring-wb-gold'
                        : 'ring-wb-taupe/30'
                    } ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner &&
                      bet.winner.address?.toLowerCase() !== bet.maker.address?.toLowerCase()
                        ? 'grayscale'
                        : ''
                    }`}
                  >
                    <UserAvatar user={bet.maker} size="sm" clickable={false} />
                  </div>
                  <span className={`text-sm font-bold text-wb-brown ${
                    bet.status === BetStatus.RESOLVED &&
                    bet.winner?.address?.toLowerCase() === bet.maker.address?.toLowerCase()
                      ? 'underline decoration-wb-gold decoration-2 underline-offset-2'
                      : ''
                  }`}>
                    {getUsername(bet.maker)}
                  </span>
                </div>
                <span className="text-[13px] font-bold" style={{ color: '#d4c5a9' }}>
                  vs
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`relative rounded-full ring-2 ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner?.address?.toLowerCase() === bet.taker.address?.toLowerCase()
                        ? 'ring-wb-gold'
                        : 'ring-wb-taupe/30'
                    } ${
                      bet.status === BetStatus.RESOLVED &&
                      bet.winner &&
                      bet.winner.address?.toLowerCase() !== bet.taker.address?.toLowerCase()
                        ? 'grayscale'
                        : ''
                    }`}
                  >
                    <UserAvatar user={bet.taker} size="sm" clickable={false} />
                  </div>
                  <span className={`text-sm font-bold text-wb-brown ${
                    bet.status === BetStatus.RESOLVED &&
                    bet.winner?.address?.toLowerCase() === bet.taker.address?.toLowerCase()
                      ? 'underline decoration-wb-gold decoration-2 underline-offset-2'
                      : ''
                  }`}>
                    {getUsername(bet.taker)}
                  </span>
                </div>
              </div>
              <StatusPennant status={bet.status} />
            </div>

            {/* Description */}
            <p
              className="line-clamp-2 text-[17px] font-bold leading-snug text-wb-brown"
              style={{ letterSpacing: '-0.01em' }}
            >
              {bet.description}
            </p>

            {/* Amount and date */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[20px] font-bold text-wb-coral">
                  {bet.amount}
                </span>
                <Image
                  src="/img/usdc.png"
                  alt="USDC"
                  width={18}
                  height={18}
                  className="rounded-full"
                />
              </div>
              <span className="text-xs font-semibold text-wb-taupe">
                Ends{' '}
                {new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).format(bet.expiresAt)}
              </span>
            </div>
          </div>
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
