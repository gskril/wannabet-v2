import { BetStatusEnum } from '@/lib/types'

interface EnvioResponse {
  data: {
    Bet_BetCreated: Array<{
      address: string
      maker: string
      taker: string
      asset: string
      makerStake: string
      takerStake: string
      acceptBy: string
      resolveBy: string
      createdAt: number
    }>
    Bet_BetAccepted: Array<{
      address: string
    }>
    Bet_BetResolved: Array<{
      address: string
    }>
    Bet_BetCancelled: Array<{
      address: string
    }>
  }
}

const INDEXER_URL = 'https://indexer.dev.hyperindex.xyz/3a938cb/v1/graphql'

// Note: This can be done in the indexer, but since the frontend only allows USDC this is easier for now
const ASSETS = new Map<string, string>([
  ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 'USDC'],
])

export async function GET(request: Request) {
  const response = await fetch(INDEXER_URL, {
    method: 'POST',
    body: JSON.stringify({
      query: `
        {
          Bet_BetCreated {
            address
            maker
            taker
            asset
            makerStake
            takerStake
            acceptBy
            resolveBy
            createdAt
          }
          
          Bet_BetAccepted {
            address
          }
          
          Bet_BetResolved {
            address
            amount
            winner
          }
          
          Bet_BetCancelled {
            address
          }
        }
      `,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const { data }: EnvioResponse = await response.json()

  // Aggregate the data into a single array of bets
  const bets = data.Bet_BetCreated.map((bet) => {
    const accepted = !!data.Bet_BetAccepted.find(
      (accepted) => accepted.address === bet.address
    )

    const resolved = !!data.Bet_BetResolved.find(
      (resolved) => resolved.address === bet.address
    )

    const cancelled = !!data.Bet_BetCancelled.find(
      (cancelled) => cancelled.address === bet.address
    )

    // TODO: Derive the status from the other events
    let status: BetStatusEnum = BetStatusEnum.PENDING

    if (resolved) {
      status = BetStatusEnum.RESOLVED
    } else if (cancelled) {
      // If it was accepted before it was cancelled, it should be considered expired
      if (accepted) {
        // Indicates the judge didn't resolve the bet in time
        status = BetStatusEnum.EXPIRED
      } else {
        status = BetStatusEnum.CANCELLED
      }
    } else if (accepted) {
      // If the current time is after the resolveBy timestamp, it should be considered expired
      if (new Date(Number(bet.resolveBy) * 1000) < new Date()) {
        status = BetStatusEnum.EXPIRED
      } else {
        status = BetStatusEnum.ACTIVE
      }
    }

    return {
      address: bet.address,
      maker: bet.maker,
      taker: bet.taker,
      asset: {
        symbol: ASSETS.get(bet.asset),
        address: bet.asset,
      },
      makerStake: bet.makerStake,
      takerStake: bet.takerStake,
      acceptBy: bet.acceptBy,
      resolveBy: bet.resolveBy,
      createdAt: bet.createdAt,
      accepted,
      resolved,
      cancelled,
      status,
    }
  })

  return Response.json(bets)
}
