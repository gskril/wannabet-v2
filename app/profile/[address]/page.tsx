import { BetsTable } from "@/components/bets-table"
import { DUMMY_BETS, getUserStats, formatAddress } from "@/lib/dummy-data"
import { Card } from "@/components/ui/card"
import { Trophy, TrendingUp, Activity, Target, Coins, Award } from "lucide-react"
import { UserAvatar } from "@/components/user-avatar"

interface ProfilePageProps {
  params: {
    address: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const stats = getUserStats(params.address)
  const userBets = DUMMY_BETS.filter(
    (bet) => bet.creator === params.address || bet.counterparty === params.address || bet.acceptedBy === params.address,
  )

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <div className="mb-4 flex items-center gap-3">
            <UserAvatar address={params.address} size="lg" />
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold">Profile</h1>
              <p className="font-mono text-xs md:text-sm text-muted-foreground truncate">
                {formatAddress(params.address)}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 md:mb-6 grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-3">
          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-primary/20 shrink-0">
                <Activity className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Total Bets</p>
                <p className="text-xl md:text-3xl font-bold">{stats.totalBets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-warning/20 shrink-0">
                <Target className="h-5 w-5 md:h-6 md:w-6 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Active Bets</p>
                <p className="text-xl md:text-3xl font-bold">{stats.activeBets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-success/20 shrink-0">
                <Trophy className="h-5 w-5 md:h-6 md:w-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Won Bets</p>
                <p className="text-xl md:text-3xl font-bold">{stats.wonBets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-destructive/20 shrink-0">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Lost Bets</p>
                <p className="text-xl md:text-3xl font-bold">{stats.lostBets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-primary/20 shrink-0">
                <Coins className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Total Wagered</p>
                <p className="text-lg md:text-2xl font-bold truncate">{stats.totalWagered} ETH</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-success/20 shrink-0">
                <Award className="h-5 w-5 md:h-6 md:w-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm text-muted-foreground">Win Rate</p>
                <p className="text-lg md:text-2xl font-bold">{stats.winRate.toFixed(1)}%</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold">Your Bets</h2>
          <BetsTable bets={userBets} />
        </div>
      </main>
    </div>
  )
}
