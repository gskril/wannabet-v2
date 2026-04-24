import {
  Bet,
  BetStatus,
  FarcasterUser,
  SUPPORTED_ASSETS,
} from '@/lib/constants'
import { fetchUsersByAddresses } from '@/lib/neynar'
import { fetchSubgraphBets, type SubgraphBet } from '@/lib/subgraph'

// =============================================================================
// Source tagging (web-app bets)
// =============================================================================

// Tags a bet's source via the internal API. Fire-and-forget — failures are non-fatal.
export async function tagBetSource(betAddress: string, source: string) {
  try {
    await fetch(`/api/bets/${betAddress.toLowerCase()}/source`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
    })
  } catch (err) {
    console.warn('Failed to tag bet source:', err)
  }
}

// =============================================================================
// User lookup (single address, used by hooks — goes through API route to keep key server-side)
// =============================================================================

export async function fetchUserByAddress(address: string): Promise<FarcasterUser> {
  const res = await fetch(`/api/users/${address}`)
  if (!res.ok) {
    return { address, fid: null, username: null, displayName: null, pfpUrl: null }
  }
  return res.json()
}

// =============================================================================
// Helpers
// =============================================================================

function createPlaceholder(address: string): FarcasterUser {
  return { address, fid: null, username: null, displayName: null, pfpUrl: null }
}

function getAsset(assetAddress: string) {
  const usdc = SUPPORTED_ASSETS.USDC
  if (assetAddress.toLowerCase() === usdc.address.toLowerCase()) {
    return { ...usdc }
  }
  return { address: assetAddress, symbol: 'UNKNOWN', decimals: 18 }
}

function deriveBetStatus(bet: SubgraphBet): BetStatus {
  const now = Math.floor(Date.now() / 1000)

  if (bet.cancelledAt) return BetStatus.CANCELLED
  if (bet.winner) return BetStatus.RESOLVED
  if (bet.acceptedAt) {
    return now > bet.endsBy ? BetStatus.JUDGING : BetStatus.ACTIVE
  }
  if (now > bet.acceptBy) return BetStatus.CANCELLED
  return BetStatus.PENDING
}

function toMs(seconds: number): number {
  return seconds * 1000
}

function enrichBet(
  bet: SubgraphBet,
  getUser: (address: string) => FarcasterUser
): Bet {
  const asset = getAsset(bet.asset)
  const amount = (Number(bet.makerStake) / 10 ** asset.decimals).toString()
  const taker = getUser(bet.taker)

  return {
    address: bet.id,
    description: bet.description,
    maker: getUser(bet.maker),
    taker,
    judge: getUser(bet.judge),
    asset,
    amount,
    status: deriveBetStatus(bet),
    source: bet.source,
    createdAt: toMs(bet.createdAt),
    expiresAt: toMs(bet.endsBy),
    acceptBy: toMs(bet.acceptBy),
    judgeDeadline: toMs(bet.judgeDeadline),
    winner: bet.winner ? getUser(bet.winner) : null,
    acceptedAt: bet.acceptedAt ? toMs(bet.acceptedAt) : null,
    acceptedBy: bet.acceptedAt ? taker : null,
  }
}

// =============================================================================
// Public API
// =============================================================================

export async function fetchBets(options?: { source?: string }): Promise<Bet[]> {
  const rawBets = await fetchSubgraphBets(options?.source)

  const allAddresses = new Set<string>()
  for (const bet of rawBets) {
    allAddresses.add(bet.maker)
    allAddresses.add(bet.taker)
    allAddresses.add(bet.judge)
    if (bet.winner) allAddresses.add(bet.winner)
  }

  const usersMap = await fetchUsersByAddresses([...allAddresses])
  const getUser = (address: string): FarcasterUser =>
    usersMap.get(address.toLowerCase()) ?? createPlaceholder(address)

  return rawBets.map((bet) => enrichBet(bet, getUser))
}

export async function fetchBetById(id: string): Promise<Bet | null> {
  // Fetch all fc bets and find by address — avoids a separate per-bet query
  const bets = await fetchBets()
  return bets.find((b) => b.address.toLowerCase() === id.toLowerCase()) ?? null
}
