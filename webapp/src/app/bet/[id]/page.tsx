'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { Button } from '@/components/ui/button'
import { MOCK_BETS } from '@/lib/mock-data'

export default function BetPage() {
  const params = useParams()
  const id = params.id as string

  const bet = MOCK_BETS.find((b) => b.id.toLowerCase() === id.toLowerCase())

  if (!bet) {
    return (
      <div className="bg-background min-h-screen pb-20 sm:pb-4">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-wb-brown">Bet Not Found</h1>
            <p className="text-wb-taupe mt-2">
              This bet doesn&apos;t exist or has been removed.
            </p>
          </div>
        </main>
      </div>
    )
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
