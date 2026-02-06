import type { Bet, FarcasterUser } from 'indexer/types'

const INDEXER_URL = 'https://wannabet-v2-production.up.railway.app'

export async function fetchBets(): Promise<Bet[]> {
  const response = await fetch(`${INDEXER_URL}/bets`)

  if (!response.ok) {
    throw new Error(`Failed to fetch bets: ${response.status}`)
  }

  return response.json()
}

export async function fetchBetById(id: string): Promise<Bet | null> {
  const bets = await fetchBets()
  return (
    bets.find((bet) => bet.address.toLowerCase() === id.toLowerCase()) || null
  )
}

export async function fetchUserByAddress(
  address: string
): Promise<FarcasterUser> {
  const response = await fetch(`${INDEXER_URL}/user/${address}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`)
  }

  return response.json()
}
