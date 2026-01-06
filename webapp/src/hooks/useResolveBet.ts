'use client'

import { type Address } from 'viem'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { BET_ABI } from '@/lib/contracts'

export function useResolveBet(betAddress: Address) {
  const resolve = useWriteContract()
  const resolveReceipt = useWaitForTransactionReceipt({ hash: resolve.data })

  const submitResolve = (winner: Address) => {
    resolve.writeContract({
      address: betAddress,
      abi: BET_ABI,
      functionName: 'resolve',
      args: [winner],
    })
  }

  return {
    resolve,
    resolveReceipt,
    submitResolve,
    reset: resolve.reset,
  }
}
