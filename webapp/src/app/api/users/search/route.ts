import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] })
  }

  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) {
    console.error('NEYNAR_API_KEY not set')
    return NextResponse.json({ users: [], error: 'API key not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          accept: 'application/json',
          api_key: apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Neynar API error:', response.status, errorText)
      return NextResponse.json({ users: [], error: 'Search failed' }, { status: response.status })
    }

    const data = await response.json()

    const users = data.result?.users?.map((user: {
      fid: number
      username: string
      display_name: string
      pfp_url: string
      verified_addresses?: { eth_addresses?: string[] }
    }) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      address: user.verified_addresses?.eth_addresses?.[0] || null,
    })) || []

    return NextResponse.json({ users })
  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json({ users: [], error: 'Search failed' }, { status: 500 })
  }
}
