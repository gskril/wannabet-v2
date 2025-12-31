import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import { getMockUserByAddress } from '@/lib/mock-data'
import type { FarcasterUser } from '@/lib/types'

export function useFarcasterProfile(address?: Address) {
  return useQuery({
    queryKey: ['farcaster-profile', address],
    enabled: !!address,
    queryFn: (): FarcasterUser | null => {
      // TODO: Replace with real Farcaster lookup
      if (!address) return null
      return getMockUserByAddress(address)
    },
  })
}
