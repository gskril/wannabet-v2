'use client'

import { Activity, ArrowLeft, Coins, TrendingUp, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import { BetsTable } from '@/components/bets-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import { MOCK_BETS, MOCK_USERS } from '@/lib/mock-data'
import type { Bet, FarcasterUser, UserStats } from '@/lib/types'

function getUserByFid(fid: number): FarcasterUser | null {
  // TODO: Replace with real user lookup
  return Object.values(MOCK_USERS).find((u) => u.fid === fid) || null
}

function getUserBets(fid: number): Bet[] {
  // TODO: Replace with real bet filtering
  return MOCK_BETS.filter(
    (bet) =>
      bet.maker.fid === fid ||
      bet.taker?.fid === fid ||
      bet.judge?.fid === fid
  )
}

function getUserStats(fid: number, userBets: Bet[]): UserStats {
  const totalBets = userBets.length
  const activeBets = userBets.filter((b) => b.status === 'active').length
  const wonBets = userBets.filter((b) => b.winner?.fid === fid).length
  const lostBets = userBets.filter(
    (b) => b.status === 'completed' && b.winner && b.winner.fid !== fid
  ).length

  const totalWagered = userBets
    .reduce((sum, bet) => sum + parseFloat(bet.amount), 0)
    .toFixed(2)

  const totalWon = userBets
    .filter((b) => b.winner?.fid === fid)
    .reduce((sum, bet) => sum + parseFloat(bet.amount) * 2, 0)
    .toFixed(2)

  const winRate =
    wonBets + lostBets > 0
      ? Math.round((wonBets / (wonBets + lostBets)) * 100)
      : 0

  return {
    fid,
    totalBets,
    activeBets,
    wonBets,
    lostBets,
    totalWagered,
    totalWon,
    winRate,
  }
}

export default function ProfilePage() {
  const params = useParams()
  const fid = parseInt(params.fid as string)

  const user = getUserByFid(fid)
  const userBets = getUserBets(fid)
  const stats = getUserStats(fid, userBets)

  if (!user) {
    return (
      <div className="bg-background min-h-screen pb-20 sm:pb-4">
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-wb-brown">User Not Found</h1>
            <p className="text-wb-taupe mt-2">
              This user doesn&apos;t exist or hasn&apos;t been indexed yet.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen pb-20 sm:pb-4">
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Feed
            </Button>
          </Link>

          <div className="flex items-start gap-4">
            <UserAvatar user={user} size="lg" clickable={false} />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{user.displayName}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
              {user.bio && (
                <p className="text-muted-foreground mt-2 text-sm">{user.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4" />
                Total Bets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalBets}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4" />
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.winRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Coins className="h-4 w-4" />
                Wagered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalWagered}</p>
              <p className="text-muted-foreground text-xs">USDC</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                <Trophy className="h-4 w-4" />
                Won
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalWon}</p>
              <p className="text-muted-foreground text-xs">USDC</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-xl font-bold">Bet History</h2>
          {userBets.length > 0 ? (
            <BetsTable bets={userBets} />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No bets yet</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
