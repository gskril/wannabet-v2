import { NextRequest, NextResponse } from 'next/server'

import { fetchUserByAddress } from '@/lib/neynar'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params
  const user = await fetchUserByAddress(address)
  return NextResponse.json(user)
}
