import { useQuery } from '@tanstack/react-query'

import type { Bet } from '@/lib/types'

export function useBets() {
  return useQuery({
    queryKey: ['bets'],
    queryFn: async () => {
      const res = await fetch('/api/bets')

      if (!res.ok) {
        throw new Error('Failed to fetch bets')
      }

      const json: Bet[] = await res.json()

      const betsWithDates = json.map((bet: Bet) => ({
        ...bet,
        createdAt: new Date(bet.createdAt),
        expiresAt: new Date(bet.expiresAt),
        acceptedAt: bet.acceptedAt ? new Date(bet.acceptedAt) : null,
      }))

      return betsWithDates
    },
  })
}
