'use client'

import { formatUnits } from 'viem'
import { useAccount, useReadContract } from 'wagmi'

import { USDC_ADDRESS, USDC_DECIMALS, ERC20_ABI } from '@/lib/contracts'

export function UsdcBalance() {
  const { address, isConnected } = useAccount()

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  })

  if (!isConnected || !address) {
    return null
  }

  const formattedBalance = balance
    ? Number(formatUnits(balance, USDC_DECIMALS)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00'

  return (
    <p className="text-wb-taupe text-xs mt-1">
      Your balance: {formattedBalance} USDC
    </p>
  )
}
