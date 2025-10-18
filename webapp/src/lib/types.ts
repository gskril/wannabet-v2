export type BetStatus = 'open' | 'active' | 'completed' | 'cancelled'

export interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio?: string
}

export interface Bet {
  id: string
  description: string
  maker: FarcasterUser // bet creator (smart contract terminology)
  taker: FarcasterUser | null // specific opponent, null means open to anyone (smart contract terminology)
  judge: FarcasterUser | null // who decides the outcome
  amount: string // in USDC
  status: BetStatus
  createdAt: Date
  expiresAt: Date
  winner: FarcasterUser | null
  acceptedBy: FarcasterUser | null
  acceptedAt: Date | null
}

export interface UserStats {
  fid: number
  totalBets: number
  activeBets: number
  wonBets: number
  lostBets: number
  totalWagered: string // in USDC
  totalWon: string // in USDC
  winRate: number
}
