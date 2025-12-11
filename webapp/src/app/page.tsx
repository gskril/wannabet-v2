'use client'

import { HelpCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'

import { BetsTable } from '@/components/bets-table'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { WelcomeModal } from '@/components/welcome-modal'
import { useBets } from '@/hooks/useBets'

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false)
  const { isConnected } = useAccount()

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
      {/* Top Navbar - full width */}
      <div className="bg-wb-brown">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/bettingmutt.png"
              alt="WannaBet"
              className="h-16 w-16 md:h-20 md:w-20"
            />
            <div>
              <h1 className="text-balance text-3xl font-bold text-white md:text-4xl">
                WannaBet?
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Connect Wallet Button */}
            <div className="hidden md:block">
              <ConnectWalletButton />
            </div>

            {/* Help button */}
            <button
              onClick={() => setShowWelcome(true)}
              className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-70"
              aria-label="How it works"
            >
              <HelpCircle className="h-8 w-8 text-white" />
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 md:py-8">
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
