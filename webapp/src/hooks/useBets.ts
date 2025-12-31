import { useQuery } from '@tanstack/react-query'
import type { Bet } from 'indexer/types'

export function useBets() {
  return useQuery({
    queryKey: ['bets'],
    queryFn: (): Bet[] => {
      return [
        {
          address: '0x4d31f1da89faaf5b6cdc362d854f51e6b339c384',
          maker: '0x75221480873b55b5b2a574f0d906c3596891d771',
          taker: '0x716b52795a72de3309d86971428e19843d6d9a81',
          judge: '0xd37abf24c89bb36db9363da3a304a254488e1e02',
          winner: null,
          asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          makerStake: '5000000',
          takerStake: '5000000',
          acceptBy: 1762197921,
          acceptedAt: null,
          cancelledAt: null,
          resolveBy: 1769977455,
          description: 'That warplets will be worth more than today (10/27)',
          createdAt: 1761593131,
        },
        {
          address: '0x3bdd45975d86c7654a51f28abf899ddcd0b7adc5',
          maker: '0x716b52795a72de3309d86971428e19843d6d9a81',
          taker: '0x2aec130ec5156132fbb348292a90cb2f3de8a782',
          judge: '0xd37abf24c89bb36db9363da3a304a254488e1e02',
          winner: null,
          asset: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
          makerStake: '1000000',
          takerStake: '1000000',
          acceptBy: 1762073120,
          acceptedAt: null,
          cancelledAt: null,
          resolveBy: 1769330704,
          description: 'Wannabet works by the ethglobal deadline',
          createdAt: 1761468329,
        },
      ]
    },
  })
}
