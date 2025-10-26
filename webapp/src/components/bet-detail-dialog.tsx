'use client'

import { format } from 'date-fns'
import { Coins, ExternalLink, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Address, encodeFunctionData, parseUnits } from 'viem'
import { base } from 'viem/chains'
import {
  useAccount,
  useReadContract,
  useSendCalls,
  useWaitForCallsStatus,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { BetStatusBadge } from '@/components/bet-status-badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { UserAvatar } from '@/components/user-avatar'
import { BET_ABI, ERC20_ABI, USDC_ADDRESS } from '@/lib/contracts'
import type { Bet } from '@/lib/types'
import { shortenAddress } from '@/lib/utils'

const BASE_EXPLORER = 'https://basescan.org'

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

  // Batch call hook
  const {
    data: batchResult,
    sendCalls: sendTransaction,
    isPending: isApproving,
    reset: resetApproval,
  } = useSendCalls()

  const { isSuccess: isTransactionConfirmed } = useWaitForCallsStatus({
    id: batchResult?.id,
    query: {
      enabled: !!batchResult?.id,
    },
  })

  // Resolve bet hooks
  const {
    data: resolveHash,
    writeContractAsync: resolveBet,
    isPending: isResolving,
    reset: resetResolve,
  } = useWriteContract()

  const { isLoading: isWaitingForResolve, isSuccess: isResolveSuccess } =
    useWaitForTransactionReceipt({
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

  // Refresh page after accept transaction succeeds
  useEffect(() => {
    if (isTransactionConfirmed) {
      window.location.reload()
    }
  }, [isTransactionConfirmed])

  // Refresh page after resolve transaction succeeds
  useEffect(() => {
    if (isResolveSuccess) {
      window.location.reload()
    }
  }, [isResolveSuccess])

  const handleAcceptBet = async () => {
    if (!address) {
      alert('Please connect your wallet')
      return
    }

    try {
      const amountInUnits = parseUnits(bet.amount.toString(), 6)
      const currentAllowance = allowance || BigInt(0)
      const calls = []

      // Check if we need to approve USDC
      if (currentAllowance < amountInUnits) {
        const approveCall = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [betAddress, amountInUnits],
        })
        calls.push({
          to: USDC_ADDRESS,
          data: approveCall,
        })
      }

      const acceptCall = encodeFunctionData({
        abi: BET_ABI,
        functionName: 'accept',
        args: [],
      })
      calls.push({
        to: betAddress,
        data: acceptCall,
      })

      sendTransaction({
        calls,
        chainId: base.id,
      })
    } catch (error) {
      console.error('Error accepting bet:', error)
    }
  }

  const handleResolveBet = async (winnerAddress: string) => {
    if (!address) {
      alert('Please connect your wallet')
      return
    }

    try {
      await resolveBet({
        address: betAddress,
        abi: BET_ABI,
        functionName: 'resolve',
        args: [winnerAddress as Address],
        chainId: 8453, // Force Base network
      })
    } catch (error) {
      console.error('Error resolving bet:', error)
    }
  }

  const handleReset = () => {
    resetApproval()
    resetResolve()
    resetCancel()
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
        <DrawerHeader className="pb-2">
          {/* Status Badge - Minimal in top right */}
          <div className="absolute right-4 top-4">
            <BetStatusBadge status={bet.status} />
          </div>

          {/* Hero Bet Description */}
          <div className="pr-20 text-center">
            <DrawerTitle className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
              {bet.description}
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-6">
          {/* Players Section with Floating Amount */}
          <div className="relative">
            {bet.acceptedBy ? (
              <div className="flex items-center justify-center gap-4">
                {/* Player 1 */}
                <div className="flex flex-col items-center gap-1">
                  <UserAvatar user={bet.maker} size="md" clickable={false} />
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      {bet.maker.displayName}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {shortenAddress(bet.makerAddress)}
                    </p>
                  </div>
                </div>

                {/* VS + Amount Badge */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-muted-foreground/40 text-sm font-light">
                    vs
                  </span>
                  {/* Floating Amount Badge */}
                  <div className="bg-muted/30 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 shadow-sm">
                    <Coins className="text-muted-foreground h-3 w-3" />
                    <span className="text-xs font-medium">
                      {bet.amount} USDC
                    </span>
                  </div>
                </div>

                {/* Player 2 */}
                <div className="flex flex-col items-center gap-1">
                  <UserAvatar
                    user={bet.acceptedBy}
                    size="md"
                    clickable={false}
                  />
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      {bet.acceptedBy.displayName}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {shortenAddress(bet.takerAddress || '')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <UserAvatar user={bet.maker} size="md" clickable={false} />
                  <div className="text-center">
                    <p className="text-sm font-semibold">
                      {bet.maker.displayName}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {shortenAddress(bet.makerAddress)}
                    </p>
                  </div>
                </div>

                {/* Amount Badge for Open Bet */}
                <div className="bg-muted/30 flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 shadow-sm">
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
            <div className="flex items-center justify-center gap-2 rounded-lg border bg-green-500/5 px-3 py-2">
              <Trophy className="h-3.5 w-3.5 text-yellow-500" />
              <UserAvatar user={bet.winner} size="sm" />
              <div>
                <p className="text-sm font-medium">{bet.winner.displayName}</p>
                <p className="text-muted-foreground text-xs">Winner</p>
              </div>
            </div>
          )}

          {/* Judge Resolution - Active bets only */}
          {bet.status === 'active' &&
            bet.judgeAddress &&
            address &&
            bet.judgeAddress.toLowerCase() === address.toLowerCase() &&
            bet.acceptedBy && (
              <div className="space-y-3 rounded-lg border bg-blue-500/5 px-4 py-3">
                <p className="text-center text-sm font-medium">
                  Select the winner
                </p>
                <div className="flex gap-2">
                  {/* Maker button */}
                  <Button
                    onClick={() => handleResolveBet(bet.makerAddress)}
                    className="flex-1"
                    variant="outline"
                    disabled={isResolving || isWaitingForResolve}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        user={bet.maker}
                        size="sm"
                        clickable={false}
                      />
                      <span className="text-sm">{bet.maker.displayName}</span>
                    </div>
                  </Button>

                  {/* Taker button */}
                  <Button
                    onClick={() => handleResolveBet(bet.takerAddress || '')}
                    className="flex-1"
                    variant="outline"
                    disabled={isResolving || isWaitingForResolve}
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        user={bet.acceptedBy}
                        size="sm"
                        clickable={false}
                      />
                      <span className="text-sm">
                        {bet.acceptedBy.displayName}
                      </span>
                    </div>
                  </Button>
                </div>

                {(isResolving || isWaitingForResolve) && (
                  <p className="text-muted-foreground text-center text-xs">
                    {isResolving
                      ? 'Submitting resolution...'
                      : 'Waiting for confirmation...'}
                  </p>
                )}
              </div>
            )}

          {/* Judge Section - Minimal */}
          <div className="flex items-center justify-center gap-2">
            {bet.judge ? (
              <>
                <UserAvatar user={bet.judge} size="sm" />
                <p className="text-muted-foreground text-xs">
                  Judge:{' '}
                  <span className="text-foreground font-medium">
                    {bet.judge.displayName}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-xs italic">
                Judge: To be announced
              </p>
            )}
          </div>

          {/* Contract Details */}
          <div className="border-t pt-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Contract</span>
                <a
                  href={`${BASE_EXPLORER}/address/${bet.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary flex items-center gap-1 font-mono transition-colors"
                >
                  {shortenAddress(bet.id)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {format(bet.createdAt, 'MMM d, yyyy')}
                </span>
              </div>
              {bet.acceptedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Accepted</span>
                  <span className="font-medium">
                    {format(bet.acceptedAt, 'MMM d, yyyy')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium">
                  {format(bet.expiresAt, 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {bet.status === 'open' &&
            bet.takerAddress &&
            address &&
            bet.takerAddress.toLowerCase() === address.toLowerCase() && (
              <div className="space-y-2 pt-2">
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
                    (usdcBalance !== undefined &&
                      parseUnits(bet.amount.toString(), 6) > usdcBalance)
                  }
                >
                  {isApproving
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
      </DrawerContent>
    </Drawer>
  )
}
