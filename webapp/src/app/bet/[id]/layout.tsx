import type { Metadata } from 'next'
import type { Bet } from 'indexer/types'

const INDEXER_URL = 'https://wannabet-v2-production.up.railway.app'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://wannabet.xyz'

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getUsername(user: { username: string | null; address: string } | null | undefined): string {
  if (!user) return '?'
  return user.username || shortenAddress(user.address)
}

async function fetchBetById(id: string): Promise<Bet | null> {
  try {
    const response = await fetch(`${INDEXER_URL}/bets`, { next: { revalidate: 60 } })
    if (!response.ok) return null
    const bets: Bet[] = await response.json()
    return bets.find((bet) => bet.address.toLowerCase() === id.toLowerCase()) || null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const bet = await fetchBetById(id)

  if (!bet) {
    return {
      metadataBase: new URL(BASE_URL),
      title: 'Bet Not Found - WannaBet',
      description: 'This bet could not be found.',
    }
  }

  const maker = bet.maker
  const taker = bet.acceptedBy || bet.taker
  const makerUsername = getUsername(maker)
  const takerUsername = getUsername(taker)

  const title = `@${makerUsername} vs @${takerUsername} - WannaBet`
  const description = bet.description.length > 160
    ? bet.description.slice(0, 157) + '...'
    : bet.description

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function BetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
