'use client'

import { Info } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount, useReadContract } from 'wagmi'

import { USDC_ADDRESS, USDC_DECIMALS, ERC20_ABI } from '@/lib/contracts'

export function UsdcBalance() {
  const [showInfo, setShowInfo] = useState(false)
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
    <div className="relative">
      <div className="flex items-center justify-center gap-2 rounded-lg bg-wb-sand/50 px-3 py-2">
        <Image
          src="/img/usdc.png"
          alt="USDC"
          width={20}
          height={20}
          className="rounded-full"
        />
        <span className="text-wb-brown text-sm font-medium">
          {formattedBalance} USDC
        </span>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="text-wb-taupe hover:text-wb-brown transition-colors"
          aria-label="More info about USDC"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Info Popover */}
      {showInfo && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowInfo(false)}
          />
          <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg bg-wb-brown p-4 text-white shadow-lg">
            <div className="absolute -top-2 left-1/2 h-0 w-0 -translate-x-1/2 border-8 border-transparent border-b-wb-brown" />
            <p className="text-sm font-semibold mb-2">WannaBet uses USDC on Base</p>
            <p className="text-xs text-white/80 mb-3">
              USDC is a stablecoin pegged to the US dollar. Each bet requires you to deposit USDC into a smart contract escrow until the bet is resolved.
            </p>
            <a
              href="https://wallet.farcaster.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-md bg-white px-3 py-2 text-center text-sm font-medium text-wb-brown hover:bg-white/90 transition-colors"
              onClick={() => setShowInfo(false)}
            >
              Get USDC in Farcaster Wallet
            </a>
          </div>
        </>
      )}
    </div>
  )
}
