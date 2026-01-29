import { ImageResponse } from 'next/og'
import { BetStatus, type Bet } from 'indexer/types'

export const runtime = 'edge'
export const alt = 'WannaBet'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

const INDEXER_URL = 'https://wannabet-v2-production.up.railway.app'

// Default avatar for users without a profile picture
const DEFAULT_AVATAR = 'https://warpcast.com/avatar.png'

// WannaBet brand colors
const COLORS = {
  sand: '#f0d4ae',
  brown: '#774e38',
  taupe: '#9a7b6b',
  coral: '#e08e79',
  mint: '#72d397',
  gold: '#fcc900',
  yellow: '#fde68b',
  pink: '#ffa3a2',
  lavender: '#c4b5fd',
}

// Status badge colors
const STATUS_COLORS: Record<BetStatus, string> = {
  [BetStatus.PENDING]: COLORS.yellow,
  [BetStatus.ACTIVE]: COLORS.mint,
  [BetStatus.JUDGING]: COLORS.lavender,
  [BetStatus.RESOLVED]: COLORS.gold,
  [BetStatus.CANCELLED]: COLORS.pink,
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function getUsername(user: { username: string | null; address: string } | null | undefined): string {
  if (!user) return '?'
  return user.username || shortenAddress(user.address)
}

function truncateDescription(description: string, maxLength = 80): string {
  if (description.length <= maxLength) return description
  return description.slice(0, maxLength).trim() + '...'
}

async function fetchBetById(id: string): Promise<Bet | null> {
  try {
    const response = await fetch(`${INDEXER_URL}/bets`, { next: { revalidate: 60 } })
    if (!response.ok) return null
    const bets: Bet[] = await response.json()
    return bets.find((bet) => bet.address.toLowerCase() === id.toLowerCase()) || null
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const bet = await fetchBetById(id)

  // Fallback image for missing bet
  if (!bet) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: COLORS.sand,
          }}
        >
          <div style={{ fontSize: 64, fontWeight: 700, color: COLORS.brown }}>
            WannaBet?
          </div>
          <div style={{ fontSize: 32, color: COLORS.taupe, marginTop: 16 }}>
            Bet Not Found
          </div>
        </div>
      ),
      { ...size }
    )
  }

  const maker = bet.maker
  const taker = bet.acceptedBy || bet.taker
  const makerAvatar = maker.pfpUrl || DEFAULT_AVATAR
  const takerAvatar = taker?.pfpUrl || DEFAULT_AVATAR

  // Determine winner/loser for styling
  const isResolved = bet.status === BetStatus.RESOLVED && bet.winner
  const makerWon = isResolved && bet.winner?.address?.toLowerCase() === maker.address?.toLowerCase()
  const takerWon = isResolved && bet.winner?.address?.toLowerCase() === taker?.address?.toLowerCase()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          backgroundColor: COLORS.sand,
          padding: 48,
        }}
      >
        {/* Header */}
        <div style={{ fontSize: 48, fontWeight: 700, color: COLORS.brown }}>
          WannaBet?
        </div>

        {/* Avatars Section */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 48,
          }}
        >
          {/* Maker */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                overflow: 'hidden',
                border: makerWon ? `6px solid ${COLORS.gold}` : `4px solid ${COLORS.coral}`,
                boxShadow: makerWon ? `0 0 20px ${COLORS.gold}` : 'none',
                filter: takerWon ? 'grayscale(100%)' : 'none',
                display: 'flex',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={makerAvatar}
                alt=""
                width={140}
                height={140}
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div style={{ fontSize: 24, color: COLORS.brown, fontWeight: 600 }}>
              @{getUsername(maker)}
            </div>
          </div>

          {/* VS Badge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.coral,
              borderRadius: 16,
              padding: '16px 32px',
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 700, color: 'white' }}>VS</div>
          </div>

          {/* Taker */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                overflow: 'hidden',
                border: takerWon ? `6px solid ${COLORS.gold}` : `4px solid ${COLORS.coral}`,
                boxShadow: takerWon ? `0 0 20px ${COLORS.gold}` : 'none',
                filter: makerWon ? 'grayscale(100%)' : 'none',
                display: 'flex',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={takerAvatar}
                alt=""
                width={140}
                height={140}
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div style={{ fontSize: 24, color: COLORS.brown, fontWeight: 600 }}>
              @{getUsername(taker)}
            </div>
          </div>
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 28,
            color: COLORS.brown,
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          &quot;{truncateDescription(bet.description)}&quot;
        </div>

        {/* Footer with Amount and Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
          }}
        >
          {/* Amount */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'white',
              borderRadius: 12,
              padding: '12px 24px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png"
              alt="USDC"
              width={32}
              height={32}
            />
            <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.brown }}>
              {bet.amount} USDC
            </div>
            <div style={{ fontSize: 18, color: COLORS.taupe }}>each</div>
          </div>

          {/* Status Badge */}
          <div
            style={{
              display: 'flex',
              backgroundColor: STATUS_COLORS[bet.status as BetStatus],
              borderRadius: 12,
              padding: '12px 24px',
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.brown }}>
              {bet.status}
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
