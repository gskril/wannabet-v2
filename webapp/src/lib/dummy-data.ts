import type { Bet, FarcasterUser, UserStats } from './types'

// Mock Farcaster users
export const FARCASTER_USERS: Record<number, FarcasterUser> = {
  3: {
    fid: 3,
    username: 'dwr',
    displayName: 'Dan Romero',
    pfpUrl: 'https://i.imgur.com/4JRQhYH.jpg',
    bio: 'Building Farcaster',
  },
  2: {
    fid: 2,
    username: 'v',
    displayName: 'Varun Srinivasan',
    pfpUrl: 'https://i.imgur.com/gF0JXKj.jpg',
    bio: 'Protocol engineer',
  },
  6841: {
    fid: 6841,
    username: 'ted',
    displayName: 'Ted',
    pfpUrl: 'https://i.imgur.com/pV1bQWK.jpg',
    bio: 'Crypto enthusiast',
  },
  1234: {
    fid: 1234,
    username: 'alice',
    displayName: 'Alice',
    pfpUrl: 'https://i.imgur.com/oC0GlSQ.jpg',
    bio: 'DeFi lover',
  },
  5678: {
    fid: 5678,
    username: 'bob',
    displayName: 'Bob the Builder',
    pfpUrl: 'https://i.imgur.com/s7dCKXo.jpg',
    bio: 'Always betting on Web3',
  },
}

export const DUMMY_BETS: Bet[] = [
  {
    id: '1',
    description: 'Bob will lose 10 lbs by October 1st',
    creator: FARCASTER_USERS[5678],
    counterparty: FARCASTER_USERS[1234],
    amount: '0.5',
    status: 'active',
    createdAt: new Date('2025-01-10'),
    expiresAt: new Date('2025-10-01'),
    winner: null,
    acceptedBy: FARCASTER_USERS[1234],
    acceptedAt: new Date('2025-01-11'),
  },
  {
    id: '2',
    description: 'Dan will ship a new feature before Varun does',
    creator: FARCASTER_USERS[3],
    counterparty: FARCASTER_USERS[2],
    amount: '1.2',
    status: 'active',
    createdAt: new Date('2025-01-15'),
    expiresAt: new Date('2025-02-15'),
    winner: null,
    acceptedBy: FARCASTER_USERS[2],
    acceptedAt: new Date('2025-01-15'),
  },
  {
    id: '3',
    description: 'Ted will finish his side project by end of month',
    creator: FARCASTER_USERS[6841],
    counterparty: FARCASTER_USERS[3],
    amount: '0.8',
    status: 'open',
    createdAt: new Date('2025-01-08'),
    expiresAt: new Date('2025-01-31'),
    winner: null,
    acceptedBy: null,
    acceptedAt: null,
  },
  {
    id: '4',
    description: 'Alice will go to the gym 5 days this week',
    creator: FARCASTER_USERS[1234],
    counterparty: FARCASTER_USERS[5678],
    amount: '0.3',
    status: 'completed',
    createdAt: new Date('2025-01-06'),
    expiresAt: new Date('2025-01-12'),
    winner: FARCASTER_USERS[1234],
    acceptedBy: FARCASTER_USERS[5678],
    acceptedAt: new Date('2025-01-06'),
  },
  {
    id: '5',
    description: 'Varun will beat Dan in a coding challenge',
    creator: FARCASTER_USERS[2],
    counterparty: null,
    amount: '2.0',
    status: 'open',
    createdAt: new Date('2025-01-12'),
    expiresAt: new Date('2025-02-01'),
    winner: null,
    acceptedBy: null,
    acceptedAt: null,
  },
  {
    id: '6',
    description: 'Bob will read 3 books before Alice reads 2',
    creator: FARCASTER_USERS[5678],
    counterparty: FARCASTER_USERS[1234],
    amount: '1.5',
    status: 'active',
    createdAt: new Date('2025-01-03'),
    expiresAt: new Date('2025-03-01'),
    winner: null,
    acceptedBy: FARCASTER_USERS[1234],
    acceptedAt: new Date('2025-01-04'),
  },
  {
    id: '7',
    description: 'Ted will run a 5K faster than Dan',
    creator: FARCASTER_USERS[6841],
    counterparty: FARCASTER_USERS[3],
    amount: '0.4',
    status: 'completed',
    createdAt: new Date('2024-12-28'),
    expiresAt: new Date('2025-01-15'),
    winner: FARCASTER_USERS[6841],
    acceptedBy: FARCASTER_USERS[3],
    acceptedAt: new Date('2024-12-29'),
  },
  {
    id: '8',
    description: 'Alice will cook dinner 4 times this week',
    creator: FARCASTER_USERS[1234],
    counterparty: null,
    amount: '0.6',
    status: 'open',
    createdAt: new Date('2025-01-15'),
    expiresAt: new Date('2025-01-22'),
    winner: null,
    acceptedBy: null,
    acceptedAt: null,
  },
  {
    id: '9',
    description: 'Bob will wake up before 6am every day for a week',
    creator: FARCASTER_USERS[5678],
    counterparty: FARCASTER_USERS[2],
    amount: '1.0',
    status: 'active',
    createdAt: new Date('2025-01-14'),
    expiresAt: new Date('2025-01-21'),
    winner: null,
    acceptedBy: FARCASTER_USERS[2],
    acceptedAt: new Date('2025-01-14'),
  },
  {
    id: '10',
    description: 'Dan will get 1000 new followers before Varun',
    creator: FARCASTER_USERS[3],
    counterparty: null,
    amount: '0.75',
    status: 'open',
    createdAt: new Date('2025-01-14'),
    expiresAt: new Date('2025-03-01'),
    winner: null,
    acceptedBy: null,
    acceptedAt: null,
  },
]

export const DUMMY_USER_STATS: Record<number, UserStats> = {
  3: {
    fid: 3,
    totalBets: 8,
    activeBets: 2,
    wonBets: 4,
    lostBets: 2,
    totalWagered: '6.8',
    totalWon: '4.2',
    winRate: 66.7,
  },
  2: {
    fid: 2,
    totalBets: 6,
    activeBets: 2,
    wonBets: 3,
    lostBets: 1,
    totalWagered: '8.5',
    totalWon: '5.1',
    winRate: 75.0,
  },
  6841: {
    fid: 6841,
    totalBets: 5,
    activeBets: 1,
    wonBets: 2,
    lostBets: 2,
    totalWagered: '4.3',
    totalWon: '2.1',
    winRate: 50.0,
  },
  1234: {
    fid: 1234,
    totalBets: 3,
    activeBets: 1,
    wonBets: 1,
    lostBets: 1,
    totalWagered: '2.6',
    totalWon: '1.0',
    winRate: 50.0,
  },
  5678: {
    fid: 5678,
    totalBets: 2,
    activeBets: 1,
    wonBets: 0,
    lostBets: 1,
    totalWagered: '1.5',
    totalWon: '0',
    winRate: 0,
  },
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getUserStats(fid: number): UserStats {
  return (
    DUMMY_USER_STATS[fid] || {
      fid,
      totalBets: 0,
      activeBets: 0,
      wonBets: 0,
      lostBets: 0,
      totalWagered: '0',
      totalWon: '0',
      winRate: 0,
    }
  )
}

export function getBetsByUser(fid: number): Bet[] {
  return DUMMY_BETS.filter(
    (bet) =>
      bet.creator.fid === fid ||
      bet.acceptedBy?.fid === fid ||
      bet.counterparty?.fid === fid
  )
}
