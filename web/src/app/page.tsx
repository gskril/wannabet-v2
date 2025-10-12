import { Coins, TrendingUp, Users } from 'lucide-react'

import { BetsTable } from '@/components/bets-table'
import { DUMMY_BETS } from '@/lib/dummy-data'

export default function HomePage() {
  const totalBets = DUMMY_BETS.length
  const activeBets = DUMMY_BETS.filter((b) => b.status === 'active').length
  const totalVolume = DUMMY_BETS.reduce(
    (sum, bet) => sum + Number.parseFloat(bet.amount),
    0
  ).toFixed(2)

  return (
    <div className="bg-background min-h-screen">
      <main className="container mx-auto px-4 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h1 className="mb-2 text-balance text-2xl font-bold md:text-4xl">
            Bet Feed
          </h1>
          <p className="text-muted-foreground text-pretty text-sm md:text-base">
            See what people are betting on. Create your own or join the action.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-6 md:gap-4 lg:grid-cols-3">
          <div className="border-border bg-card rounded-lg border p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-lg">
                <TrendingUp className="text-primary h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Total Bets
                </p>
                <p className="text-xl font-bold md:text-2xl">{totalBets}</p>
              </div>
            </div>
          </div>

          <div className="border-border bg-card rounded-lg border p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="bg-warning/20 flex h-10 w-10 items-center justify-center rounded-lg">
                <Users className="text-warning h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Active Bets
                </p>
                <p className="text-xl font-bold md:text-2xl">{activeBets}</p>
              </div>
            </div>
          </div>

          <div className="border-border bg-card rounded-lg border p-4 sm:col-span-2 md:p-6 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="bg-success/20 flex h-10 w-10 items-center justify-center rounded-lg">
                <Coins className="text-success h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Total Volume
                </p>
                <p className="text-xl font-bold md:text-2xl">
                  {totalVolume} ETH
                </p>
              </div>
            </div>
          </div>
        </div>

        <BetsTable bets={DUMMY_BETS} />
      </main>
    </div>
  )
}
