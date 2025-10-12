export type BetStatus = "open" | "active" | "completed" | "cancelled"

export interface Bet {
  id: string
  description: string
  creator: string
  counterparty: string | null // null means open to anyone
  amount: string // in ETH
  status: BetStatus
  createdAt: Date
  expiresAt: Date
  winner: string | null
  acceptedBy: string | null
  acceptedAt: Date | null
}

export interface UserStats {
  address: string
  totalBets: number
  activeBets: number
  wonBets: number
  lostBets: number
  totalWagered: string // in ETH
  totalWon: string // in ETH
  winRate: number
}
