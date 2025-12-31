import type { Context as MiniAppContext } from '@farcaster/miniapp-core'

// Comes from IBet.sol
export enum BetStatusEnum {
  PENDING = 'pending',
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

// TODO: We should probably pick 1 set of statuses and use that everywhere
export type BetStatus = 'open' | 'active' | 'completed' | 'cancelled'

export interface FarcasterUser extends MiniAppContext.UserContext {
  fid: number
  bio?: string
}

export interface Asset {
  address: string
  symbol: string
  decimals: number
}

export interface Bet {
  id: string
  description: string
  maker: FarcasterUser // bet creator (smart contract terminology)
  makerAddress: string // Ethereum address of maker
  taker: FarcasterUser
  takerAddress: string
  judge: FarcasterUser
  judgeAddress: string
  asset: Asset
  amount: string // in USDC
  status: BetStatus
  createdAt: Date
  expiresAt: Date // actual bet end date
  acceptBy: Date // deadline for taker to accept
  resolveBy: Date // deadline for judge to resolve
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
