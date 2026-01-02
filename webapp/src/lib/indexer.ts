import type { Bet } from 'indexer/types'

const INDEXER_URL = 'https://wannabet-v2.marble.live'

export async function fetchBets(): Promise<Bet[]> {
  const response = await fetch(`${INDEXER_URL}/bets`)

  if (!response.ok) {
    throw new Error(`Failed to fetch bets: ${response.status}`)
  }

  return response.json()
}

export async function fetchBetById(id: string): Promise<Bet | null> {
  const bets = await fetchBets()
  return bets.find((bet) => bet.address.toLowerCase() === id.toLowerCase()) || null
}
