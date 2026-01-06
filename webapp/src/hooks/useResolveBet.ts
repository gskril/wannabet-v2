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
  | 'resolving'
  | 'waiting-resolve'
  | 'success'
  | 'error'

export function useResolveBet(betAddress: Address) {
  const account = useAccount()
  const [phase, setPhase] = useState<TransactionPhase>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [resolveHash, setResolveHash] = useState<Hash | undefined>()

  // Write hook for resolve
  const resolveWrite = useWriteContract()

  // Wait for transaction receipt
  const resolveReceipt = useWaitForTransactionReceipt({
    hash: resolveHash,
  })

  const resolveBet = useCallback(
    async (winner: Address) => {
      if (!account.address) {
        setError(new Error('Wallet not connected'))
        setPhase('error')
        return
      }

      setError(null)
      setResolveHash(undefined)

      try {
        setPhase('resolving')
        const hash = await resolveWrite.writeContractAsync({
          address: betAddress,
          abi: BET_ABI,
          functionName: 'resolve',
          args: [winner],
        })
        setResolveHash(hash)
        setPhase('waiting-resolve')

        // Wait for resolve to be confirmed
        await new Promise<void>((resolve, reject) => {
          const checkReceipt = setInterval(async () => {
            try {
              const receipt = await resolveReceipt.refetch()
              if (receipt.data?.status === 'success') {
                clearInterval(checkReceipt)
                resolve()
              } else if (receipt.data?.status === 'reverted') {
                clearInterval(checkReceipt)
                reject(new Error('Resolve transaction reverted'))
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
    },
    [account.address, betAddress, resolveWrite, resolveReceipt]
  )

  const reset = useCallback(() => {
    setPhase('idle')
    setError(null)
    setResolveHash(undefined)
    resolveWrite.reset()
  }, [resolveWrite])

  return {
    resolveBet,
    reset,
    phase,
    error,
    isIdle: phase === 'idle',
    isLoading: !['idle', 'success', 'error'].includes(phase),
    isSuccess: phase === 'success',
    isError: phase === 'error',
    resolveHash,
  }
}
