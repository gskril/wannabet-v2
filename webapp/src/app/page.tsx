import { Coins, TrendingUp, Users } from 'lucide-react'

import { BetsTable } from '@/components/bets-table'
import { CreateBetDialog } from '@/components/create-bet-dialog'
import { DUMMY_BETS } from '@/lib/dummy-data'

export default function HomePage() {
  const totalBets = DUMMY_BETS.length
  const activeBets = DUMMY_BETS.filter((b) => b.status === 'active').length
  const totalVolume = DUMMY_BETS.reduce(
    (sum, bet) => sum + parseFloat(bet.amount),
    0
  ).toFixed(2)

  return (
    <div className="bg-background min-h-screen pb-20 sm:pb-4">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="mb-2 text-balance text-3xl font-bold md:text-4xl">
            WannaBet?
          </h1>
          <p className="text-muted-foreground text-pretty text-sm md:text-base">
            See what people are betting on. Create your own or join the action.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mb-8 lg:grid-cols-3">
          <div className="bg-card rounded-lg border p-4 md:p-6">
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

          <div className="bg-card rounded-lg border p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                <Users className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Active Bets
                </p>
                <p className="text-xl font-bold md:text-2xl">{activeBets}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border p-4 sm:col-span-2 md:p-6 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <Coins className="h-5 w-5 text-green-500" />
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

      <CreateBetDialog />
    </div>
  )
}
