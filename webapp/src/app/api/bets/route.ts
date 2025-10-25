import { Address, formatUnits } from 'viem'

import {
  Asset,
  type Bet,
  type BetStatus,
  BetStatusEnum,
  type FarcasterUser,
} from '@/lib/types'

interface EnvioResponse {
  data: {
    Bet_BetCreated: Array<{
      address: Address
      maker: Address
      taker: Address
      judge: Address
      asset: Address
      makerStake: string
      takerStake: string
      acceptBy: string
      resolveBy: string
      description: string
      createdAt: number
    }>
    Bet_BetAccepted: Array<{
      address: Address
    }>
    Bet_BetResolved: Array<{
      address: Address
    }>
    Bet_BetCancelled: Array<{
      address: Address
    }>
  }
}

const INDEXER_URL = 'https://indexer.dev.hyperindex.xyz/3c35563/v1/graphql'

// Note: This should be done in the indexer, but since the frontend only allows USDC this is easier for now
const ASSETS: Asset[] = [
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    decimals: 6,
  },
]

const getAsset = (address: Address): Asset => {
  let asset = ASSETS.find((asset) => asset.address === address)

  if (!asset) {
    asset = {
      address: address,
      symbol: 'Unknown',
      decimals: 18,
    }
  }

  return asset
}

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
            judge
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

  // Extract unique addresses to resolve to Farcaster users (include judge)
  const uniqueAddresses = new Set<string>()
  data.Bet_BetCreated.forEach((bet) => {
    uniqueAddresses.add(bet.maker.toLowerCase())
    uniqueAddresses.add(bet.taker.toLowerCase())
    uniqueAddresses.add(bet.judge.toLowerCase())
  })

  const baseUrl = request.url.includes('localhost')
    ? 'http://localhost:3000'
    : request.url.split('/api/')[0]

  // Fetch user data for all addresses
  let userMap: Record<string, FarcasterUser> = {}
  if (uniqueAddresses.size > 0) {
    try {
      const addressList = Array.from(uniqueAddresses).join(',')

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
    const asset = getAsset(bet.asset)
    const accepted = !!data.Bet_BetAccepted.find(
      (accepted) => accepted.address === bet.address
    )

    const winner = data.Bet_BetResolved.find(
      (resolved) => resolved.address === bet.address
    )
    const resolved = !!winner

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
    const makerAddress = bet.maker.toLowerCase()
    let makerUser = userMap[makerAddress]
    const takerAddress = bet.taker.toLowerCase()
    let takerUser = userMap[takerAddress]
    const judgeAddress = bet.judge.toLowerCase()
    let judgeUser = userMap[judgeAddress]

    // If users don't have a Farcaster account, return "Unknown" username
    if (!makerUser) {
      makerUser = {
        fid: 0,
        username: 'Unknown',
        displayName: 'Unknown',
        pfpUrl: `${baseUrl}/fallback-pfp.png`,
        bio: '',
      }
    }

    if (!takerUser) {
      takerUser = {
        fid: 0,
        username: 'Unknown',
        displayName: 'Unknown',
        pfpUrl: `${baseUrl}/fallback-pfp.png`,
        bio: '',
      }
    }

    // If judge address is empty or zero, treat as no judge
    let judgeField: FarcasterUser | null = null
    if (bet.judge && bet.judge !== ZERO_ADDRESS && judgeUser) {
      judgeField = judgeUser
    }

    // Convert amount from wei to USDC (6 decimals)
    const amountInUsdc = formatUnits(BigInt(bet.makerStake), asset.decimals)

    return {
      id: bet.address,
      description: bet.description,
      maker: makerUser,
      makerAddress: bet.maker,
      taker: takerUser,
      takerAddress: bet.taker,
      asset: asset,
      judge: judgeField,
      amount: amountInUsdc,
      status: mapStatus(status),
      createdAt: new Date(bet.createdAt * 1000),
      expiresAt: new Date(Number(bet.resolveBy) * 1000),
      winner: winner ? winner.address : null,
      acceptedBy: accepted && takerUser ? takerUser : null,
      acceptedAt: accepted ? new Date(bet.createdAt * 1000) : null, // Approximate - we don't have exact acceptance time
    } as Bet
  }).filter((bet): bet is Bet => bet !== null)

  return Response.json(bets)
}
