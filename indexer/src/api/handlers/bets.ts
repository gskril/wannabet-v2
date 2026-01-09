import { desc } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

import { BetStatus, FarcasterUser, SUPPORTED_ASSETS } from '../../lib/constants'
import { fetchUsersByAddresses } from '../../neynar'

// Raw bets from the database
export async function getBets() {
  const bets = await db
    .select()
    .from(schema.bet)
    .orderBy(desc(schema.bet.createdAt))

  return bets
}

// Create a placeholder user from an address
function createPlaceholderUser(address: string): FarcasterUser {
  return {
    address,
    fid: null,
    username: null,
    displayName: null,
    pfpUrl: null,
  }
}

// Determine bet status from database record
function deriveBetStatus(
  bet: Awaited<ReturnType<typeof getBets>>[number]
): BetStatus {
  const now = Math.floor(Date.now() / 1000)

  if (bet.cancelledAt) {
    return BetStatus.CANCELLED
  }
  if (bet.winner) {
    return BetStatus.RESOLVED
  }
  if (bet.acceptedAt) {
    // Bet is accepted - check if we're past endsBy (judging period)
    if (now > bet.endsBy) {
      return BetStatus.JUDGING
    }
    return BetStatus.ACTIVE
  }
  // Bet not accepted - check if acceptBy deadline has passed (expired)
  if (now > bet.acceptBy) {
    return BetStatus.CANCELLED
  }
  return BetStatus.PENDING
}

// Get asset metadata from address
function getAsset(assetAddress: string) {
  const usdc = SUPPORTED_ASSETS.USDC
  if (assetAddress.toLowerCase() === usdc.address.toLowerCase()) {
    return { ...usdc }
  }
  // Fallback for unknown assets
  return {
    address: assetAddress,
    symbol: 'UNKNOWN',
    decimals: 18,
  }
}

// Convert seconds to milliseconds for frontend date handling
function toMs(seconds: number): number {
  return seconds * 1000
}

// Enriched bets with derived status, Farcaster user data, and asset metadata
export async function getEnrichedBets() {
  const bets = await getBets()

  // Collect all unique addresses to fetch
  const allAddresses = new Set<string>()
  for (const bet of bets) {
    allAddresses.add(bet.maker)
    allAddresses.add(bet.taker)
    allAddresses.add(bet.judge)
    if (bet.winner) {
      allAddresses.add(bet.winner)
    }
  }

  // Fetch all users in a single batch
  const usersMap = await fetchUsersByAddresses([...allAddresses])

  // Helper to get user from map or create placeholder
  const getUser = (address: string): FarcasterUser =>
    usersMap.get(address.toLowerCase()) ?? createPlaceholderUser(address)

  return bets.map((bet) => {
    const asset = getAsset(bet.asset)
    const amount = (Number(bet.makerStake) / 10 ** asset.decimals).toString()
    const taker = getUser(bet.taker)

    return {
      address: bet.address,
      description: bet.description,
      maker: getUser(bet.maker),
      taker,
      judge: getUser(bet.judge),
      asset,
      amount,
      status: deriveBetStatus(bet),
      createdAt: toMs(bet.createdAt),
      expiresAt: toMs(bet.endsBy),
      acceptBy: toMs(bet.acceptBy),
      judgeDeadline: toMs(bet.judgeDeadline),
      winner: bet.winner ? getUser(bet.winner) : null,
      acceptedAt: bet.acceptedAt ? toMs(bet.acceptedAt) : null,
      acceptedBy: bet.acceptedAt ? taker : null,
    }
  })
}
