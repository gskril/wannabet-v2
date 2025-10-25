'use client'

import { format } from 'date-fns'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Coins,
  ExternalLink,
  Trophy,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Address, parseUnits } from 'viem'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { BetStatusBadge } from '@/components/bet-status-badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { UserAvatar } from '@/components/user-avatar'
import { BET_ABI, ERC20_ABI, USDC_ADDRESS } from '@/lib/contracts'
import type { Bet } from '@/lib/types'

const BASE_EXPLORER = 'https://basescan.org'

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
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
  const [timelineExpanded, setTimelineExpanded] = useState(false)
  const { address } = useAccount()

  // Bet contract address (in real usage, this would come from bet.id)
  const betAddress = bet.id as Address

  // USDC approval hooks
  const {
    data: approvalHash,
    writeContractAsync: approveUsdc,
    isPending: isApproving,
    reset: resetApproval,
  } = useWriteContract()

  const { isSuccess: approvalConfirmed } = useWaitForTransactionReceipt({
    hash: approvalHash,
    query: {
      enabled: !!approvalHash,
    },
  })

  // Accept bet hooks
  const {
    data: acceptHash,
    writeContractAsync: acceptBet,
    isPending: isAccepting,
    reset: resetAccept,
  } = useWriteContract()

  const { isLoading: isWaitingForAccept } = useWaitForTransactionReceipt({
    hash: acceptHash,
    query: {
      enabled: !!acceptHash,
    },
  })

  // Resolve bet hooks
  const {
    data: resolveHash,
    isPending: isResolving,
    reset: resetResolve,
  } = useWriteContract()

  const { isLoading: isWaitingForResolve } = useWaitForTransactionReceipt({
    hash: resolveHash,
    query: {
      enabled: !!resolveHash,
    },
  })

  // Cancel bet hooks
  const {
    data: cancelHash,
    isPending: isCanceling,
    reset: resetCancel,
  } = useWriteContract()

  const { isLoading: isWaitingForCancel } = useWaitForTransactionReceipt({
    hash: cancelHash,
    query: {
      enabled: !!cancelHash,
    },
  })

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, betAddress] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Check USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Auto-accept after approval is confirmed
  useEffect(() => {
    if (approvalConfirmed && address) {
      refetchAllowance().then(async () => {
        await acceptBet({
          address: betAddress,
          abi: BET_ABI,
          functionName: 'accept',
          chainId: 8453, // Force Base network
        })
      })
    }
  }, [approvalConfirmed, refetchAllowance, address, acceptBet, betAddress])

  const handleAcceptBet = async () => {
    if (!address) {
      alert('Please connect your wallet')
      return
    }

    try {
      const amountInUnits = parseUnits(bet.amount.toString(), 6)
      const currentAllowance = allowance || BigInt(0)

      // Check if we need to approve USDC
      if (currentAllowance < amountInUnits) {
        await approveUsdc({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [betAddress, amountInUnits],
          chainId: 8453, // Force Base network
        })
        // Actual acceptance will happen in useEffect after approval confirms
      } else {
        // Already approved, call accept directly
        await acceptBet({
          address: betAddress,
          abi: BET_ABI,
          functionName: 'accept',
          chainId: 8453, // Force Base network
        })
      }
    } catch (error) {
      console.error('Error accepting bet:', error)
    }
  }

  const handleReset = () => {
    resetApproval()
    resetAccept()
    resetResolve()
    resetCancel()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) handleReset()
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          {/* Status Badge - Minimal in top right */}
          <div className="absolute right-6 top-6">
            <BetStatusBadge status={bet.status} />
          </div>

          {/* Hero Bet Description */}
          <div className="px-4 py-8 text-center">
            <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {bet.description}
            </h2>
          </div>
        </DialogHeader>

        <div className="space-y-8 px-2">
          {/* Players Section with Floating Amount */}
          <div className="relative">
            {bet.acceptedBy ? (
              <div className="flex items-start justify-center gap-10">
                {/* Player 1 */}
                <div className="flex flex-col items-center gap-2">
                  <UserAvatar user={bet.maker} size="lg" clickable={false} />
                  <p className="font-semibold">{bet.maker.displayName}</p>
                </div>

                {/* VS + Amount Badge */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-muted-foreground/40 text-xl font-light">
                    vs
                  </span>
                  {/* Floating Amount Badge */}
                  <div className="bg-muted/30 flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm">
                    <Coins className="text-muted-foreground h-3 w-3" />
                    <span className="text-xs font-medium">
                      {bet.amount} USDC
                    </span>
                  </div>
                </div>

                {/* Player 2 */}
                <div className="flex flex-col items-center gap-2">
                  <UserAvatar
                    user={bet.acceptedBy}
                    size="lg"
                    clickable={false}
                  />
                  <p className="font-semibold">{bet.acceptedBy.displayName}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <UserAvatar user={bet.maker} size="lg" clickable={false} />
                  <p className="font-semibold">{bet.maker.displayName}</p>
                </div>

                {/* Amount Badge for Open Bet */}
                <div className="bg-muted/30 flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm">
                  <Coins className="text-muted-foreground h-3 w-3" />
                  <span className="text-xs font-medium">{bet.amount} USDC</span>
                </div>

                {/* Challenge Status - Minimal */}
                <p className="text-muted-foreground text-xs">
                  {bet.taker
                    ? `Waiting for @${bet.taker.username} to accept`
                    : 'Open challenge'}
                </p>
              </div>
            )}
          </div>

          {/* Winner Section - Compact */}
          {bet.winner && (
            <div className="flex items-center justify-center gap-3 rounded-xl border bg-green-500/5 px-4 py-3">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <UserAvatar user={bet.winner} size="sm" />
              <div>
                <p className="text-sm font-medium">{bet.winner.displayName}</p>
                <p className="text-muted-foreground text-xs">Winner</p>
              </div>
            </div>
          )}

          {/* Judge Section - Minimal */}
          {bet.judge && (
            <div className="flex items-center justify-center gap-2">
              <UserAvatar user={bet.judge} size="sm" />
              <p className="text-muted-foreground text-sm">
                Judge:{' '}
                <span className="text-foreground font-medium">
                  {bet.judge.displayName}
                </span>
              </p>
            </div>
          )}

          {/* Contract Details */}
          <div className="border-t pt-6">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contract Address</span>
                <a
                  href={`${BASE_EXPLORER}/address/${bet.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary flex items-center gap-1 font-mono text-xs transition-colors"
                >
                  {shortenAddress(bet.id)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount (each)</span>
                <span className="font-medium">{bet.amount} USDC</span>
              </div>
            </div>
          </div>

          {/* Timeline - Collapsible */}
          <div className="border-t pt-6">
            <button
              onClick={() => setTimelineExpanded(!timelineExpanded)}
              className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-2 text-sm transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Timeline</span>
              {timelineExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {timelineExpanded && (
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="font-medium">
                    {format(bet.createdAt, 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                {bet.acceptedAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Accepted</span>
                    <span className="font-medium">
                      {format(bet.acceptedAt, 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-medium">
                    {format(bet.expiresAt, 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {bet.status === 'open' &&
            bet.takerAddress &&
            address &&
            bet.takerAddress.toLowerCase() === address.toLowerCase() && (
              <div className="space-y-3 pb-2">
                {/* Balance warning */}
                {usdcBalance !== undefined && (
                  <div className="text-center text-xs">
                    {parseUnits(bet.amount.toString(), 6) > usdcBalance ? (
                      <p className="text-destructive">
                        Insufficient USDC balance. You have{' '}
                        {(Number(usdcBalance) / 1_000_000).toFixed(2)} USDC but
                        need {bet.amount} USDC
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        Your balance:{' '}
                        {(Number(usdcBalance) / 1_000_000).toFixed(2)} USDC
                      </p>
                    )}
                  </div>
                )}

                {/* Accept button */}
                <Button
                  onClick={handleAcceptBet}
                  className="w-full"
                  size="lg"
                  disabled={
                    isApproving ||
                    isAccepting ||
                    isWaitingForAccept ||
                    (usdcBalance !== undefined &&
                      parseUnits(bet.amount.toString(), 6) > usdcBalance)
                  }
                >
                  {isApproving
                    ? 'Approving USDC...'
                    : isAccepting || isWaitingForAccept
                      ? 'Accepting Bet...'
                      : `Accept Bet (${bet.amount} USDC)`}
                </Button>

                {/* Confirmation message */}
                {bet.taker && (
                  <p className="text-muted-foreground text-center text-xs">
                    You are accepting this bet as @{bet.taker.username}
                  </p>
                )}
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
