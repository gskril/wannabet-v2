import type { FarcasterUser } from './types'

/**
 * Fetch user data by FID (client-side safe)
 */
export async function getUserByFid(fid: number): Promise<FarcasterUser | null> {
  try {
    const response = await fetch(`/api/neynar/user/${fid}`)

    if (!response.ok) {
      console.warn('User fetch API error:', response.status, '- API key may not be configured')
      // Return null gracefully instead of throwing
      return null
    }

    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.warn('Error fetching user by FID (API may not be configured):', error)
    return null
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
