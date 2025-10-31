import { useQuery } from '@tanstack/react-query'
import { Address } from 'viem'

import type { FarcasterUsersByAddressesResult } from '@/lib/neynar'
import { FarcasterUser } from '@/lib/types'

export function useFarcasterProfile(address?: Address) {
  return useQuery({
    queryKey: ['farcaster-profile', address],
    enabled: !!address,
    queryFn: async (): Promise<FarcasterUser | null> => {
      if (!address) return null

      try {
        const response = await fetch(
          `/api/neynar/bulk-users-by-address?addresses=${address}`
        )

        if (!response.ok) {
          console.error('Failed to fetch Farcaster profile:', response.status)
          return null
        }

        const data: FarcasterUsersByAddressesResult = await response.json()
        // Get the user who's address is the same as the one passed in
        const user = data.users[address.toLowerCase()]
        return user || null
      } catch (error) {
        console.error('Error fetching Farcaster profile:', error)
        return null
      }
    },
  })
}
