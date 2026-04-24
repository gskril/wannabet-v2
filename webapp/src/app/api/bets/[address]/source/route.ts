import { NextRequest, NextResponse } from 'next/server'

const VALID_SOURCES = new Set(['fc', 'x', 'web'])

// TODO: persist source overrides to a database (e.g. Vercel KV or Neon)
// For now this is a no-op — source is detected from tx.to in the subgraph,
// which correctly maps factory calls to 'fc'. Web dapp overrides can be
// wired up once a persistent store is in place.
export async function POST(request: NextRequest) {
  const body = await request.json()
  const source = body?.source

  if (!source || !VALID_SOURCES.has(source)) {
    return NextResponse.json(
      { error: 'Invalid source. Must be one of: fc, x, web' },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true })
}
