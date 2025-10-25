'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Address, formatUnits, isAddress } from 'viem'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BET_ABI, ERC20_ABI, USDC_ADDRESS } from '@/lib/contracts'

const STATUS_LABELS = {
  0: 'Open',
  1: 'Active',
  2: 'Completed',
  3: 'Cancelled',
} as const

const BASE_EXPLORER = 'https://basescan.org'

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function TestBetContract() {
  const { address: userAddress, isConnected } = useAccount()
  const [contractAddress, setContractAddress] = useState<string>('')
  const [validAddress, setValidAddress] = useState<Address | null>(null)
  const [error, setError] = useState<string>('')
  const [txHash, setTxHash] = useState<Address | null>(null)

  // Read bet data from contract
  const {
    data: betData,
    isLoading: isLoadingBet,
    refetch: refetchBet,
  } = useReadContract({
    address: validAddress as Address,
    abi: BET_ABI,
    functionName: 'bet',
    query: {
      enabled: !!validAddress,
    },
  })

  // Read USDC allowance for taker
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args:
      userAddress && validAddress
        ? [userAddress as Address, validAddress as Address]
        : undefined,
    query: {
      enabled: !!userAddress && !!validAddress,
    },
  })

  // Read USDC balance
  const { data: usdcBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as Address] : undefined,
    query: {
      enabled: !!userAddress,
    },
  })

  const {
    writeContract,
    data: writeData,
    isPending: isWritePending,
  } = useWriteContract()

  const { isLoading: isTxPending, isSuccess: isTxSuccess } =
    useWaitForTransactionReceipt({
      hash: writeData,
    })

  // Handle transaction success
  useEffect(() => {
    if (isTxSuccess && writeData) {
      setTxHash(writeData)
      refetchBet()
      refetchAllowance()
    }
  }, [isTxSuccess, writeData, refetchBet, refetchAllowance])

  const handleAddressChange = (value: string) => {
    setContractAddress(value)
    setError('')
    setTxHash(null)

    if (value.trim() && isAddress(value)) {
      setValidAddress(value as Address)
    } else if (value.trim()) {
      setValidAddress(null)
    } else {
      setValidAddress(null)
    }
  }

  const handleApprove = async () => {
    if (!validAddress || !betData) return

    try {
      setError('')
      setTxHash(null)

      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [validAddress, betData.takerStake],
      })
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to approve USDC')
    }
  }

  const handleAccept = async () => {
    if (!validAddress) return

    try {
      setError('')
      setTxHash(null)

      writeContract({
        address: validAddress,
        abi: BET_ABI,
        functionName: 'accept',
      })
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to accept bet')
    }
  }

  const handleResolve = async (winner: Address) => {
    if (!validAddress) return

    try {
      setError('')
      setTxHash(null)

      writeContract({
        address: validAddress,
        abi: BET_ABI,
        functionName: 'resolve',
        args: [winner],
      })
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to resolve bet')
    }
  }

  const handleCancel = async () => {
    if (!validAddress) return

    try {
      setError('')
      setTxHash(null)

      writeContract({
        address: validAddress,
        abi: BET_ABI,
        functionName: 'cancel',
      })
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to cancel bet')
    }
  }

  const isMaker =
    userAddress &&
    betData &&
    userAddress.toLowerCase() === betData.maker.toLowerCase()
  const isTaker =
    userAddress &&
    betData &&
    userAddress.toLowerCase() === betData.taker.toLowerCase()
  const isJudge =
    userAddress &&
    betData &&
    userAddress.toLowerCase() === betData.judge.toLowerCase()
  const needsApproval =
    betData && allowance !== undefined && allowance < betData.takerStake
  const hasInsufficientBalance =
    betData && usdcBalance !== undefined && usdcBalance < betData.takerStake

  const isProcessing = isWritePending || isTxPending

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Test Bet Contract</h2>
        <p className="text-muted-foreground text-sm">
          Enter a deployed bet contract address to test interactions
        </p>
      </div>

      <div className="space-y-4">
        {/* Address Input */}
        <div>
          <Label htmlFor="contract-address">Contract Address</Label>
          <Input
            id="contract-address"
            placeholder="0x..."
            value={contractAddress}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="font-mono"
          />
          {contractAddress && !isAddress(contractAddress) && (
            <p className="text-destructive mt-1 text-sm">Invalid address</p>
          )}
        </div>

        {/* Loading State */}
        {isLoadingBet && validAddress && (
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading bet data...</span>
          </div>
        )}

        {/* Bet Data Display */}
        {betData && validAddress && !isLoadingBet && (
          <div className="border-muted space-y-4 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      betData.status === 0
                        ? 'bg-blue-100 text-blue-800'
                        : betData.status === 1
                          ? 'bg-green-100 text-green-800'
                          : betData.status === 2
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {
                      STATUS_LABELS[
                        betData.status as keyof typeof STATUS_LABELS
                      ]
                    }
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Maker</Label>
                <p className="mt-1 font-mono text-sm">
                  <a
                    href={`${BASE_EXPLORER}/address/${betData.maker}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                  >
                    {shortenAddress(betData.maker)}
                  </a>
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Taker</Label>
                <p className="mt-1 font-mono text-sm">
                  <a
                    href={`${BASE_EXPLORER}/address/${betData.taker}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                  >
                    {shortenAddress(betData.taker)}
                  </a>
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">Judge</Label>
                <p className="mt-1 font-mono text-sm">
                  <a
                    href={`${BASE_EXPLORER}/address/${betData.judge}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary hover:underline"
                  >
                    {shortenAddress(betData.judge)}
                  </a>
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">
                  Maker Stake
                </Label>
                <p className="mt-1 text-sm font-medium">
                  ${formatUnits(betData.makerStake, 6)} USDC
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">
                  Taker Stake
                </Label>
                <p className="mt-1 text-sm font-medium">
                  ${formatUnits(betData.takerStake, 6)} USDC
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">
                  Accept By
                </Label>
                <p className="mt-1 text-sm">
                  {new Date(Number(betData.acceptBy) * 1000).toLocaleString()}
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">
                  Resolve By
                </Label>
                <p className="mt-1 text-sm">
                  {new Date(Number(betData.resolveBy) * 1000).toLocaleString()}
                </p>
              </div>

              {betData.winner &&
                betData.winner !==
                  '0x0000000000000000000000000000000000000000' && (
                  <div className="sm:col-span-2">
                    <Label className="text-muted-foreground text-xs">
                      Winner
                    </Label>
                    <p className="mt-1 font-mono text-sm">
                      <a
                        href={`${BASE_EXPLORER}/address/${betData.winner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        {shortenAddress(betData.winner)}
                      </a>
                    </p>
                  </div>
                )}
            </div>

            {/* User Role Indicator */}
            {isConnected && (
              <div className="border-muted border-t pt-4">
                <Label className="text-muted-foreground text-xs">
                  Your Role
                </Label>
                <p className="mt-1 text-sm">
                  {isMaker && 'You are the Maker'}
                  {isTaker && 'You are the Taker'}
                  {isJudge && 'You are the Judge'}
                  {!isMaker && !isTaker && !isJudge && 'Observer'}
                </p>
              </div>
            )}

            {/* Actions for Maker */}
            {isMaker && betData.status === 0 && (
              <div className="border-muted border-t pt-4">
                <Label className="mb-2 block font-semibold">
                  Maker Actions
                </Label>

                {!isConnected && (
                  <p className="text-muted-foreground text-sm">
                    Connect your wallet to cancel this bet
                  </p>
                )}

                {isConnected && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={handleCancel}
                      disabled={isProcessing}
                      variant="destructive"
                    >
                      {isProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isProcessing ? 'Cancelling...' : 'Cancel Bet'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Actions for Taker */}
            {isTaker && betData.status === 0 && (
              <div className="border-muted border-t pt-4">
                <Label className="mb-2 block font-semibold">
                  Taker Actions
                </Label>

                {!isConnected && (
                  <p className="text-muted-foreground text-sm">
                    Connect your wallet to accept this bet
                  </p>
                )}

                {isConnected && hasInsufficientBalance && (
                  <p className="text-destructive text-sm">
                    Insufficient USDC balance. You need $
                    {formatUnits(betData.takerStake, 6)} USDC but have $
                    {usdcBalance !== undefined
                      ? formatUnits(usdcBalance, 6)
                      : '0'}{' '}
                    USDC
                  </p>
                )}

                {isConnected && !hasInsufficientBalance && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {needsApproval && (
                      <Button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        variant="outline"
                      >
                        {isProcessing && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isProcessing ? 'Approving...' : '1. Approve USDC'}
                      </Button>
                    )}
                    <Button
                      onClick={handleAccept}
                      disabled={isProcessing || needsApproval}
                    >
                      {isProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isProcessing
                        ? 'Accepting...'
                        : needsApproval
                          ? '2. Accept Bet'
                          : 'Accept Bet'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Actions for Judge */}
            {isJudge && betData.status === 1 && (
              <div className="border-muted border-t pt-4">
                <Label className="mb-2 block font-semibold">
                  Judge Actions - Declare Winner
                </Label>

                {!isConnected && (
                  <p className="text-muted-foreground text-sm">
                    Connect your wallet to resolve this bet
                  </p>
                )}

                {isConnected && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => handleResolve(betData.maker)}
                      disabled={isProcessing}
                      variant="outline"
                    >
                      {isProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Maker Wins
                    </Button>
                    <Button
                      onClick={() => handleResolve(betData.taker)}
                      disabled={isProcessing}
                    >
                      {isProcessing && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Taker Wins
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {txHash && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            Transaction submitted!{' '}
            <a
              href={`${BASE_EXPLORER}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              View on BaseScan
            </a>
          </div>
        )}
      </div>
    </Card>
  )
}
