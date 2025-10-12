import {
  Activity,
  Award,
  Coins,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'

import { BetsTable } from '@/components/bets-table'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import { DUMMY_BETS, formatAddress, getUserStats } from '@/lib/dummy-data'

interface ProfilePageProps {
  params: {
    address: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const stats = getUserStats(params.address)
  const userBets = DUMMY_BETS.filter(
    (bet) =>
      bet.creator === params.address ||
      bet.counterparty === params.address ||
      bet.acceptedBy === params.address
  )

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <div className="mb-4 flex items-center gap-3">
            <UserAvatar address={params.address} size="lg" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold md:text-3xl">Profile</h1>
              <p className="text-muted-foreground truncate font-mono text-xs md:text-sm">
                {formatAddress(params.address)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:gap-4 lg:grid-cols-3">
          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:h-12 md:w-12">
                <Activity className="text-primary h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs md:text-sm">
                  Total Bets
                </p>
                <p className="text-xl font-bold md:text-3xl">
                  {stats.totalBets}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-warning/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:h-12 md:w-12">
                <Target className="text-warning h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs md:text-sm">
                  Active Bets
                </p>
                <p className="text-xl font-bold md:text-3xl">
                  {stats.activeBets}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-success/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:h-12 md:w-12">
                <Trophy className="text-success h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs md:text-sm">
                  Won Bets
                </p>
                <p className="text-xl font-bold md:text-3xl">{stats.wonBets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-destructive/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:h-12 md:w-12">
                <TrendingUp className="text-destructive h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs md:text-sm">
                  Lost Bets
                </p>
                <p className="text-xl font-bold md:text-3xl">
                  {stats.lostBets}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-primary/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:h-12 md:w-12">
                <Coins className="text-primary h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs md:text-sm">
                  Total Wagered
                </p>
                <p className="truncate text-lg font-bold md:text-2xl">
                  {stats.totalWagered} ETH
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-success/20 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg md:h-12 md:w-12">
                <Award className="text-success h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs md:text-sm">
                  Win Rate
                </p>
                <p className="text-lg font-bold md:text-2xl">
                  {stats.winRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold md:text-2xl">Your Bets</h2>
          <BetsTable bets={userBets} />
        </div>
      </main>
    </div>
  )
}
