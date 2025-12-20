'use client'

import { format } from 'date-fns'
import Image from 'next/image'
import { useEffect } from 'react'
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

import { STATUS_CONFIG, StatusPennant } from '@/components/status-pennant'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader } from '@/components/ui/drawer'
import { UserAvatar } from '@/components/user-avatar'
import { BET_ABI, ERC20_ABI, USDC_ADDRESS } from '@/lib/contracts'
import type { Bet, BetStatus } from '@/lib/types'

// =================================================================
// DEV MODE - Toggle these to test different UI states
// Set to 'none' to disable, or 'taker' | 'maker' | 'judge' to simulate
const DEV_SIMULATE_ROLE: 'none' | 'taker' | 'maker' | 'judge' = 'none'
// =================================================================

// Helper to get ring color based on bet status
const getStatusRingColor = (status: BetStatus) => {
  const colors = {
    open: 'ring-wb-yellow',
    active: 'ring-wb-mint',
    completed: 'ring-wb-gold',
    cancelled: 'ring-wb-pink',
  }
  return colors[status]
}

// Helper to get center badge background color based on bet status
const getStatusBgColor = (status: BetStatus) => {
  const colors = {
    open: 'bg-wb-yellow',
    active: 'bg-wb-mint',
    completed: 'bg-wb-gold',
    cancelled: 'bg-wb-pink',
  }
  return colors[status]
}

interface ActionCardProps {
  bet: Bet
  address: Address | undefined
  isApproving: boolean
  isResolving: boolean
  isWaitingForResolve: boolean
  isCanceling: boolean
  isWaitingForCancel: boolean
  usdcBalance: bigint | undefined
  onAcceptBet: () => void
  onResolveBet: (winnerAddress: string) => void
  onCancelBet: () => void
}

function ActionCard({
  bet,
  address,
  isApproving,
  isResolving,
  isWaitingForResolve,
  isCanceling,
  isWaitingForCancel,
  usdcBalance,
  onAcceptBet,
  onResolveBet,
  onCancelBet,
}: ActionCardProps) {
  // Real role checks
  const realIsUserTaker =
    address && bet.takerAddress?.toLowerCase() === address.toLowerCase()
  const realIsUserMaker =
    address && bet.makerAddress.toLowerCase() === address.toLowerCase()
  const realIsUserJudge =
    address && bet.judgeAddress?.toLowerCase() === address.toLowerCase()

  // Apply dev mode overrides
  const isUserTaker = DEV_SIMULATE_ROLE === 'taker' ? true : realIsUserTaker
  const isUserMaker = DEV_SIMULATE_ROLE === 'maker' ? true : realIsUserMaker
  const isUserJudge = DEV_SIMULATE_ROLE === 'judge' ? true : realIsUserJudge

  // State 3: Resolved - Winner display
  if (bet.status === 'completed' && bet.winner) {
    return (
      <div className="bg-wb-sand/50 rounded-xl border px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">🏆</span>
          <span className="text-wb-brown text-sm">
            @{bet.winner.username} won the bet!
          </span>
        </div>
      </div>
    )
  }

  // State 4: Cancelled
  if (bet.status === 'cancelled') {
    return (
      <div className="bg-wb-sand/50 rounded-xl border px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">❌</span>
          <span className="text-wb-brown text-center text-sm">
            @{bet.maker.username} canceled the bet and funds were returned
          </span>
        </div>
      </div>
    )
  }

  // State 2: Judge Selection (active + user is judge)
  if (bet.status === 'active' && isUserJudge && bet.acceptedBy) {
    return (
      <div className="bg-wb-sand/50 space-y-3 rounded-xl border px-4 py-3">
        <div className="flex gap-2">
          <Button
            onClick={() => onResolveBet(bet.makerAddress)}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
            disabled={isResolving || isWaitingForResolve}
          >
            @{bet.maker.username}
          </Button>
          <Button
            onClick={() => onResolveBet(bet.takerAddress || '')}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
            disabled={isResolving || isWaitingForResolve}
          >
            @{bet.acceptedBy.username}
          </Button>
          <Button
            onClick={onCancelBet}
            className="bg-wb-coral hover:bg-wb-coral/80 flex-1 text-white"
            disabled={isCanceling || isWaitingForCancel}
          >
            Cancel
          </Button>
        </div>
        <p className="text-wb-taupe text-center text-xs">
          {isResolving || isWaitingForResolve
            ? 'Submitting resolution...'
            : isCanceling || isWaitingForCancel
              ? 'Canceling bet...'
              : `Picking a winner will send them ${Number(bet.amount) * 2} USDC. Cancel will split the funds evenly`}
        </p>
      </div>
    )
  }

  // State 1: Taker Accept (open + user is taker)
  if (bet.status === 'open' && isUserTaker) {
    const hasInsufficientBalance =
      usdcBalance !== undefined &&
      parseUnits(bet.amount.toString(), 6) > usdcBalance

    return (
      <div className="bg-wb-sand/50 space-y-3 rounded-xl border px-4 py-3">
        <Button
          onClick={onAcceptBet}
          className="bg-wb-coral hover:bg-wb-coral/80 w-full text-white"
          size="lg"
          disabled={isApproving || hasInsufficientBalance}
        >
          {isApproving ? 'Accepting Bet...' : 'Accept Bet'}
        </Button>
        <p className="text-wb-taupe text-center text-xs">
          {hasInsufficientBalance
            ? `Insufficient USDC balance. You need ${bet.amount} USDC`
            : `Accepting will send ${bet.amount} USDC to the bet contract. Offer ends ${format(bet.expiresAt, 'MMM d, yyyy')}.`}
        </p>
      </div>
    )
  }

  // State 5: Maker Cancel (open + user is maker)
  if (bet.status === 'open' && isUserMaker) {
    return (
      <div className="bg-wb-sand/50 space-y-3 rounded-xl border px-4 py-3">
        <Button
          onClick={onCancelBet}
          className="bg-wb-coral hover:bg-wb-coral/80 w-full text-white"
          size="lg"
          disabled={isCanceling || isWaitingForCancel}
        >
          {isCanceling || isWaitingForCancel ? 'Canceling...' : 'Cancel Bet'}
        </Button>
        <p className="text-wb-taupe text-center text-xs">
          Canceling this bet will retrieve {bet.amount} USDC from the bet
          contract.
        </p>
      </div>
    )
  }

  // No action available for current user
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
    writeContractAsync: cancelBet,
    isPending: isCanceling,
    reset: resetCancel,
  } = useWriteContract()

  const { isLoading: isWaitingForCancel, isSuccess: isCancelSuccess } =
    useWaitForTransactionReceipt({
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

  // Refresh page after cancel transaction succeeds
  useEffect(() => {
    if (isCancelSuccess) {
      window.location.reload()
    }
  }, [isCancelSuccess])

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

  const handleCancelBet = async () => {
    if (!address) {
      alert('Please connect your wallet')
      return
    }

    try {
      await cancelBet({
        address: betAddress,
        abi: BET_ABI,
        functionName: 'cancel',
        args: [],
        chainId: 8453,
      })
    } catch (error) {
      console.error('Error canceling bet:', error)
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
        <DrawerHeader className="relative pb-2">
          {/* Status Pennant - Top right */}
          <div className="absolute right-4 top-0">
            <StatusPennant status={bet.status} />
          </div>

          {/* Large Overlapping Avatars */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {/* Maker avatar - positioned left */}
            <div
              className={`rounded-full ring-4 ${getStatusRingColor(bet.status)} z-10 ${
                bet.status === 'completed' &&
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
                <span className="font-bold">{Number(bet.amount) * 2}</span>
              </div>
            </div>

            {/* Taker avatar - positioned right */}
            <div
              className={`rounded-full ring-4 ${getStatusRingColor(bet.status)} ${
                bet.status === 'completed' &&
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
              @{bet.maker.username}
            </span>
            <span className="text-wb-brown text-sm font-medium">
              @{(bet.acceptedBy || bet.taker)?.username}
            </span>
          </div>
        </DrawerHeader>

        <div className="min-h-0 space-y-4 overflow-y-auto px-4 pb-6">
          {/* Bet Description */}
          <div className="text-center">
            <p className="text-wb-taupe text-sm">
              @{bet.maker.username} bet that...
            </p>
            <h2 className="text-wb-brown mt-1 text-2xl font-bold leading-tight">
              {bet.description}
            </h2>
            <p className="text-wb-taupe mt-2 text-sm">
              Ends: {format(bet.expiresAt, 'MMM d, yyyy')} | Judge: @
              {bet.judge?.username || 'TBA'}
            </p>
          </div>

          {/* Action Card - Context Dependent */}
          <ActionCard
            bet={bet}
            address={address}
            isApproving={isApproving}
            isResolving={isResolving}
            isWaitingForResolve={isWaitingForResolve}
            isCanceling={isCanceling}
            isWaitingForCancel={isWaitingForCancel}
            usdcBalance={usdcBalance}
            onAcceptBet={handleAcceptBet}
            onResolveBet={handleResolveBet}
            onCancelBet={handleCancelBet}
          />

          {/* Show More Details Link */}
          <button
            type="button"
            className="text-wb-coral mx-auto block text-sm font-medium hover:underline"
          >
            Show More Details
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
