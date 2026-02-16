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

  const navItems = [
    {
      key: 'notifications' as FilterType,
      icon: Bell,
      label: 'Alerts',
      badge: betsRequiringAction.length > 0 ? betsRequiringAction.length : undefined,
    },
    { key: 'my' as FilterType, icon: User, label: 'My Bets' },
    { key: 'all' as FilterType, icon: Globe, label: 'All Bets' },
  ]

  return (
    <div className="relative min-h-screen pb-20 sm:pb-4" style={{ background: '#faf5ef' }}>
      {/* Subtle radial gradient overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 20% 10%, rgba(196,101,74,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 90%, rgba(90,122,94,0.04) 0%, transparent 50%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 mx-auto max-w-[680px] px-6 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo.png"
              alt="WannaBet"
              className="h-10 w-10"
            />
            <span
              className="text-[24px] font-bold"
              style={{ letterSpacing: '-0.01em' }}
            >
              Wanna<span className="text-wb-coral">Bet</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Connect Wallet Button */}
            <div className="hidden md:block">
              <ConnectWalletButton />
            </div>

            {/* Help button */}
            <button
              onClick={() => setShowWelcome(true)}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-all hover:-translate-y-0.5"
              style={{
                background: 'rgba(139,125,107,0.08)',
                color: '#8b7d6b',
              }}
              aria-label="How it works"
            >
              <HelpCircle size={16} />
              What is this?
            </button>
          </div>
        </div>
      </header>

      {/* Segmented Control Navigation */}
      <section className="relative z-10 mx-auto max-w-[680px] px-6">
        <div
          className="mb-4 flex rounded-xl p-0.5"
          style={{ background: 'rgba(139,125,107,0.08)' }}
        >
          {navItems.map((item) => {
            const isActive = activeFilter === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActiveFilter(item.key)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[12px] font-bold transition-all"
                style={{
                  background: isActive ? 'white' : 'transparent',
                  color: isActive ? '#2d2a26' : '#8b7d6b',
                  boxShadow: isActive
                    ? '0 1px 6px rgba(139,125,107,0.15)'
                    : 'none',
                }}
              >
                <item.icon size={15} />
                {item.label}
                {item.badge && (
                  <span
                    className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                    style={{ background: '#c4654a' }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <main className="relative z-10 mx-auto max-w-[680px] px-6 py-6 md:py-8">
        {betsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-wb-taupe" />
          </div>
        ) : betsQuery.error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[15px] font-semibold text-wb-taupe">
              Error loading bets
            </div>
          </div>
        ) : filteredBets.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[15px] font-semibold text-wb-taupe">
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
