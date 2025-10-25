'use client'

import { format } from 'date-fns'
import { Calendar, ExternalLink, Share2, Trophy } from 'lucide-react'
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
  const [permissionError, setPermissionError] = useState<string | null>(null)
  const { address } = useAccount()
  
  // Helper to check if current user has permission for an action
  const canTakeAction = (role: 'maker' | 'taker' | 'judge'): boolean => {
    if (!address) return false
    // In production, this would map wallet address to FID
    // For now, we'll disable all actions if no wallet connected
    return false
  }

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
    setPermissionError(null)
  }
  
  const handleUnauthorizedAction = (role: string) => {
    setPermissionError(`Only the ${role} can do this`)
    setTimeout(() => setPermissionError(null), 3000)
  }
  
  const handleShare = async () => {
    const url = `${window.location.origin}/bet/${bet.id}`
    if (navigator.share) {
      await navigator.share({
        title: 'WannaBet',
        text: bet.description,
        url,
      })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }
  
  const getTimeRemaining = () => {
    const now = new Date()
    const diff = bet.expiresAt.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`
    return 'Less than 1 hour'
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) handleReset()
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-0">
        <div className="space-y-6 p-6">
          {/* 1. User Profiles at Top */}
          <div className="flex items-center justify-center gap-12">
            <div className="relative flex flex-col items-center gap-3">
              {bet.winner && bet.winner.fid === bet.maker.fid && (
                <div className="bg-background absolute -right-1 -top-1 z-10 rounded-full border-2 border-yellow-500 p-1.5 shadow-lg">
                  <Trophy className="h-5 w-5 text-yellow-500" fill="currentColor" />
                </div>
              )}
              <UserAvatar user={bet.maker} size="xl" clickable={false} />
              <p className="text-center text-sm font-semibold">{bet.maker.displayName}</p>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-muted-foreground text-2xl font-light">vs</span>
            </div>

            {bet.acceptedBy || bet.taker ? (
              <div className="relative flex flex-col items-center gap-3">
                {bet.winner &&
                  bet.acceptedBy &&
                  bet.winner.fid === bet.acceptedBy.fid && (
                    <div className="bg-background absolute -right-1 -top-1 z-10 rounded-full border-2 border-yellow-500 p-1.5 shadow-lg">
                      <Trophy className="h-5 w-5 text-yellow-500" fill="currentColor" />
                    </div>
                  )}
                <UserAvatar
                  user={bet.acceptedBy || bet.taker!}
                  size="xl"
                  clickable={false}
                />
                <p className="text-center text-sm font-semibold">
                  {(bet.acceptedBy || bet.taker)!.displayName}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                  <span className="text-muted-foreground text-2xl">?</span>
                </div>
                <p className="text-muted-foreground text-xs font-medium">Open</p>
              </div>
            )}
          </div>

          {/* 2. Bet Description */}
          <div className="text-center">
            <h2 className="text-2xl font-bold leading-tight tracking-tight">{bet.description}</h2>
          </div>

          {/* 3. Amount & Status (Same Line) */}
          <div className="flex items-center justify-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/usdc.png" alt="USDC" className="h-5 w-5" />
            <span className="text-lg font-bold">{bet.amount} USDC</span>
            <span className="text-muted-foreground">•</span>
            <BetStatusBadge status={bet.status} />
          </div>

          {/* 4. Bet End Date & Judge (Same Line) */}
          <div className="text-muted-foreground flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Ends: {format(bet.expiresAt, 'MMM d, yyyy')}</span>
            </div>
            {bet.judge && (
              <>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <UserAvatar user={bet.judge} size="sm" />
                  <span>
                    Judge: <span className="text-foreground font-semibold">{bet.judge.displayName}</span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Permission Error Alert */}
          {permissionError && (
            <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-900 shadow-sm dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
              {permissionError}
            </div>
          )}

          {/* 6. Status-Specific Sections */}
          <div className="space-y-4 pt-2">
            {bet.status === 'pending' && (
              <div className="space-y-4">
                <div className="bg-blue-50/70 rounded-lg px-4 py-3 text-center dark:bg-blue-950/20">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Waiting for {bet.taker?.displayName || 'opponent'} to accept • Expires{' '}
                    {format(bet.expiresAt, 'MMM d')}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      if (!canTakeAction('taker')) {
                        handleUnauthorizedAction('taker')
                      } else {
                        handleAcceptBet()
                      }
                    }}
                    disabled={!canTakeAction('taker') || isApproving || isAccepting}
                    className="flex-1"
                    size="lg"
                  >
                    Accept Bet
                  </Button>
                  <Button
                    onClick={() => {
                      if (!canTakeAction('maker')) {
                        handleUnauthorizedAction('maker')
                      }
                    }}
                    disabled={!canTakeAction('maker')}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    Cancel Bet
                  </Button>
                </div>
              </div>
            )}

            {bet.status === 'active' && (
              <div className="space-y-4">
                <div className="bg-yellow-50/70 rounded-lg px-4 py-3 text-center dark:bg-yellow-950/20">
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                    Time remaining: {getTimeRemaining()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (!canTakeAction('judge')) {
                        handleUnauthorizedAction('judge')
                      }
                    }}
                    disabled={!canTakeAction('judge')}
                    className="flex-1"
                    size="sm"
                  >
                    {bet.maker.displayName} Wins
                  </Button>
                  <Button
                    onClick={() => {
                      if (!canTakeAction('judge')) {
                        handleUnauthorizedAction('judge')
                      }
                    }}
                    disabled={!canTakeAction('judge')}
                    className="flex-1"
                    size="sm"
                  >
                    {bet.acceptedBy?.displayName || 'Opponent'} Wins
                  </Button>
                  <Button
                    onClick={() => {
                      if (!canTakeAction('judge')) {
                        handleUnauthorizedAction('judge')
                      }
                    }}
                    disabled={!canTakeAction('judge')}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    Tie
                  </Button>
                </div>
              </div>
            )}

            {bet.status === 'resolved' && bet.winner && (
              <div className="rounded-lg bg-green-50/70 px-4 py-3.5 text-center dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-900 dark:text-green-200">
                  Resolved on {format(bet.createdAt, 'MMM d, yyyy')} •{' '}
                  <span className="font-bold">Winner: {bet.winner.displayName}</span>
                </p>
              </div>
            )}

            {bet.status === 'expired' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-orange-50/70 px-4 py-3 text-center dark:bg-orange-950/20">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    Expired on {format(bet.expiresAt, 'MMM d, yyyy')}
                  </p>
                </div>
                <Button onClick={() => {}} variant="outline" className="w-full" size="lg">
                  Return Funds
                </Button>
              </div>
            )}

            {bet.status === 'cancelled' && (
              <div className="rounded-lg bg-gray-50/70 px-4 py-3.5 text-center dark:bg-gray-900/30">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                  Cancelled by {bet.maker.displayName} on{' '}
                  {format(bet.createdAt, 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* 7. Footer Actions - Always Present */}
          <div className="space-y-3 pt-2">
            <Button onClick={handleShare} variant="default" className="w-full shadow-sm" size="lg">
              <Share2 className="mr-2 h-4 w-4" />
              Share Bet
            </Button>
            <a
              href={`https://basescan.org/address/${bet.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 text-sm font-medium transition-colors hover:underline"
            >
              <span>View on Basescan</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
