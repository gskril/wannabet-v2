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
  custody_address: string
}

/**
 * Fetch Farcaster users by their Ethereum addresses (server-side only)
 * Searches both custody and verified addresses
 */
export async function getFarcasterUsersByAddresses(addresses: string[]) {
  if (!NEYNAR_API_KEY) {
    throw new Error('NEYNAR_API_KEY not configured')
  }

  const addressesParam = addresses.join(',')
  const url = `${NEYNAR_BASE_URL}/farcaster/user/bulk-by-address?addresses=${encodeURIComponent(addressesParam)}`

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      api_key: NEYNAR_API_KEY,
    },
    next: { revalidate: 300 }, // Cache for 5 minutes
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(
      'Neynar API error:',
      response.status,
      response.statusText,
      errorText
    )
    throw new Error(`User fetch failed: ${response.status}`)
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

  return { users: userMap }
}

// Export the return type for use in other files
export type FarcasterUsersByAddressesResult = Awaited<
  ReturnType<typeof getFarcasterUsersByAddresses>
>

/**
 * Fetch user data by FID (client-side safe)
 */
export async function getUserByFid(fid: number): Promise<FarcasterUser | null> {
  try {
    const response = await fetch(`/api/neynar/user/${fid}`)

    if (!response.ok) {
      console.error('User fetch API error:', response.status)
      return null
    }

    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Error fetching user by FID:', error)
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
