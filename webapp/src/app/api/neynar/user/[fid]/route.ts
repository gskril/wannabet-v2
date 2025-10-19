import { NextRequest, NextResponse } from 'next/server'

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || ''
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2'

interface NeynarUser {
  fid: number
  username: string
  display_name: string
  pfp_url: string
  profile?: {
    bio?: {
      text: string
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  const { fid: fidString } = await params
  const fid = parseInt(fidString)

  if (!fid || isNaN(fid)) {
    return NextResponse.json({ error: 'Invalid FID' }, { status: 400 })
  }

  if (!NEYNAR_API_KEY) {
    console.error('NEYNAR_API_KEY not set')
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: 'User fetch failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const user: NeynarUser | undefined = data.users?.[0]

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const formattedUser = {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || '',
      bio: user.profile?.bio?.text || '',
    }

    return NextResponse.json({ user: formattedUser })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
