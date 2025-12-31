import { useQuery } from '@tanstack/react-query'

import { fetchBets } from '@/lib/indexer'
import type { Bet } from '@/lib/types'

export function useBets() {
  return useQuery<Bet[]>({
    queryKey: ['bets'],
    queryFn: fetchBets,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}
