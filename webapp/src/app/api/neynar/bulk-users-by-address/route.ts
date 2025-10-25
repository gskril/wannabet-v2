import { NextRequest, NextResponse } from 'next/server'

import type { FarcasterUser } from '@/lib/types'

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
  custody_address: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const addresses = searchParams.get('addresses')

  if (!addresses) {
    return NextResponse.json(
      { error: 'addresses parameter is required' },
      { status: 400 }
    )
  }

  if (!NEYNAR_API_KEY) {
    console.error('NEYNAR_API_KEY not set')
    return NextResponse.json(
      { error: 'API key not configured' },
      { status: 500 }
    )
  }

  try {
    // Search both custody and verified addresses
    // Note: Custody addresses are 1:1, verified addresses can have multiple users
    const url = `${NEYNAR_BASE_URL}/farcaster/user/bulk-by-address?addresses=${encodeURIComponent(addresses)}`

    const response = await fetch(url, {
      headers: {
        accept: 'application/json',
        api_key: NEYNAR_API_KEY,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error('Neynar API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('Error details:', errorText)
      return NextResponse.json(
        { error: 'User fetch failed' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Transform to a map of address -> FarcasterUser
    const userMap: Record<string, FarcasterUser> = {}

    // Neynar returns users grouped by address in the format:
    // { [address]: [User] }
    for (const [address, users] of Object.entries(data)) {
      const userList = users as NeynarUser[]
      if (userList && userList.length > 0) {
        // If multiple users (verified address), take the first one
        // For custody addresses, there will only be one
        const user = userList[0]
        userMap[address.toLowerCase()] = {
          fid: user.fid,
          username: user.username,
          displayName: user.display_name || user.username,
          pfpUrl: user.pfp_url || '',
          bio: user.profile?.bio?.text || '',
        }
      }
    }

    return NextResponse.json({ users: userMap })
  } catch (error) {
    console.error('Error fetching users by address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
