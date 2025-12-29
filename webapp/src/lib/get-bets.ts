import { Address, formatUnits } from 'viem'

import type { FarcasterUsersByAddressesResult } from '@/lib/neynar'
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
      amount: string
      winner: Address
    }>
    Bet_BetCancelled: Array<{
      address: Address
    }>
  }
}

const INDEXER_URL = 'https://indexer.dev.hyperindex.xyz/f61e3ca/v1/graphql'

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

export async function getBets(): Promise<BetResponse> {
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
            description
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

  if (!response.ok) {
    console.error('Failed to fetch bets', response.status, response.statusText)
    return { error: 'Failed to fetch bets' }
  }

  const { data }: EnvioResponse = await response.json()

  // Extract unique addresses to resolve to Farcaster users (include judge and winners)
  const uniqueAddresses = new Set<string>()
  data.Bet_BetCreated.forEach((bet) => {
    uniqueAddresses.add(bet.maker.toLowerCase())
    uniqueAddresses.add(bet.taker.toLowerCase())
    uniqueAddresses.add(bet.judge.toLowerCase())
  })

  // Add winner addresses
  data.Bet_BetResolved.forEach((resolved) => {
    if (resolved.winner) {
      uniqueAddresses.add(resolved.winner.toLowerCase())
    }
  })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  // Fetch user data for all addresses
  let userMap: Record<string, FarcasterUser> = {}
  if (uniqueAddresses.size > 0) {
    try {
      const addressList = Array.from(uniqueAddresses).join(',')

      const userResponse = await fetch(
        `${baseUrl}/api/neynar/bulk-users-by-address?addresses=${encodeURIComponent(addressList)}`
      )

      if (userResponse.ok) {
        const userData: FarcasterUsersByAddressesResult =
          await userResponse.json()
        userMap = userData.users || {}
      } else {
        console.error(
          'Failed to fetch users:',
          userResponse.status,
          userResponse.statusText
        )
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

    // If users don't have a Farcaster account, show their shortened address
    if (!makerUser) {
      const shortAddress = `${bet.maker.slice(0, 6)}...${bet.maker.slice(-4)}`
      makerUser = {
        fid: 0,
        username: shortAddress,
        displayName: shortAddress,
        pfpUrl: `${baseUrl}/fallback-pfp.png`,
        bio: '',
      }
    }

    if (!takerUser) {
      const shortAddress = `${bet.taker.slice(0, 6)}...${bet.taker.slice(-4)}`
      takerUser = {
        fid: 0,
        username: shortAddress,
        displayName: shortAddress,
        pfpUrl: `${baseUrl}/fallback-pfp.png`,
        bio: '',
      }
    }

    if (!judgeUser) {
      const shortAddress = `${bet.judge.slice(0, 6)}...${bet.judge.slice(-4)}`
      judgeUser = {
        fid: 0,
        username: shortAddress,
        displayName: shortAddress,
        pfpUrl: `${baseUrl}/fallback-pfp.png`,
        bio: '',
      }
    }

    // Convert amount from wei to USDC (6 decimals)
    const amountInUsdc = formatUnits(BigInt(bet.makerStake), asset.decimals)

    // Get winner user if bet is resolved
    let winnerUser: FarcasterUser | null = null
    if (winner && winner.winner) {
      const winnerAddress = winner.winner.toLowerCase()
      winnerUser = userMap[winnerAddress]

      // If winner doesn't have a Farcaster account, create a fallback user with their address
      if (!winnerUser) {
        const shortAddress = `${winner.winner.slice(0, 6)}...${winner.winner.slice(-4)}`
        winnerUser = {
          fid: 0,
          username: shortAddress,
          displayName: shortAddress,
          pfpUrl: `${baseUrl}/fallback-pfp.png`,
          bio: '',
        }
      }
    }

    // Calculate actual bet end date (resolveBy - 90 days grace period for judge)
    const resolveByTimestamp = Number(bet.resolveBy)
    const actualExpiresAt = new Date(
      (resolveByTimestamp - 90 * 24 * 60 * 60) * 1000
    )

    return {
      id: bet.address,
      description: bet.description,
      maker: makerUser,
      makerAddress: bet.maker,
      taker: takerUser,
      takerAddress: bet.taker,
      asset: asset,
      judge: judgeUser,
      judgeAddress: bet.judge,
      amount: amountInUsdc,
      status: mapStatus(status),
      createdAt: new Date(bet.createdAt * 1000),
      expiresAt: actualExpiresAt,
      acceptBy: new Date(Number(bet.acceptBy) * 1000),
      resolveBy: new Date(resolveByTimestamp * 1000),
      winner: winnerUser,
      acceptedBy: accepted && takerUser ? takerUser : null,
      acceptedAt: accepted ? new Date(bet.createdAt * 1000) : null, // Approximate - we don't have exact acceptance time
    } as Bet
  })

  // Sort by createdAt descending (newest first)
  bets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return { data: bets }
}

type BetResponse =
  | {
      data: Bet[]
      error?: undefined
    }
  | {
      data?: undefined
      error: string
    }
