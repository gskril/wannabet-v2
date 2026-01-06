'use client'

import { type Address } from 'viem'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { BET_ABI } from '@/lib/contracts'

export function useCancelBet(betAddress: Address) {
  const cancel = useWriteContract()
  const cancelReceipt = useWaitForTransactionReceipt({ hash: cancel.data })

  const submitCancel = () => {
    cancel.writeContract({
      address: betAddress,
      abi: BET_ABI,
      functionName: 'cancel',
    })
  }

  return {
    cancel,
    cancelReceipt,
    submitCancel,
    reset: cancel.reset,
  }
}
