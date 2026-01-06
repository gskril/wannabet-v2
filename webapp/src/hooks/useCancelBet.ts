'use client'

import { useCallback, useState } from 'react'
import { type Address, type Hash } from 'viem'
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import { BET_ABI } from '@/lib/contracts'

type TransactionPhase =
  | 'idle'
  | 'cancelling'
  | 'waiting-cancel'
  | 'success'
  | 'error'

export function useCancelBet(betAddress: Address) {
  const account = useAccount()
  const [phase, setPhase] = useState<TransactionPhase>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [cancelHash, setCancelHash] = useState<Hash | undefined>()

  // Write hook for cancel
  const cancelWrite = useWriteContract()

  // Wait for transaction receipt
  const cancelReceipt = useWaitForTransactionReceipt({
    hash: cancelHash,
  })

  const cancelBet = useCallback(async () => {
    if (!account.address) {
      setError(new Error('Wallet not connected'))
      setPhase('error')
      return
    }

    setError(null)
    setCancelHash(undefined)

    try {
      setPhase('cancelling')
      const hash = await cancelWrite.writeContractAsync({
        address: betAddress,
        abi: BET_ABI,
        functionName: 'cancel',
      })
      setCancelHash(hash)
      setPhase('waiting-cancel')

      // Wait for cancel to be confirmed
      await new Promise<void>((resolve, reject) => {
        const checkReceipt = setInterval(async () => {
          try {
            const receipt = await cancelReceipt.refetch()
            if (receipt.data?.status === 'success') {
              clearInterval(checkReceipt)
              resolve()
            } else if (receipt.data?.status === 'reverted') {
              clearInterval(checkReceipt)
              reject(new Error('Cancel transaction reverted'))
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
  }, [account.address, betAddress, cancelWrite, cancelReceipt])

  const reset = useCallback(() => {
    setPhase('idle')
    setError(null)
    setCancelHash(undefined)
    cancelWrite.reset()
  }, [cancelWrite])

  return {
    cancelBet,
    reset,
    phase,
    error,
    isIdle: phase === 'idle',
    isLoading: !['idle', 'success', 'error'].includes(phase),
    isSuccess: phase === 'success',
    isError: phase === 'error',
    cancelHash,
  }
}
