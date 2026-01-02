'use client'

import { Bell, Globe, HelpCircle, User } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'

import { BetsTable } from '@/components/bets-table'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { WelcomeModal } from '@/components/welcome-modal'
import { useBets } from '@/hooks/useBets'

type FilterType = 'all' | 'my' | 'notifications'

const WELCOME_DISMISSED_KEY = 'welcomeDismissed'

const getEmptyStateMessage = (
  filter: FilterType,
  hasAddress: boolean
): string => {
  if (filter === 'my') {
    return hasAddress
      ? 'No bets where you are a participant'
      : 'Connect your wallet to see your bets'
  }
  if (filter === 'notifications') return 'No pending actions'
  return 'No bets found. Create one to get started!'
}

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const { address } = useAccount()

  // Dummy: number of pending notifications (bets requiring action)
  const pendingNotifications = 2

  // Load initial state from localStorage after client mounts
  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY) === 'true'
    setShowWelcome(!dismissed)
  }, [])

  // Fetch bets data
  const betsQuery = useBets()

  // Filter bets based on active filter
  const filteredBets = useMemo(() => {
    if (!betsQuery.data) return []

    switch (activeFilter) {
      case 'my':
        // Show bets where user is maker, taker, or judge
        if (!address) return []
        return betsQuery.data.filter(
          (bet) =>
            bet.maker.address?.toLowerCase() === address.toLowerCase() ||
            bet.taker.address?.toLowerCase() === address.toLowerCase() ||
            bet.judge.address?.toLowerCase() === address.toLowerCase()
        )
      case 'notifications':
        // Dummy: for now just show first 2 bets as "requiring action"
        return betsQuery.data.slice(0, 2)
      case 'all':
      default:
        return betsQuery.data
    }
  }, [betsQuery.data, activeFilter, address])

  const handleCloseWelcome = (open: boolean) => {
    setShowWelcome(open)
    if (!open) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, 'true')
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
      {/* Filter Navigation Bar */}
      <div className="bg-background flex items-center justify-center gap-6 border-b px-4 py-4">
        <button
          onClick={() => setActiveFilter('notifications')}
          className={`relative flex items-center justify-center rounded-full p-2 transition-colors ${
            activeFilter === 'notifications'
              ? 'bg-wb-coral text-white'
              : 'hover:bg-wb-coral/10'
          }`}
        >
          <Bell className="h-5 w-5" />
          {pendingNotifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {pendingNotifications}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveFilter('my')}
          className={`flex items-center justify-center rounded-full p-2 transition-colors ${
            activeFilter === 'my'
              ? 'bg-wb-coral text-white'
              : 'hover:bg-wb-coral/10'
          }`}
        >
          <User className="h-5 w-5" />
        </button>
        <button
          onClick={() => setActiveFilter('all')}
          className={`flex items-center justify-center rounded-full p-2 transition-colors ${
            activeFilter === 'all'
              ? 'bg-wb-coral text-white'
              : 'hover:bg-wb-coral/10'
          }`}
        >
          <Globe className="h-5 w-5" />
        </button>
      </div>
      <main className="container mx-auto px-4 py-6 md:py-8">
        {betsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading bets...</div>
          </div>
        ) : betsQuery.error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive">Error: {betsQuery.error.message}</div>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">
              {getEmptyStateMessage(activeFilter, !!address)}
            </div>
          </div>
        ) : (
          <BetsTable bets={filteredBets} />
        )}
      </main>

      <WelcomeModal open={showWelcome} onOpenChange={handleCloseWelcome} />
    </div>
  )
}
