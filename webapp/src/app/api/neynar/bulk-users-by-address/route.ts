import { NextRequest, NextResponse } from 'next/server'

import { getFarcasterUsersByAddresses } from '@/lib/neynar'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const addresses = searchParams.get('addresses')

  if (!addresses) {
    return NextResponse.json(
      { error: 'addresses parameter is required' },
      { status: 400 }
    )
  }

  try {
    const addressArray = addresses.split(',').map((a) => a.trim())
    const result = await getFarcasterUsersByAddresses(addressArray)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching users by address:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error'

    if (errorMessage.includes('not configured')) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    if (errorMessage.includes('User fetch failed')) {
      return NextResponse.json({ error: 'User fetch failed' }, { status: 502 })
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
