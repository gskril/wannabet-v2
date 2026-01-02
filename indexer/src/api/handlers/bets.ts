import { desc } from 'ponder'
import { db } from 'ponder:api'
import schema from 'ponder:schema'

import { BetStatus, FarcasterUser, SUPPORTED_ASSETS } from '../../lib/constants'

// Raw bets from the database
export async function getBets() {
  const bets = await db
    .select()
    .from(schema.bet)
    .orderBy(desc(schema.bet.createdAt))

  return bets
}

// Create a placeholder user from an address
// TODO: Replace with real Farcaster user lookup via Neynar
function createUserFromAddress(address: string): FarcasterUser {
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

// Enriched bets with derived status, user placeholders, and asset metadata
export async function getEnrichedBets() {
  const bets = await getBets()

  return bets.map((bet) => {
    const asset = getAsset(bet.asset)
    const amount = (Number(bet.makerStake) / 10 ** asset.decimals).toString()
    const taker = createUserFromAddress(bet.taker)

    return {
      address: bet.address,
      description: bet.description,
      maker: createUserFromAddress(bet.maker),
      taker,
      judge: createUserFromAddress(bet.judge),
      asset,
      amount,
      status: deriveBetStatus(bet),
      createdAt: toMs(bet.createdAt),
      expiresAt: toMs(bet.endsBy),
      acceptBy: toMs(bet.acceptBy),
      judgeDeadline: toMs(bet.judgeDeadline),
      winner: bet.winner ? createUserFromAddress(bet.winner) : null,
      acceptedAt: bet.acceptedAt ? toMs(bet.acceptedAt) : null,
      acceptedBy: bet.acceptedAt ? taker : null,
    }
  })
}
