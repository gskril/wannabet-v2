'use client'

import { parseUnits, type Address } from 'viem'
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

export function useAcceptBet(betAddress: Address, amount: string) {
  const account = useAccount()
  const amountInUnits = parseUnits(amount, USDC_DECIMALS)

  // Check current allowance for the bet contract
  const allowance = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: account.address ? [account.address, betAddress] : undefined,
    query: { enabled: !!account.address },
  })

  // Approval transaction
  const approve = useWriteContract()
  const approveReceipt = useWaitForTransactionReceipt({ hash: approve.data })

  // Accept transaction
  const accept = useWriteContract()
  const acceptReceipt = useWaitForTransactionReceipt({ hash: accept.data })

  const needsApproval = () => {
    return (allowance.data ?? BigInt(0)) < amountInUnits
  }

  const submitApproval = () => {
    approve.writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [betAddress, amountInUnits],
    })
  }

  const submitAccept = () => {
    accept.writeContract({
      address: betAddress,
      abi: BET_ABI,
      functionName: 'accept',
    })
  }

  const reset = () => {
    approve.reset()
    accept.reset()
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

    // Accept
    accept,
    acceptReceipt,
    submitAccept,

    reset,
  }
}
