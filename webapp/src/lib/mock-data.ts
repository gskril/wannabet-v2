import type { Bet, BetStatus, FarcasterUser } from './types'

// =============================================================================
// MOCK USERS
// =============================================================================

export const MOCK_USERS: Record<string, FarcasterUser> = {
  alice: {
    fid: 1001,
    username: 'alice',
    displayName: 'Alice',
    pfpUrl: 'https://i.pravatar.cc/150?u=alice',
  },
  bob: {
    fid: 1002,
    username: 'bob',
    displayName: 'Bob',
    pfpUrl: 'https://i.pravatar.cc/150?u=bob',
  },
  charlie: {
    fid: 1003,
    username: 'charlie',
    displayName: 'Charlie the Judge',
    pfpUrl: 'https://i.pravatar.cc/150?u=charlie',
  },
  diana: {
    fid: 1004,
    username: 'diana',
    displayName: 'Diana',
    pfpUrl: 'https://i.pravatar.cc/150?u=diana',
  },
  evan: {
    fid: 1005,
    username: 'evan',
    displayName: 'Evan',
    pfpUrl: 'https://i.pravatar.cc/150?u=evan',
  },
}

// Mock addresses for users
export const MOCK_ADDRESSES: Record<string, string> = {
  alice: '0x1111111111111111111111111111111111111111',
  bob: '0x2222222222222222222222222222222222222222',
  charlie: '0x3333333333333333333333333333333333333333',
  diana: '0x4444444444444444444444444444444444444444',
  evan: '0x5555555555555555555555555555555555555555',
}

// =============================================================================
// MOCK BETS - Various states for testing UI
// =============================================================================

const USDC_ASSET = {
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  symbol: 'USDC',
  decimals: 6,
}

const now = new Date()
const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
const threeMonthsFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

export const MOCK_BETS: Bet[] = [
  // Open bet - waiting for taker to accept
  {
    id: '0x0001000100010001000100010001000100010001',
    description: 'The Lakers will win the NBA championship this season',
    maker: MOCK_USERS.alice,
    makerAddress: MOCK_ADDRESSES.alice,
    taker: MOCK_USERS.bob,
    takerAddress: MOCK_ADDRESSES.bob,
    judge: MOCK_USERS.charlie,
    judgeAddress: MOCK_ADDRESSES.charlie,
    asset: USDC_ASSET,
    amount: '50',
    status: 'open' as BetStatus,
    createdAt: lastWeek,
    expiresAt: oneMonthFromNow,
    acceptBy: oneWeekFromNow,
    resolveBy: threeMonthsFromNow,
    winner: null,
    acceptedBy: null,
    acceptedAt: null,
  },
  // Active bet - accepted, waiting for resolution
  {
    id: '0x0002000200020002000200020002000200020002',
    description: 'Bitcoin will reach $100k before end of year',
    maker: MOCK_USERS.bob,
    makerAddress: MOCK_ADDRESSES.bob,
    taker: MOCK_USERS.diana,
    takerAddress: MOCK_ADDRESSES.diana,
    judge: MOCK_USERS.charlie,
    judgeAddress: MOCK_ADDRESSES.charlie,
    asset: USDC_ASSET,
    amount: '100',
    status: 'active' as BetStatus,
    createdAt: lastWeek,
    expiresAt: oneMonthFromNow,
    acceptBy: yesterday,
    resolveBy: threeMonthsFromNow,
    winner: null,
    acceptedBy: MOCK_USERS.diana,
    acceptedAt: yesterday,
  },
  // Completed bet - Alice won
  {
    id: '0x0003000300030003000300030003000300030003',
    description: 'The new iPhone will have USB-C',
    maker: MOCK_USERS.alice,
    makerAddress: MOCK_ADDRESSES.alice,
    taker: MOCK_USERS.evan,
    takerAddress: MOCK_ADDRESSES.evan,
    judge: MOCK_USERS.diana,
    judgeAddress: MOCK_ADDRESSES.diana,
    asset: USDC_ASSET,
    amount: '25',
    status: 'completed' as BetStatus,
    createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    expiresAt: lastWeek,
    acceptBy: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000),
    resolveBy: oneMonthFromNow,
    winner: MOCK_USERS.alice,
    acceptedBy: MOCK_USERS.evan,
    acceptedAt: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000),
  },
  // Completed bet - Taker (Bob) won
  {
    id: '0x0004000400040004000400040004000400040004',
    description: 'Ethereum will flip Bitcoin market cap in 2024',
    maker: MOCK_USERS.diana,
    makerAddress: MOCK_ADDRESSES.diana,
    taker: MOCK_USERS.bob,
    takerAddress: MOCK_ADDRESSES.bob,
    judge: MOCK_USERS.alice,
    judgeAddress: MOCK_ADDRESSES.alice,
    asset: USDC_ASSET,
    amount: '200',
    status: 'completed' as BetStatus,
    createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    expiresAt: lastWeek,
    acceptBy: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000),
    resolveBy: oneWeekFromNow,
    winner: MOCK_USERS.bob,
    acceptedBy: MOCK_USERS.bob,
    acceptedAt: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000),
  },
  // Cancelled bet
  {
    id: '0x0005000500050005000500050005000500050005',
    description: 'I will run a marathon by March',
    maker: MOCK_USERS.evan,
    makerAddress: MOCK_ADDRESSES.evan,
    taker: MOCK_USERS.alice,
    takerAddress: MOCK_ADDRESSES.alice,
    judge: MOCK_USERS.bob,
    judgeAddress: MOCK_ADDRESSES.bob,
    asset: USDC_ASSET,
    amount: '75',
    status: 'cancelled' as BetStatus,
    createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    expiresAt: oneMonthFromNow,
    acceptBy: lastWeek,
    resolveBy: threeMonthsFromNow,
    winner: null,
    acceptedBy: null,
    acceptedAt: null,
  },
  // Another open bet
  {
    id: '0x0006000600060006000600060006000600060006',
    description: 'Tesla stock will be above $300 by Q2',
    maker: MOCK_USERS.charlie,
    makerAddress: MOCK_ADDRESSES.charlie,
    taker: MOCK_USERS.diana,
    takerAddress: MOCK_ADDRESSES.diana,
    judge: MOCK_USERS.evan,
    judgeAddress: MOCK_ADDRESSES.evan,
    asset: USDC_ASSET,
    amount: '150',
    status: 'open' as BetStatus,
    createdAt: yesterday,
    expiresAt: threeMonthsFromNow,
    acceptBy: oneWeekFromNow,
    resolveBy: new Date(threeMonthsFromNow.getTime() + 90 * 24 * 60 * 60 * 1000),
    winner: null,
    acceptedBy: null,
    acceptedAt: null,
  },
]

// =============================================================================
// MOCK SEARCH USERS - for user search component
// =============================================================================

export const MOCK_SEARCHABLE_USERS: FarcasterUser[] = [
  MOCK_USERS.alice,
  MOCK_USERS.bob,
  MOCK_USERS.charlie,
  MOCK_USERS.diana,
  MOCK_USERS.evan,
  {
    fid: 1006,
    username: 'frank',
    displayName: 'Frank',
    pfpUrl: 'https://i.pravatar.cc/150?u=frank',
  },
  {
    fid: 1007,
    username: 'grace',
    displayName: 'Grace Hopper',
    pfpUrl: 'https://i.pravatar.cc/150?u=grace',
  },
  {
    fid: 1008,
    username: 'henry',
    displayName: 'Henry',
    pfpUrl: 'https://i.pravatar.cc/150?u=henry',
  },
]

// =============================================================================
// HELPER: Search mock users
// =============================================================================

export function searchMockUsers(query: string): FarcasterUser[] {
  const lowerQuery = query.toLowerCase()
  return MOCK_SEARCHABLE_USERS.filter(
    (user) =>
      user.username?.toLowerCase().includes(lowerQuery) ||
      user.displayName?.toLowerCase().includes(lowerQuery)
  )
}

// =============================================================================
// HELPER: Get mock user by address
// =============================================================================

export function getMockUserByAddress(address: string): FarcasterUser | null {
  const lowerAddress = address.toLowerCase()
  for (const [username, addr] of Object.entries(MOCK_ADDRESSES)) {
    if (addr.toLowerCase() === lowerAddress) {
      return MOCK_USERS[username] || null
    }
  }
  return null
}
