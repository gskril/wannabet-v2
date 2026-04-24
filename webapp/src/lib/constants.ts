// =============================================================================
// BetStatus
// =============================================================================
export enum BetStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  JUDGING = 'JUDGING',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
}

// =============================================================================
// Assets
// =============================================================================
export const SUPPORTED_ASSETS = {
  USDC: {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    decimals: 6,
  },
} as const

export type Asset = {
  address: string
  symbol: string
  decimals: number
}

// =============================================================================
// Farcaster
// =============================================================================
export type FarcasterUser = {
  address: string
  fid: number | null
  username: string | null
  displayName: string | null
  pfpUrl: string | null
}

// =============================================================================
// Bet
// =============================================================================
export type Bet = {
  address: string
  description: string
  maker: FarcasterUser
  taker: FarcasterUser
  judge: FarcasterUser
  asset: Asset
  amount: string // human-readable (e.g. "100")
  status: BetStatus
  source: string | null // 'fc' | 'x' | null
  createdAt: number // ms
  expiresAt: number // ms (endsBy)
  acceptBy: number // ms
  judgeDeadline: number // ms
  winner: FarcasterUser | null
  acceptedAt: number | null // ms
  acceptedBy: FarcasterUser | null
}
