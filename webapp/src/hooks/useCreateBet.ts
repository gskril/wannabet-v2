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
  BET_FACTORY_ABI,
  BET_FACTORY_ADDRESS,
  ERC20_ABI,
  USDC_ADDRESS,
  USDC_DECIMALS,
} from '@/lib/contracts'

export type CreateBetParams = {
  taker: Address
  judge: Address
  amount: string // Human-readable amount (e.g., "100" for 100 USDC)
  acceptBy: Date
  endsBy: Date
  description: string
}

type TransactionPhase =
  | 'idle'
  | 'checking-allowance'
  | 'approving'
  | 'waiting-approval'
  | 'creating'
  | 'waiting-creation'
  | 'success'
  | 'error'

export function useCreateBet() {
  const account = useAccount()
  const [phase, setPhase] = useState<TransactionPhase>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [approvalHash, setApprovalHash] = useState<Hash | undefined>()
  const [createHash, setCreateHash] = useState<Hash | undefined>()

  // Read current allowance
  const allowance = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: account.address ? [account.address, BET_FACTORY_ADDRESS] : undefined,
    query: { enabled: !!account.address },
  })

  // Write hooks for approval and bet creation
  const approveWrite = useWriteContract()
  const createBetWrite = useWriteContract()

  // Wait for transaction receipts
  const approvalReceipt = useWaitForTransactionReceipt({
    hash: approvalHash,
  })

  const createReceipt = useWaitForTransactionReceipt({
    hash: createHash,
  })

  const createBet = useCallback(
    async (params: CreateBetParams) => {
      if (!account.address) {
        setError(new Error('Wallet not connected'))
        setPhase('error')
        return
      }

      setError(null)
      setApprovalHash(undefined)
      setCreateHash(undefined)

      try {
        const amountInUnits = parseUnits(params.amount, USDC_DECIMALS)
        const acceptByTimestamp = Math.floor(params.acceptBy.getTime() / 1000)
        const endsByTimestamp = Math.floor(params.endsBy.getTime() / 1000)

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
            args: [BET_FACTORY_ADDRESS, amountInUnits],
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

        // Step 2: Create the bet
        setPhase('creating')
        const createTxHash = await createBetWrite.writeContractAsync({
          address: BET_FACTORY_ADDRESS,
          abi: BET_FACTORY_ABI,
          functionName: 'createBet',
          args: [
            params.taker,
            params.judge,
            USDC_ADDRESS,
            amountInUnits,
            amountInUnits, // Both maker and taker stake the same amount
            acceptByTimestamp,
            endsByTimestamp,
            params.description,
          ],
        })
        setCreateHash(createTxHash)
        setPhase('waiting-creation')

        // Wait for creation to be confirmed
        await new Promise<void>((resolve, reject) => {
          const checkReceipt = setInterval(async () => {
            try {
              const receipt = await createReceipt.refetch()
              if (receipt.data?.status === 'success') {
                clearInterval(checkReceipt)
                resolve()
              } else if (receipt.data?.status === 'reverted') {
                clearInterval(checkReceipt)
                reject(new Error('Bet creation transaction reverted'))
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
    [
      account.address,
      allowance,
      approveWrite,
      createBetWrite,
      approvalReceipt,
      createReceipt,
    ]
  )

  const reset = useCallback(() => {
    setPhase('idle')
    setError(null)
    setApprovalHash(undefined)
    setCreateHash(undefined)
    approveWrite.reset()
    createBetWrite.reset()
  }, [approveWrite, createBetWrite])

  return {
    createBet,
    reset,
    phase,
    error,
    isIdle: phase === 'idle',
    isLoading: ![
      'idle',
      'success',
      'error',
    ].includes(phase),
    isSuccess: phase === 'success',
    isError: phase === 'error',
    approvalHash,
    createHash,
  }
}
