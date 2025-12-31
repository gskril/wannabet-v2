import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import type { FarcasterUser } from '@/lib/types'

// Create a placeholder user from an address
function createUserFromAddress(address: string): FarcasterUser {
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`
  return {
    fid: 0,
    username: shortAddr,
    displayName: shortAddr,
    pfpUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
  }
}

export function useFarcasterProfile(address?: Address) {
  return useQuery({
    queryKey: ['farcaster-profile', address],
    enabled: !!address,
    queryFn: (): FarcasterUser | null => {
      // TODO: Replace with real Farcaster lookup via Neynar API
      if (!address) return null
      return createUserFromAddress(address)
    },
  })
}
