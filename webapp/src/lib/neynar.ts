import type { FarcasterUser } from './types'

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

/**
 * Fetch user data by FID
 */
export async function getUserByFid(fid: number): Promise<FarcasterUser | null> {
  if (!NEYNAR_API_KEY) {
    console.warn('NEYNAR_API_KEY not set')
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
        // Cache for 5 minutes
        next: { revalidate: 300 },
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
    console.error('Error fetching user by FID:', error)
    return null
  }
}

/**
 * Fetch multiple users by FIDs
 */
export async function getUsersByFids(fids: number[]): Promise<FarcasterUser[]> {
  if (!NEYNAR_API_KEY || fids.length === 0) {
    return []
  }

  try {
    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fids.join(',')}`,
      {
        headers: {
          accept: 'application/json',
          api_key: NEYNAR_API_KEY,
        },
        // Cache for 5 minutes
        next: { revalidate: 300 },
      }
    )

    if (!response.ok) {
      console.error('Neynar API error:', response.status, response.statusText)
      return []
    }

    const data = await response.json()
    const users: NeynarUser[] = data.users || []

    return users.map((user) => ({
      fid: user.fid,
      username: user.username,
      displayName: user.display_name || user.username,
      pfpUrl: user.pfp_url || '',
      bio: user.profile?.bio?.text || '',
    }))
  } catch (error) {
    console.error('Error fetching users by FIDs:', error)
    return []
  }
}

/**
 * Search for users (client-side)
 */
export async function searchUsers(query: string): Promise<FarcasterUser[]> {
  if (!query.trim()) {
    return []
  }

  try {
    const response = await fetch(
      `/api/neynar/search-users?q=${encodeURIComponent(query)}`
    )

    if (!response.ok) {
      console.error('Search API error:', response.status)
      return []
    }

    const data = await response.json()
    return data.users || []
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}
