'use client'

import { Bell, Globe, HelpCircle, Loader2, User } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'

import { BetDetailDialog } from '@/components/bet-detail-dialog'
import { BetsTable } from '@/components/bets-table'
import { ConnectWalletButton } from '@/components/connect-wallet-button'
import { WelcomeModal } from '@/components/welcome-modal'
import { useBet } from '@/hooks/useBet'
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

export default function BetPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [showWelcome, setShowWelcome] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const { address } = useAccount()

  // Load initial state from localStorage after client mounts
  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY) === 'true'
    setShowWelcome(!dismissed)
  }, [])

  // Fetch the specific bet for the dialog
  const betQuery = useBet(id)

  // Fetch all bets for the background
  const betsQuery = useBets()

  // Bets requiring action (for notifications tab and badge)
  const betsRequiringAction = useMemo(() => {
    if (!betsQuery.data || !address) return []
    return betsQuery.data.filter((bet) => betRequiresAction(bet, address))
  }, [betsQuery.data, address])

  // Filter bets based on active filter
  const filteredBets = useMemo(() => {
    if (!betsQuery.data) return []

    switch (activeFilter) {
      case 'my':
        if (!address) return []
        return betsQuery.data.filter(
          (bet) =>
            bet.maker.address?.toLowerCase() === address.toLowerCase() ||
            bet.taker.address?.toLowerCase() === address.toLowerCase() ||
            bet.judge.address?.toLowerCase() === address.toLowerCase()
        )
      case 'notifications':
        return betsRequiringAction
      case 'all':
      default:
        return betsQuery.data
    }
  }, [betsQuery.data, activeFilter, address, betsRequiringAction])

  const handleCloseWelcome = (open: boolean) => {
    setShowWelcome(open)
    if (!open) {
      localStorage.setItem(WELCOME_DISMISSED_KEY, 'true')
    }
  }

  const handleDialogClose = () => {
    router.push('/')
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
          onClick={() => setActiveFilter('notifications')}
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
            <Loader2 className="h-8 w-8 animate-spin text-wb-coral" />
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

      {/* Bet Detail Dialog - opens on top of the feed */}
      {betQuery.isLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : betQuery.data ? (
        <BetDetailDialog
          bet={betQuery.data}
          open={true}
          onOpenChange={(open) => {
            if (!open) handleDialogClose()
          }}
        />
      ) : null}
    </div>
  )
}
