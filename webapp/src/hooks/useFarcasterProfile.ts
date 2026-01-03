import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'

import { fetchUserByAddress } from '@/lib/indexer'

export function useFarcasterProfile(address?: Address) {
  return useQuery({
    queryKey: ['farcaster-profile', address],
    enabled: !!address,
    queryFn: () => fetchUserByAddress(address!),
  })
}
