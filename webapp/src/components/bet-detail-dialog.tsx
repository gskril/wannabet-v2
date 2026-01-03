'use client'

import { format } from 'date-fns'
import Image from 'next/image'
import { useState } from 'react'

import { StatusPennant } from '@/components/status-pennant'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { UserAvatar } from '@/components/user-avatar'
import { BetStatus, type Bet } from 'indexer/types'
import { getUsername } from '@/lib/utils'

// Helper to get ring color based on bet status
const getStatusRingColor = (status: BetStatus) => {
  const colors: Record<BetStatus, string> = {
    [BetStatus.PENDING]: 'ring-wb-yellow',
    [BetStatus.ACTIVE]: 'ring-wb-mint',
    [BetStatus.JUDGING]: 'ring-wb-mint',
    [BetStatus.RESOLVED]: 'ring-wb-gold',
    [BetStatus.CANCELLED]: 'ring-wb-pink',
  }
  return colors[status]
}

// Helper to get center badge background color based on bet status
const getStatusBgColor = (status: BetStatus) => {
  const colors: Record<BetStatus, string> = {
    [BetStatus.PENDING]: 'bg-wb-yellow',
    [BetStatus.ACTIVE]: 'bg-wb-mint',
    [BetStatus.JUDGING]: 'bg-wb-mint',
    [BetStatus.RESOLVED]: 'bg-wb-gold',
    [BetStatus.CANCELLED]: 'bg-wb-pink',
  }
  return colors[status]
}

interface ActionCardProps {
  bet: Bet
  onAcceptBet: () => void
  onResolveBet: (winner: 'maker' | 'taker') => void
  onCancelBet: () => void
}

function ActionCard({
  bet,
  onAcceptBet,
  onResolveBet,
  onCancelBet,
}: ActionCardProps) {
  // State 3: Resolved - Winner display
  if (bet.status === BetStatus.RESOLVED && bet.winner) {
    return (
      <div className="bg-wb-sand/50 rounded-xl border px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">🏆</span>
          <span className="text-wb-brown text-sm">
            @{getUsername(bet.winner)} won the bet!
          </span>
        </div>
      </div>
    )
  }

  // State 4: Cancelled
  if (bet.status === BetStatus.CANCELLED) {
    return (
      <div className="bg-wb-sand/50 rounded-xl border px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">❌</span>
          <span className="text-wb-brown text-center text-sm">
            @{getUsername(bet.maker)} canceled the bet and funds were returned
          </span>
        </div>
      </div>
    )
  }

  // State 2: Judge Selection (active or judging + user is judge)
  if (
    (bet.status === BetStatus.ACTIVE || bet.status === BetStatus.JUDGING) &&
    bet.acceptedBy
  ) {
    return (
      <div className="bg-wb-sand/50 space-y-3 rounded-xl border px-4 py-3">
        <p className="text-wb-taupe text-center text-xs">
          Pick a winner (mock - any user can click)
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => onResolveBet('maker')}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
          >
            @{getUsername(bet.maker)}
          </Button>
          <Button
            onClick={() => onResolveBet('taker')}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
          >
            @{getUsername(bet.acceptedBy)}
          </Button>
          <Button
            onClick={onCancelBet}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
          >
            Cancel
          </Button>
        </div>
        <p className="text-wb-taupe text-center text-xs">
          Picking a winner will send them {Number(bet.amount) * 2} USDC. Cancel
          will split the funds evenly
        </p>
      </div>
    )
  }

  // State 1: Taker Accept (pending)
  if (bet.status === BetStatus.PENDING) {
    return (
      <div className="bg-wb-sand/50 space-y-3 rounded-xl border px-4 py-3">
        <Button
          onClick={onAcceptBet}
          className="bg-wb-coral hover:bg-wb-coral/80 w-full text-white"
          size="lg"
        >
          Accept Bet
        </Button>
        <p className="text-wb-taupe text-center text-xs">
          Accepting will send {bet.amount} USDC to the bet contract. Offer ends{' '}
          {format(bet.acceptBy, 'MMM d, yyyy')}.
        </p>
        <Button
          onClick={onCancelBet}
          variant="outline"
          className="w-full"
          size="sm"
        >
          Cancel Bet
        </Button>
      </div>
    )
  }

  // No action available
  return null
}

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
  const [showDetails, setShowDetails] = useState(false)

  // Mock handlers - just log and close for now
  const handleAcceptBet = () => {
    // TODO: Implement real accept logic
    console.log('Mock: Accept bet', bet.address)
    alert('Mock: Bet accepted! (not really)')
  }

  const handleResolveBet = (winner: 'maker' | 'taker') => {
    // TODO: Implement real resolve logic
    console.log('Mock: Resolve bet', bet.address, 'winner:', winner)
    alert(
      `Mock: ${winner === 'maker' ? getUsername(bet.maker) : getUsername(bet.taker)} wins! (not really)`
    )
  }

  const handleCancelBet = () => {
    // TODO: Implement real cancel logic
    console.log('Mock: Cancel bet', bet.address)
    alert('Mock: Bet cancelled! (not really)')
  }

  const handleReset = () => {
    setShowDetails(false)
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) handleReset()
      }}
    >
      <DrawerContent className="fixed bottom-0 left-0 right-0 mx-auto flex max-h-[90dvh] max-w-3xl flex-col pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="relative pb-2">
          <DrawerTitle className="sr-only">Bet Details</DrawerTitle>
          {/* Status Pennant - Top right */}
          <div className="absolute right-4 top-0">
            <StatusPennant status={bet.status} />
          </div>

          {/* Large Overlapping Avatars */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {/* Maker avatar - positioned left */}
            <div
              className={`rounded-full ring-4 ${getStatusRingColor(bet.status)} z-10 ${
                bet.status === BetStatus.RESOLVED &&
                bet.winner &&
                bet.winner.fid !== bet.maker.fid
                  ? 'grayscale'
                  : ''
              }`}
            >
              <UserAvatar user={bet.maker} size="2xl" clickable={false} />
            </div>

            {/* Center badge - overlapping both */}
            <div
              className={`absolute z-20 flex h-16 w-16 flex-col items-center justify-center rounded-full ${getStatusBgColor(bet.status)} shadow-md`}
            >
              <div className="flex items-center gap-0.5">
                <Image
                  src="/img/usdc.png"
                  alt="USDC"
                  width={16}
                  height={16}
                  className="rounded-full"
                />
                <span className="font-bold">{bet.amount}</span>
              </div>
              <span className="text-[10px] opacity-70">each</span>
            </div>

            {/* Taker avatar - positioned right */}
            <div
              className={`rounded-full ring-4 ${getStatusRingColor(bet.status)} ${
                bet.status === BetStatus.RESOLVED &&
                bet.winner &&
                bet.winner.fid !== (bet.acceptedBy || bet.taker)?.fid
                  ? 'grayscale'
                  : ''
              }`}
            >
              <UserAvatar
                user={bet.acceptedBy || bet.taker}
                size="2xl"
                clickable={false}
              />
            </div>
          </div>

          {/* Usernames below avatars */}
          <div className="mt-2 flex justify-center gap-24">
            <span className="text-wb-brown text-sm font-medium">
              @{getUsername(bet.maker)}
            </span>
            <span className="text-wb-brown text-sm font-medium">
              @{getUsername(bet.acceptedBy || bet.taker)}
            </span>
          </div>
        </DrawerHeader>

        <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-6">
          {/* Bet Description */}
          <div className="text-center">
            <p className="text-wb-taupe text-sm">
              @{getUsername(bet.maker)} bet that...
            </p>
            <h2 className="text-wb-brown mt-1 text-2xl font-bold leading-tight">
              {bet.description}
            </h2>
            <p className="text-wb-taupe mt-2 text-sm">
              Ends: {format(bet.expiresAt, 'MMM d, yyyy')} | Judge: @
              {getUsername(bet.judge)}
            </p>
          </div>

          {/* Action Card - Context Dependent */}
          <ActionCard
            bet={bet}
            onAcceptBet={handleAcceptBet}
            onResolveBet={handleResolveBet}
            onCancelBet={handleCancelBet}
          />

          {/* Show More Details Link */}
          <button
            type="button"
            className="text-wb-coral mx-auto block text-sm font-medium hover:underline"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show More Details'}
          </button>

          {/* Collapsible Details Section */}
          {showDetails && (
            <div className="bg-wb-sand/30 space-y-2 rounded-lg p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-wb-taupe">Contract</span>
                <span className="text-wb-brown font-mono">
                  {bet.address.slice(0, 10)}...{bet.address.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-wb-taupe">Judge</span>
                <span className="text-wb-brown">@{getUsername(bet.judge)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-wb-taupe">Created</span>
                <span className="text-wb-brown">
                  {format(bet.createdAt, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-wb-taupe">Accept by</span>
                <span className="text-wb-brown">
                  {format(bet.acceptBy, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-wb-taupe">Judge deadline</span>
                <span className="text-wb-brown">
                  {format(bet.judgeDeadline, 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
