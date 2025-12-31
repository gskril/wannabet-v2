import { useQuery } from '@tanstack/react-query'
import { Address } from 'viem'

import type { FarcasterUser } from '@/lib/types'

export function useFarcasterProfile(address?: Address) {
  return useQuery({
    queryKey: ['farcaster-profile', address],
    enabled: !!address,
    queryFn: (): FarcasterUser | null => {
      return null
    },
  })
}
