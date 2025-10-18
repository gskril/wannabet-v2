import { NextRequest } from 'next/server'

import { DUMMY_BETS } from '@/lib/dummy-data'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  const bet = DUMMY_BETS.find((b) => b.id === id)

  if (!bet) {
    return new Response('Bet not found', { status: 404 })
  }

  // For now, return a simple SVG
  // TODO: Use @vercel/og or similar for dynamic image generation
  const svg = `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="800" fill="#0a0a0a"/>
      <text x="50" y="100" font-family="Arial, sans-serif" font-size="48" fill="#ffffff" font-weight="bold">
        WannaBet?
      </text>
      <text x="50" y="250" font-family="Arial, sans-serif" font-size="32" fill="#ffffff">
        ${bet.description.length > 80 ? bet.description.substring(0, 80) + '...' : bet.description}
      </text>
      <text x="50" y="400" font-family="Arial, sans-serif" font-size="64" fill="#fbbf24" font-weight="bold">
        ${bet.amount} USDC
      </text>
      <text x="50" y="500" font-family="Arial, sans-serif" font-size="28" fill="#a3a3a3">
        by @${bet.maker.username}
      </text>
      <rect x="50" y="600" width="200" height="80" rx="10" fill="${
        bet.status === 'open'
          ? '#22c55e'
          : bet.status === 'active'
            ? '#eab308'
            : '#6b7280'
      }"/>
      <text x="150" y="650" font-family="Arial, sans-serif" font-size="28" fill="#000000" text-anchor="middle">
        ${bet.status.toUpperCase()}
      </text>
    </svg>
  `

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
