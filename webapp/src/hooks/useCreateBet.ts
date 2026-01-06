'use client'

import { parseUnits, type Address } from 'viem'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'

import {
  BET_FACTORY_ABI,
  BET_FACTORY_ADDRESS,
  ERC20_ABI,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from '@/lib/contracts'

export type CreateBetParams = {
  taker: Address
  judge: Address
  amount: string
  acceptBy: Date
  endsBy: Date
  description: string
}

export function useCreateBet() {
  const account = useAccount()

  // Check current allowance
  const allowance = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: account.address ? [account.address, BET_FACTORY_ADDRESS] : undefined,
    query: { enabled: !!account.address },
  })

  // Approval transaction
  const approve = useWriteContract()
  const approveReceipt = useWaitForTransactionReceipt({ hash: approve.data })

  // Create bet transaction
  const createBet = useWriteContract()
  const createBetReceipt = useWaitForTransactionReceipt({ hash: createBet.data })

  const needsApproval = (amount: string) => {
    const amountInUnits = parseUnits(amount, USDC_DECIMALS)
    return (allowance.data ?? BigInt(0)) < amountInUnits
  }

  const submitApproval = (amount: string) => {
    const amountInUnits = parseUnits(amount, USDC_DECIMALS)
    approve.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [BET_FACTORY_ADDRESS, amountInUnits],
    })
  }

  const submitCreateBet = (params: CreateBetParams) => {
    const amountInUnits = parseUnits(params.amount, USDC_DECIMALS)
    createBet.writeContract({
      address: BET_FACTORY_ADDRESS,
      abi: BET_FACTORY_ABI,
      functionName: 'createBet',
      args: [
        params.taker,
        params.judge,
        USDC_ADDRESS,
        amountInUnits,
        amountInUnits,
        Math.floor(params.acceptBy.getTime() / 1000),
        Math.floor(params.endsBy.getTime() / 1000),
        params.description,
      ],
    })
  }

  const reset = () => {
    approve.reset()
    createBet.reset()
  }

  return {
    // Allowance
    allowance,
    needsApproval,
    refetchAllowance: allowance.refetch,

    // Approval
    approve,
    approveReceipt,
    submitApproval,

    // Create bet
    createBet,
    createBetReceipt,
    submitCreateBet,

    reset,
  }
}
