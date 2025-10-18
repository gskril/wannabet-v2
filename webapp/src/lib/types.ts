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
  creator: FarcasterUser
  counterparty: FarcasterUser | null // null means open to anyone
  amount: string // in ETH
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
  totalWagered: string // in ETH
  totalWon: string // in ETH
  winRate: number
}
