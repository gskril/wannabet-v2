'use client'

import { Bell, Globe, HelpCircle, Loader2, User } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'

import { BetsTable } from '@/components/bets-table'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { WelcomeModal } from '@/components/welcome-modal'
import { useBets } from '@/hooks/useBets'
import { BetStatus, type Bet } from 'indexer/types'

type FilterType = 'all' | 'my' | 'notifications'

// Helper to check if a bet requires action from the user
function betRequiresAction(bet: Bet, userAddress: string): boolean {
  const addr = userAddress.toLowerCase()
  const needsAccept =
    bet.taker.address?.toLowerCase() === addr && bet.status === BetStatus.PENDING
  const needsJudgment =
    bet.judge.address?.toLowerCase() === addr && bet.status === BetStatus.JUDGING
  return needsAccept || needsJudgment
}
type StatusFilter = BetStatus | 'all'

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: BetStatus.PENDING, label: 'Pending' },
  { value: BetStatus.ACTIVE, label: 'Live' },
  { value: BetStatus.JUDGING, label: 'Judging' },
  { value: BetStatus.RESOLVED, label: 'Resolved' },
  { value: BetStatus.CANCELLED, label: 'Cancelled' },
]

const WELCOME_DISMISSED_KEY = 'welcomeDismissed'

const getEmptyStateMessage = (
  filter: FilterType,
  hasAddress: boolean,
  statusFilter: StatusFilter
): string => {
  if (filter === 'my') {
    if (!hasAddress) return 'Connect your wallet to see your bets'
    if (statusFilter !== 'all') {
      const label = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label
      return `No ${label?.toLowerCase()} bets where you are a participant`
    }
    return 'No bets where you are a participant'
  }
  if (filter === 'notifications') return 'No pending actions'
  if (statusFilter !== 'all') {
    const label = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label
    return `No ${label?.toLowerCase()} bets found`
  }
  return 'No bets found. Create one to get started!'
}

export default function HomePage() {
  const [showWelcome, setShowWelcome] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [visibleCount, setVisibleCount] = useState(10)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { address } = useAccount()

  const PAGE_SIZE = 10

  // Load initial state from localStorage after client mounts
  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY) === 'true'
    setShowWelcome(!dismissed)
  }, [])

  // Fetch bets data
  const betsQuery = useBets()

  // Bets requiring action (for notifications tab and badge)
  const betsRequiringAction = useMemo(() => {
    if (!betsQuery.data || !address) return []
    return betsQuery.data.filter((bet) => betRequiresAction(bet, address))
  }, [betsQuery.data, address])

  // Filter and sort bets
  const filteredBets = useMemo(() => {
    if (!betsQuery.data) return []

    // Tab filter
    let bets = betsQuery.data
    if (activeFilter === 'notifications') {
      bets = betsRequiringAction
    } else if (activeFilter === 'my') {
      if (!address) return []
      bets = bets.filter(
        (bet) =>
          bet.maker.address?.toLowerCase() === address.toLowerCase() ||
          bet.taker.address?.toLowerCase() === address.toLowerCase() ||
          bet.judge.address?.toLowerCase() === address.toLowerCase()
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      bets = bets.filter((bet) => bet.status === statusFilter)
    }

    return bets
  }, [betsQuery.data, activeFilter, address, statusFilter, betsRequiringAction])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeFilter, statusFilter])

  const visibleBets = filteredBets.slice(0, visibleCount)
  const hasMore = visibleCount < filteredBets.length

  // Infinite scroll observer
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + PAGE_SIZE)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

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
              src="/img/logo.png"
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
          onClick={() => { setActiveFilter('notifications'); setStatusFilter('all') }}
          className={`relative flex items-center justify-center rounded-full p-2 transition-colors ${
            activeFilter === 'notifications'
              ? 'bg-wb-coral text-white'
              : 'hover:bg-wb-coral/10'
          }`}
        >
          <Bell className="h-5 w-5" />
          {betsRequiringAction.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {betsRequiringAction.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveFilter('my'); setStatusFilter('all') }}
          className={`flex items-center justify-center rounded-full p-2 transition-colors ${
            activeFilter === 'my'
              ? 'bg-wb-coral text-white'
              : 'hover:bg-wb-coral/10'
          }`}
        >
          <User className="h-5 w-5" />
        </button>
        <button
          onClick={() => { setActiveFilter('all'); setStatusFilter('all') }}
          className={`flex items-center justify-center rounded-full p-2 transition-colors ${
            activeFilter === 'all'
              ? 'bg-wb-coral text-white'
              : 'hover:bg-wb-coral/10'
          }`}
        >
          <Globe className="h-5 w-5" />
        </button>
      </div>
      {/* Status Filter Pills */}
      <div className="bg-background flex items-center gap-1.5 px-4 py-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`flex-1 rounded-full py-0.5 text-xs font-medium transition-colors ${
              statusFilter === filter.value
                ? 'bg-wb-brown text-white'
                : 'bg-wb-sand text-wb-brown'
            }`}
          >
            {filter.label}
          </button>
        ))}
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
              {getEmptyStateMessage(activeFilter, !!address, statusFilter)}
            </div>
          </div>
        ) : (
          <>
            <BetsTable bets={visibleBets} />
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-wb-taupe" />
              </div>
            )}
          </>
        )}
      </main>

      <WelcomeModal open={showWelcome} onOpenChange={handleCloseWelcome} />
    </div>
  )
}
