import { useQuery } from '@tanstack/react-query'

import { MOCK_BETS } from '@/lib/mock-data'
import type { Bet } from '@/lib/types'

export function useBets() {
  return useQuery({
    queryKey: ['bets'],
    queryFn: (): Bet[] => {
      // TODO: Replace with real data fetching
      return MOCK_BETS
    },
  })
}
