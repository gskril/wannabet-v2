import type { Bet as IndexerBet } from 'indexer/types'

import type { Bet, BetStatus, FarcasterUser } from './types'

// TODO: Update this URL when deployed to production
const INDEXER_URL = 'https://start-bets-endpoint-wannabet-v2.marble.live'

// Create a placeholder user from an address
// TODO: Replace with real Farcaster user lookup
function createUserFromAddress(address: string): FarcasterUser {
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`
  return {
    fid: 0, // Unknown FID
    username: shortAddr,
    displayName: shortAddr,
    pfpUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
  }
}

// Determine bet status from indexer data
function getBetStatus(bet: IndexerBet): BetStatus {
  if (bet.cancelledAt) {
    return 'cancelled'
  }
  if (bet.winner) {
    return 'completed'
  }
  if (bet.acceptedAt) {
    return 'active'
  }
  return 'open'
}

// Transform indexer bet to UI bet
function transformBet(indexerBet: IndexerBet): Bet {
  const status = getBetStatus(indexerBet)
  const makerUser = createUserFromAddress(indexerBet.maker)
  const takerUser = createUserFromAddress(indexerBet.taker)
  const judgeUser = createUserFromAddress(indexerBet.judge)

  // Calculate amount in USDC (6 decimals)
  const amount = (Number(indexerBet.makerStake) / 1e6).toString()

  // Calculate expiresAt from resolveBy (resolveBy = expiresAt + 90 days)
  const resolveByMs = indexerBet.resolveBy * 1000
  const expiresAtMs = resolveByMs - 90 * 24 * 60 * 60 * 1000

  return {
    id: indexerBet.address,
    description: indexerBet.description,
    maker: makerUser,
    makerAddress: indexerBet.maker,
    taker: takerUser,
    takerAddress: indexerBet.taker,
    judge: judgeUser,
    judgeAddress: indexerBet.judge,
    asset: {
      address: indexerBet.asset,
      symbol: 'USDC',
      decimals: 6,
    },
    amount,
    status,
    createdAt: new Date(indexerBet.createdAt * 1000),
    expiresAt: new Date(expiresAtMs),
    acceptBy: new Date(indexerBet.acceptBy * 1000),
    resolveBy: new Date(resolveByMs),
    winner: indexerBet.winner ? createUserFromAddress(indexerBet.winner) : null,
    acceptedBy: indexerBet.acceptedAt ? takerUser : null,
    acceptedAt: indexerBet.acceptedAt
      ? new Date(indexerBet.acceptedAt * 1000)
      : null,
  }
}

export async function fetchBets(): Promise<Bet[]> {
  const response = await fetch(`${INDEXER_URL}/bets`)

  if (!response.ok) {
    throw new Error(`Failed to fetch bets: ${response.status}`)
  }

  const bets: IndexerBet[] = await response.json()
  return bets.map(transformBet)
}

export async function fetchBetById(id: string): Promise<Bet | null> {
  // Fetch all bets and find by ID
  // TODO: Add a dedicated endpoint for single bet lookup
  const bets = await fetchBets()
  return bets.find((bet) => bet.id.toLowerCase() === id.toLowerCase()) || null
}
