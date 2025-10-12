import { BetsTable } from "@/components/bets-table"
import { DUMMY_BETS } from "@/lib/dummy-data"
import { TrendingUp, Users, Coins } from "lucide-react"

export default function HomePage() {
  const totalBets = DUMMY_BETS.length
  const activeBets = DUMMY_BETS.filter((b) => b.status === "active").length
  const totalVolume = DUMMY_BETS.reduce((sum, bet) => sum + Number.parseFloat(bet.amount), 0).toFixed(2)

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 md:py-6">
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-4xl font-bold text-balance mb-2">Bet Feed</h1>
          <p className="text-sm md:text-base text-muted-foreground text-pretty">
            See what people are betting on. Create your own or join the action.
          </p>
        </div>

        <div className="mb-4 md:mb-6 grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Bets</p>
                <p className="text-xl md:text-2xl font-bold">{totalBets}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                <Users className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Active Bets</p>
                <p className="text-xl md:text-2xl font-bold">{activeBets}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 md:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
                <Coins className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total Volume</p>
                <p className="text-xl md:text-2xl font-bold">{totalVolume} ETH</p>
              </div>
            </div>
          </div>
        </div>

        <BetsTable bets={DUMMY_BETS} />
      </main>
    </div>
  )
}
