'use client'

import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { Button } from '@/components/ui/button'
import { useBet } from '@/hooks/useBet'

export default function BetPage() {
  const params = useParams()
  const id = params.id as string

  const betQuery = useBet(id)

  if (betQuery.isLoading) {
    return (
      <div className="bg-background min-h-screen pb-20 sm:pb-4">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-wb-coral" />
          </div>
        </main>
      </div>
    )
  }

  if (betQuery.error || !betQuery.data) {
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
              {betQuery.error
                ? 'Error loading bet. Please try again.'
                : "This bet doesn't exist or has been removed."}
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
            bet={betQuery.data}
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
