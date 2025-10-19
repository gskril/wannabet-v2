import { Activity, ArrowLeft, Coins, TrendingUp, Trophy } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { BetsTable } from '@/components/bets-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/user-avatar'
import { getBetsByUser, getUserStats } from '@/lib/dummy-data'
import type { FarcasterUser } from '@/lib/types'

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || ''
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2'

async function fetchUserProfile(fid: number): Promise<FarcasterUser | null> {
  if (!NEYNAR_API_KEY) {
    console.error('NEYNAR_API_KEY not set')
    return null
  }

  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          accept: 'application/json',
          api_key: NEYNAR_API_KEY,
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      console.error('Neynar API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const user = data.users?.[0]

    if (!user) {
      return null
    }

    return {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || '',
      bio: user.profile?.bio?.text || '',
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ fid: string }>
}): Promise<Metadata> {
  const { fid: fidString } = await params
  const fid = parseInt(fidString)

  const user = await fetchUserProfile(fid)

  if (!user) {
    return {
      title: 'User Not Found - WannaBet',
    }
  }

  return {
    title: `${user.displayName} (@${user.username}) - WannaBet`,
    description:
      user.bio || `View ${user.displayName}'s betting profile on WannaBet`,
    openGraph: {
      title: `${user.displayName} (@${user.username})`,
      description: user.bio || `Betting profile on WannaBet`,
      images: user.pfpUrl ? [user.pfpUrl] : [],
    },
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ fid: string }>
}) {
  const { fid: fidString } = await params
  const fid = parseInt(fidString)

  // Fetch real user data from Neynar
  const user = await fetchUserProfile(fid)

  if (!user) {
    notFound()
  }

  // Stats and bets still use dummy data (will be replaced with blockchain data later)
  const stats = getUserStats(fid)
  const userBets = getBetsByUser(fid)

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
