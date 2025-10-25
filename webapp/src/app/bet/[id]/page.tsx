import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { Button } from '@/components/ui/button'
import type { Bet } from '@/lib/types'

async function fetchBets(): Promise<Bet[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const response = await fetch(`${baseUrl}/api/bets`, {
      next: { revalidate: 60 }, // Revalidate every minute
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    // Convert date strings back to Date objects
    return data.map((bet: Bet) => ({
      ...bet,
      createdAt: new Date(bet.createdAt),
      expiresAt: new Date(bet.expiresAt),
      acceptedAt: bet.acceptedAt ? new Date(bet.acceptedAt) : null,
    }))
  } catch (error) {
    console.error('Error fetching bets:', error)
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const bets = await fetchBets()
  const bet = bets.find((b) => b.id.toLowerCase() === id.toLowerCase())

  if (!bet) {
    return {
      title: 'Bet Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const imageUrl = `${baseUrl}/api/og?id=${bet.id}`

  // Mini App Embed metadata
  const miniAppEmbed = {
    version: '1',
    imageUrl: imageUrl,
    button: {
      title: 'View Bet',
      action: {
        type: 'launch_mini_app',
        name: 'wannabet',
        url: `${baseUrl}/bet/${bet.id}`,
        splashImageUrl: `${baseUrl}/img/bettingmutt.png`,
        splashBackgroundColor: '#fefce8',
      },
    },
  }

  return {
    title: `${bet.description} - WannaBet`,
    description: `${bet.maker.displayName} is betting ${bet.amount} USDC`,
    openGraph: {
      title: bet.description,
      description: `${bet.maker.displayName} is betting ${bet.amount} USDC`,
      images: [imageUrl],
    },
    other: {
      'fc:miniapp': JSON.stringify(miniAppEmbed),
      'fc:frame': JSON.stringify(miniAppEmbed), // Backward compatibility
    },
  }
}

export default async function BetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const bets = await fetchBets()
  const bet = bets.find((b) => b.id.toLowerCase() === id.toLowerCase())

  if (!bet) {
    notFound()
  }

  return (
    <div className="bg-background min-h-screen pb-20 sm:pb-4">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Feed
          </Button>
        </Link>

        <div className="mx-auto max-w-2xl">
          <BetDetailDialog
            bet={bet}
            open={true}
            onOpenChange={() => {
              // Don't allow closing on this page
            }}
          />
        </div>
      </main>
    </div>
  )
}
