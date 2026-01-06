'use client'

import { useCallback, useState } from 'react'
import { parseUnits, type Address, type Hash } from 'viem'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import {
  BET_ABI,
  ERC20_ABI,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from '@/lib/contracts'

type TransactionPhase =
  | 'idle'
  | 'checking-allowance'
  | 'approving'
  | 'waiting-approval'
  | 'accepting'
  | 'waiting-accept'
  | 'success'
  | 'error'

export function useAcceptBet(betAddress: Address, amount: string) {
  const account = useAccount()
  const [phase, setPhase] = useState<TransactionPhase>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [approvalHash, setApprovalHash] = useState<Hash | undefined>()
  const [acceptHash, setAcceptHash] = useState<Hash | undefined>()

  const amountInUnits = parseUnits(amount, USDC_DECIMALS)

  // Read current allowance for the bet contract
  const allowance = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: account.address ? [account.address, betAddress] : undefined,
    query: { enabled: !!account.address },
  })

  // Write hooks for approval and accept
  const approveWrite = useWriteContract()
  const acceptWrite = useWriteContract()

  // Wait for transaction receipts
  const approvalReceipt = useWaitForTransactionReceipt({
    hash: approvalHash,
  })

  const acceptReceipt = useWaitForTransactionReceipt({
    hash: acceptHash,
  })

  const acceptBet = useCallback(async () => {
    if (!account.address) {
      setError(new Error('Wallet not connected'))
      setPhase('error')
      return
    }

    setError(null)
    setApprovalHash(undefined)
    setAcceptHash(undefined)

    try {
      // Check allowance
      setPhase('checking-allowance')
      await allowance.refetch()

      const currentAllowance = allowance.data ?? BigInt(0)
      const needsApproval = currentAllowance < amountInUnits

      // Step 1: Approve if needed
      if (needsApproval) {
        setPhase('approving')
        const hash = await approveWrite.writeContractAsync({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [betAddress, amountInUnits],
        })
        setApprovalHash(hash)
        setPhase('waiting-approval')

        // Wait for approval to be confirmed
        await new Promise<void>((resolve, reject) => {
          const checkReceipt = setInterval(async () => {
            try {
              const receipt = await approvalReceipt.refetch()
              if (receipt.data?.status === 'success') {
                clearInterval(checkReceipt)
                resolve()
              } else if (receipt.data?.status === 'reverted') {
                clearInterval(checkReceipt)
                reject(new Error('Approval transaction reverted'))
              }
            } catch {
              // Still waiting
            }
          }, 1000)
        })
      }

      // Step 2: Accept the bet
      setPhase('accepting')
      const acceptTxHash = await acceptWrite.writeContractAsync({
        address: betAddress,
        abi: BET_ABI,
        functionName: 'accept',
      })
      setAcceptHash(acceptTxHash)
      setPhase('waiting-accept')

      // Wait for accept to be confirmed
      await new Promise<void>((resolve, reject) => {
        const checkReceipt = setInterval(async () => {
          try {
            const receipt = await acceptReceipt.refetch()
            if (receipt.data?.status === 'success') {
              clearInterval(checkReceipt)
              resolve()
            } else if (receipt.data?.status === 'reverted') {
              clearInterval(checkReceipt)
              reject(new Error('Accept transaction reverted'))
            }
          } catch {
            // Still waiting
          }
        }, 1000)
      })

      setPhase('success')
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setPhase('error')
      throw err
    }
  }, [
    account.address,
    allowance,
    amountInUnits,
    betAddress,
    approveWrite,
    acceptWrite,
    approvalReceipt,
    acceptReceipt,
  ])

  const reset = useCallback(() => {
    setPhase('idle')
    setError(null)
    setApprovalHash(undefined)
    setAcceptHash(undefined)
    approveWrite.reset()
    acceptWrite.reset()
  }, [approveWrite, acceptWrite])

  return {
    acceptBet,
    reset,
    phase,
    error,
    isIdle: phase === 'idle',
    isLoading: !['idle', 'success', 'error'].includes(phase),
    isSuccess: phase === 'success',
    isError: phase === 'error',
    approvalHash,
    acceptHash,
  }
}
