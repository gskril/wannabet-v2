import { Configuration, NeynarAPIClient } from '@neynar/nodejs-sdk'

import { FarcasterUser } from './lib/constants'

// =============================================================================
// Neynar Client (lazy initialization)
// =============================================================================

let client: NeynarAPIClient | null = null

function getClient(): NeynarAPIClient | null {
  if (client) return client

  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) {
    return null
  }

  const config = new Configuration({ apiKey })
  client = new NeynarAPIClient(config)
  return client
}

// =============================================================================
// Types - derived from Neynar SDK
// =============================================================================

// Infer the response type from the SDK method
type BulkUsersByAddressResponse = Awaited<
  ReturnType<NeynarAPIClient['fetchBulkUsersByEthOrSolAddress']>
>

// Extract the User type from the response (Record<address, User[]>)
type NeynarUser = BulkUsersByAddressResponse[string][number]

// =============================================================================
// In-Memory Cache
// =============================================================================

interface CacheEntry {
  user: FarcasterUser
  expiresAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const userCache = new Map<string, CacheEntry>()

function getCachedUser(address: string): FarcasterUser | null {
  const entry = userCache.get(address.toLowerCase())
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    userCache.delete(address.toLowerCase())
    return null
  }
  return entry.user
}

function setCachedUser(address: string, user: FarcasterUser): void {
  userCache.set(address.toLowerCase(), {
    user,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

// =============================================================================
// User Lookup
// =============================================================================

/**
 * Convert a Neynar User to our FarcasterUser type
 */
function toFarcasterUser(address: string, neynarUser: NeynarUser | null): FarcasterUser {
  if (!neynarUser) {
    return {
      address,
      fid: null,
      username: null,
      displayName: null,
      pfpUrl: null,
    }
  }

  return {
    address,
    fid: neynarUser.fid,
    username: neynarUser.username,
    displayName: neynarUser.display_name ?? null,
    pfpUrl: neynarUser.pfp_url ?? null,
  }
}

/**
 * Fetch Farcaster users for a list of Ethereum addresses.
 * Uses in-memory cache to reduce API calls.
 * Returns a Map of address -> FarcasterUser.
 */
export async function fetchUsersByAddresses(
  addresses: string[]
): Promise<Map<string, FarcasterUser>> {
  const result = new Map<string, FarcasterUser>()
  const addressesToFetch: string[] = []

  // Check cache first
  for (const address of addresses) {
    const cached = getCachedUser(address)
    if (cached) {
      result.set(address.toLowerCase(), cached)
    } else {
      addressesToFetch.push(address)
    }
  }

  // If all addresses are cached, return early
  if (addressesToFetch.length === 0) {
    return result
  }

  // Skip API call if no API key configured
  const neynarClient = getClient()
  if (!neynarClient) {
    console.warn('NEYNAR_API_KEY not set, returning placeholder users')
    for (const address of addressesToFetch) {
      const placeholder = toFarcasterUser(address, null)
      setCachedUser(address, placeholder)
      result.set(address.toLowerCase(), placeholder)
    }
    return result
  }

  try {
    // Fetch from Neynar API
    const response = await neynarClient.fetchBulkUsersByEthOrSolAddress({
      addresses: addressesToFetch,
    })

    // Process response - it's a Record<address, User[]>
    for (const address of addressesToFetch) {
      const users = response[address.toLowerCase()]
      // Take the first user if multiple are linked to the address
      const neynarUser = users?.[0] ?? null
      const farcasterUser = toFarcasterUser(address, neynarUser)

      setCachedUser(address, farcasterUser)
      result.set(address.toLowerCase(), farcasterUser)
    }
  } catch (error: any) {
    // 404 "No users found" is expected for addresses without Farcaster accounts
    const is404 = error?.response?.status === 404
    if (!is404) {
      console.error('Failed to fetch users from Neynar:', error?.message ?? error)
    }

    // Return placeholders on error
    for (const address of addressesToFetch) {
      const placeholder = toFarcasterUser(address, null)
      setCachedUser(address, placeholder)
      result.set(address.toLowerCase(), placeholder)
    }
  }

  return result
}

/**
 * Get a single user by address. Uses the bulk lookup internally.
 */
export async function fetchUserByAddress(address: string): Promise<FarcasterUser> {
  const users = await fetchUsersByAddresses([address])
  return users.get(address.toLowerCase()) ?? toFarcasterUser(address, null)
}
