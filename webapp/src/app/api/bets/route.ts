import {
  type Bet,
  type BetStatus,
  BetStatusEnum,
  type FarcasterUser,
} from '@/lib/types'

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

// Zero address constant
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Map blockchain status to UI status
function mapStatus(status: BetStatusEnum): BetStatus {
  switch (status) {
    case BetStatusEnum.PENDING:
      return 'open'
    case BetStatusEnum.ACTIVE:
      return 'active'
    case BetStatusEnum.RESOLVED:
      return 'completed'
    case BetStatusEnum.CANCELLED:
    case BetStatusEnum.EXPIRED:
      return 'cancelled'
    default:
      return 'open'
  }
}

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

  // Extract unique addresses to resolve to Farcaster users
  const uniqueAddresses = new Set<string>()
  data.Bet_BetCreated.forEach((bet) => {
    uniqueAddresses.add(bet.maker.toLowerCase())
    // Don't add zero address for open bets
    if (bet.taker.toLowerCase() !== ZERO_ADDRESS.toLowerCase()) {
      uniqueAddresses.add(bet.taker.toLowerCase())
    }
  })

  // Fetch user data for all addresses
  let userMap: Record<string, FarcasterUser> = {}
  if (uniqueAddresses.size > 0) {
    try {
      const addressList = Array.from(uniqueAddresses).join(',')
      const baseUrl = request.url.includes('localhost')
        ? 'http://localhost:3000'
        : request.url.split('/api/')[0]

      const userResponse = await fetch(
        `${baseUrl}/api/neynar/bulk-users-by-address?addresses=${encodeURIComponent(addressList)}`
      )

      if (userResponse.ok) {
        const userData = await userResponse.json()
        userMap = userData.users || {}
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // Transform blockchain data to UI Bet format
  const bets: Bet[] = data.Bet_BetCreated.map((bet) => {
    const accepted = !!data.Bet_BetAccepted.find(
      (accepted) => accepted.address === bet.address
    )

    const resolved = !!data.Bet_BetResolved.find(
      (resolved) => resolved.address === bet.address
    )

    const cancelled = !!data.Bet_BetCancelled.find(
      (cancelled) => cancelled.address === bet.address
    )

    // Derive the status from the events
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

    // Get user data
    const makerUser = userMap[bet.maker.toLowerCase()]
    const takerAddress = bet.taker.toLowerCase()
    const takerUser =
      takerAddress === ZERO_ADDRESS.toLowerCase() ? null : userMap[takerAddress]

    // Filter out bets where maker couldn't be resolved
    if (!makerUser) {
      return null
    }

    // For non-open bets, filter out if taker couldn't be resolved
    if (takerAddress !== ZERO_ADDRESS.toLowerCase() && !takerUser) {
      return null
    }

    // Convert amount from wei to USDC (6 decimals)
    const amountInUsdc = (Number(bet.makerStake) / 1_000_000).toString()

    return {
      id: bet.address,
      description: 'Bet details', // Placeholder for MVP
      maker: makerUser,
      taker: takerUser,
      judge: null, // Skip for MVP
      amount: amountInUsdc,
      status: mapStatus(status),
      createdAt: new Date(bet.createdAt * 1000),
      expiresAt: new Date(Number(bet.resolveBy) * 1000),
      winner: null, // Skip for MVP
      acceptedBy: accepted && takerUser ? takerUser : null,
      acceptedAt: accepted ? new Date(bet.createdAt * 1000) : null, // Approximate - we don't have exact acceptance time
    } as Bet
  }).filter((bet): bet is Bet => bet !== null)

  return Response.json(bets)
}
