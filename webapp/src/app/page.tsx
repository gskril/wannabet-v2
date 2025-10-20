'use client'

import { HelpCircle } from 'lucide-react'
import { useState } from 'react'

import { BetsTable } from '@/components/bets-table'
import { CreateBetDialog } from '@/components/create-bet-dialog'
import { WelcomeModal } from '@/components/welcome-modal'
import { DUMMY_BETS } from '@/lib/dummy-data'

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(true)

  const handleGetStarted = () => {
    // Open the create bet dialog
    window.location.hash = 'create'
  }

  return (
    <div className="bg-background min-h-screen pb-20 sm:pb-4">
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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

        <BetsTable bets={DUMMY_BETS} />
      </main>

      <WelcomeModal
        open={showWelcome}
        onOpenChange={setShowWelcome}
        onGetStarted={handleGetStarted}
      />
      <CreateBetDialog />
    </div>
  )
}
