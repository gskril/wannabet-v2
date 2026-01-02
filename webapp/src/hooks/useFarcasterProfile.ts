import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import type { FarcasterUser } from 'indexer/types'

// Create a placeholder user from an address
function createUserFromAddress(address: string): FarcasterUser {
  return {
    address,
    fid: null,
    username: null,
    displayName: null,
    pfpUrl: null,
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
