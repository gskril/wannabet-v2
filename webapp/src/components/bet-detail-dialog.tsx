'use client'

import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { type Address } from 'viem'
import { useAccount } from 'wagmi'

import { StatusPennant } from '@/components/status-pennant'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { UserAvatar } from '@/components/user-avatar'
import { useAcceptBet } from '@/hooks/useAcceptBet'
import { useCancelBet } from '@/hooks/useCancelBet'
import { useResolveBet } from '@/hooks/useResolveBet'
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
  userAddress?: Address
  onAcceptBet: () => void
  onResolveBet: (winner: 'maker' | 'taker') => void
  onCancelBet: () => void
  isAccepting: boolean
  isResolving: boolean
  isCancelling: boolean
  acceptPhase: string
  resolvePhase: string
  cancelPhase: string
  error: string | null
}

function ActionCard({
  bet,
  userAddress,
  onAcceptBet,
  onResolveBet,
  onCancelBet,
  isAccepting,
  isResolving,
  isCancelling,
  acceptPhase,
  error,
}: ActionCardProps) {
  const isLoading = isAccepting || isResolving || isCancelling

  // Determine user roles
  const isMaker = userAddress?.toLowerCase() === bet.maker.address.toLowerCase()
  const isTaker = userAddress?.toLowerCase() === bet.taker.address.toLowerCase()
  const isJudge = userAddress?.toLowerCase() === bet.judge.address.toLowerCase()

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
            Bet was cancelled and funds were returned
          </span>
        </div>
      </div>
    )
  }

  // State 2: Judge Selection (active or judging)
  if (
    (bet.status === BetStatus.ACTIVE || bet.status === BetStatus.JUDGING) &&
    bet.acceptedBy
  ) {
    if (!isJudge) {
      return (
        <div className="bg-wb-sand/50 rounded-xl border px-4 py-3">
          <p className="text-wb-taupe text-center text-sm">
            Waiting for @{getUsername(bet.judge)} to pick a winner
          </p>
        </div>
      )
    }

    return (
      <div className="bg-wb-sand/50 space-y-3 rounded-xl border px-4 py-3">
        {error && (
          <div className="bg-red-50 text-red-600 rounded-lg p-2 text-xs">
            {error}
          </div>
        )}
        <p className="text-wb-taupe text-center text-xs">
          You are the judge. Pick a winner or cancel (draw).
        </p>
        <div className="flex gap-2">
          <Button
            onClick={() => onResolveBet('maker')}
            disabled={isLoading}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
          >
            {isResolving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            @{getUsername(bet.maker)}
          </Button>
          <Button
            onClick={() => onResolveBet('taker')}
            disabled={isLoading}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
          >
            {isResolving && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            @{getUsername(bet.acceptedBy)}
          </Button>
        </div>
        <Button
          onClick={onCancelBet}
          disabled={isLoading}
          variant="outline"
          className="w-full"
          size="sm"
        >
          {isCancelling && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
          Cancel (Draw)
        </Button>
        <p className="text-wb-taupe text-center text-xs">
          Picking a winner will send them {Number(bet.amount) * 2} USDC. Cancel
          will split the funds evenly
        </p>
      </div>
    )
  }

  // State 1: Taker Accept (pending)
  if (bet.status === BetStatus.PENDING) {
    // Only taker can accept
    if (isTaker) {
      return (
        <div className="bg-wb-sand/50 space-y-3 rounded-xl border px-4 py-3">
          {error && (
            <div className="bg-red-50 text-red-600 rounded-lg p-2 text-xs">
              {error}
            </div>
          )}
          <Button
            onClick={onAcceptBet}
            disabled={isLoading}
            className="bg-wb-coral hover:bg-wb-coral/80 w-full text-white"
            size="lg"
          >
            {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getAcceptButtonText(acceptPhase)}
          </Button>
          <p className="text-wb-taupe text-center text-xs">
            Accepting will send {bet.amount} USDC to the bet contract. Offer
            ends {format(bet.acceptBy, 'MMM d, yyyy')}.
          </p>
        </div>
      )
    }

    // Only maker can cancel pending bet
    if (isMaker) {
      return (
        <div className="bg-wb-sand/50 space-y-3 rounded-xl border px-4 py-3">
          {error && (
            <div className="bg-red-50 text-red-600 rounded-lg p-2 text-xs">
              {error}
            </div>
          )}
          <p className="text-wb-taupe text-center text-sm">
            Waiting for @{getUsername(bet.taker)} to accept your bet
          </p>
          <Button
            onClick={onCancelBet}
            disabled={isLoading}
            variant="outline"
            className="w-full"
            size="sm"
          >
            {isCancelling && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Cancel Bet
          </Button>
        </div>
      )
    }

    // Other users can only view
    return (
      <div className="bg-wb-sand/50 rounded-xl border px-4 py-3">
        <p className="text-wb-taupe text-center text-sm">
          Waiting for @{getUsername(bet.taker)} to accept the bet
        </p>
      </div>
    )
  }

  // No action available
  return null
}

function getAcceptButtonText(phase: string): string {
  switch (phase) {
    case 'checking-allowance':
      return 'Checking allowance...'
    case 'approving':
      return 'Approve USDC...'
    case 'waiting-approval':
      return 'Waiting for approval...'
    case 'accepting':
      return 'Accepting...'
    case 'waiting-accept':
      return 'Confirming...'
    default:
      return 'Accept Bet'
  }
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
  const [txError, setTxError] = useState<string | null>(null)

  const account = useAccount()
  const betAddress = bet.address as Address

  // Contract interaction hooks
  const acceptBet = useAcceptBet(betAddress, bet.amount)
  const resolveBet = useResolveBet(betAddress)
  const cancelBet = useCancelBet(betAddress)

  // Handle accept bet
  const handleAcceptBet = async () => {
    setTxError(null)
    try {
      await acceptBet.acceptBet()
      // Success - close dialog after brief delay to show success state
      setTimeout(() => onOpenChange(false), 1500)
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Accept failed')
    }
  }

  // Handle resolve bet
  const handleResolveBet = async (winner: 'maker' | 'taker') => {
    setTxError(null)
    const winnerAddress =
      winner === 'maker'
        ? (bet.maker.address as Address)
        : (bet.acceptedBy?.address as Address)

    try {
      await resolveBet.resolveBet(winnerAddress)
      // Success - close dialog after brief delay
      setTimeout(() => onOpenChange(false), 1500)
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Resolve failed')
    }
  }

  // Handle cancel bet
  const handleCancelBet = async () => {
    setTxError(null)
    try {
      await cancelBet.cancelBet()
      // Success - close dialog after brief delay
      setTimeout(() => onOpenChange(false), 1500)
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Cancel failed')
    }
  }

  const handleReset = () => {
    setShowDetails(false)
    setTxError(null)
    acceptBet.reset()
    resolveBet.reset()
    cancelBet.reset()
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
            userAddress={account.address}
            onAcceptBet={handleAcceptBet}
            onResolveBet={handleResolveBet}
            onCancelBet={handleCancelBet}
            isAccepting={acceptBet.isLoading}
            isResolving={resolveBet.isLoading}
            isCancelling={cancelBet.isLoading}
            acceptPhase={acceptBet.phase}
            resolvePhase={resolveBet.phase}
            cancelPhase={cancelBet.phase}
            error={txError}
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
