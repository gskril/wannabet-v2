'use client'

import { useQuery } from '@tanstack/react-query'
import { HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { BetsTable } from '@/components/bets-table'
import { CreateBetDialog } from '@/components/create-bet-dialog'
import { TestBetContract } from '@/components/test-bet-contract'
import { WelcomeModal } from '@/components/welcome-modal'
import { useBets } from '@/hooks/useBets'
import type { Bet } from '@/lib/types'

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false)

  // Load initial state from localStorage after client mounts
  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeDismissed') === 'true'
    setShowWelcome(!dismissed)
  }, [])

  // Fetch bets data
  const { data: bets, isLoading: loading, error } = useBets()

  const handleCloseWelcome = (open: boolean) => {
    setShowWelcome(open)
    if (!open) {
      localStorage.setItem('welcomeDismissed', 'true')
    }
  }

  return (
    <div className="bg-background min-h-screen pb-20 sm:pb-4">
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/bettingmutt.png"
                alt="WannaBet"
                className="h-16 w-16 md:h-20 md:w-20"
              />
              <div>
                <h1 className="text-balance text-3xl font-bold md:text-4xl">
                  WannaBet?
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Help button */}
              <button
                onClick={() => setShowWelcome(true)}
                className="text-muted-foreground hover:text-foreground hover:border-primary flex h-10 w-10 items-center justify-center rounded-full border transition-colors"
                aria-label="How it works"
              >
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Test Bet Contract Section */}
        {/* <div className="mb-8">
          <TestBetContract />
        </div> */}

        {/* Bets Section */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading bets...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive">Error: {error.message}</div>
          </div>
        ) : bets && bets.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">
              No bets found. Create one to get started!
            </div>
          </div>
        ) : (
          bets && bets.length > 0 && <BetsTable bets={bets} />
        )}
      </main>

      <WelcomeModal open={showWelcome} onOpenChange={handleCloseWelcome} />
    </div>
  )
}
