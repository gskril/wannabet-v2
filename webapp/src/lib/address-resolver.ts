import type { Address } from 'viem'

/**
 * Resolve a Farcaster FID to an Ethereum address
 * Uses the Farcaster API to get the user's verified Ethereum address
 */
export async function resolveAddressFromFid(
  fid: number
): Promise<Address | null> {
  try {
    const response = await fetch(
      `https://api.farcaster.xyz/fc/primary-address?fid=${fid}&protocol=ethereum`
    )

    if (!response.ok) {
      console.error(
        `Failed to resolve address for FID ${fid}: ${response.status}`
      )
      return null
    }

    const data = (await response.json()) as {
      result: {
        address: {
          fid: number
          protocol: 'ethereum' | 'solana'
          address: string
        }
      }
    }

    return data.result.address.address as Address
  } catch (error) {
    console.error(`Error resolving address for FID ${fid}:`, error)
    return null
  }
}

/**
 * Get multiple addresses for FIDs in parallel
 */
export async function resolveMultipleAddresses(
  fids: number[]
): Promise<Map<number, Address | null>> {
  const results = await Promise.all(
    fids.map(async (fid) => {
      const address = await resolveAddressFromFid(fid)
      return [fid, address] as const
    })
  )

  return new Map(results)
}
