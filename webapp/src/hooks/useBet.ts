import { useQuery } from '@tanstack/react-query'

import { fetchBetById } from '@/lib/indexer'
import type { Bet } from 'indexer/types'

export function useBet(id: string | undefined) {
  return useQuery<Bet | null>({
    queryKey: ['bet', id],
    queryFn: () => (id ? fetchBetById(id) : null),
    enabled: !!id,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}
