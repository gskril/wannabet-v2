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
        {/* Hero Section */}
        <div className="mb-8 md:mb-12">
          <div className="mb-6 flex items-center gap-3">
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

          {/* Marketing Copy */}
          <div className="bg-card rounded-lg border p-6 shadow-sm md:p-8">
            <p className="mb-6 text-pretty text-lg leading-relaxed md:text-xl">
              Challenge friends. Make bets onchain. Pick a judge to settle it.
            </p>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold md:text-3xl">
                How it works
              </h2>

              <div className="grid gap-3 sm:grid-cols-2 md:gap-4">
                <div className="flex items-start gap-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 font-semibold text-purple-600 dark:text-purple-400">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Create a bet</h3>
                    <p className="text-muted-foreground text-sm">
                      Set the terms, stake, and judge.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-semibold text-blue-600 dark:text-blue-400">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Opponent Acceepts</h3>
                    <p className="text-muted-foreground text-sm">
                      Opponent accepts the bet by depositing bet amount.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg bg-gradient-to-br from-cyan-500/10 to-green-500/10 p-4 sm:col-span-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/20 font-semibold text-green-600 dark:text-green-400">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Judge Settles</h3>
                    <p className="text-muted-foreground text-sm">
                      After the bet end date, the judge picks the winner and the
                      payouts are distributed.
                    </p>
                  </div>
                </div>
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
