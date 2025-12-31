# WannaBet Webapp - Claude Context

Peer-to-peer betting app on Farcaster + Base blockchain. Users create trustless wagers using USDC smart contract escrow.

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript, App Router
- **Web3:** wagmi 2.18, viem 2.38, Base mainnet
- **UI:** Tailwind v4, Radix UI, vaul (drawers), lucide-react icons
- **Data:** React Query, Neynar API (Farcaster users), Envio indexer (on-chain events)
- **MiniApp:** @farcaster/miniapp-sdk for Farcaster frame integration

## Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout + providers
│   ├── page.tsx             # Home - bet list with filters
│   ├── globals.css          # Tailwind + wb-* color variables
│   ├── api/
│   │   ├── bets/route.ts    # GET /api/bets
│   │   └── neynar/          # Farcaster user data endpoints
│   ├── bet/[id]/page.tsx    # Bet detail page
│   └── profile/[fid]/page.tsx
├── components/
│   ├── bets-table.tsx       # Bet list cards
│   ├── bet-detail-dialog.tsx # Full bet view + actions (Drawer)
│   ├── create-bet-dialog.tsx # Create bet form (Drawer)
│   ├── status-pennant.tsx   # Status badge component
│   ├── user-avatar.tsx      # Avatar with fallback
│   ├── user-search.tsx      # Farcaster user autocomplete
│   ├── providers/           # Theme, Wagmi, SDK providers
│   └── ui/                  # Shadcn-style Radix primitives
├── lib/
│   ├── types.ts             # Core interfaces (Bet, FarcasterUser, etc.)
│   ├── contracts.ts         # ABIs + addresses (BETFACTORY, USDC)
│   ├── get-bets.ts          # Fetch from Envio indexer + Neynar
│   ├── neynar.ts            # Neynar API functions
│   ├── wagmi-config.ts      # Wagmi/viem setup
│   └── utils.ts             # cn(), shortenAddress()
└── hooks/
    ├── useBets.ts           # React Query for bets
    └── useFarcasterProfile.ts
```

## Color Palette (wb-* tokens)

| Token | Hex | Usage |
|-------|-----|-------|
| `wb-brown` | #774e38 | Primary text |
| `wb-taupe` | #9a7b6b | Secondary text, placeholders |
| `wb-coral` | #e08e79 | Buttons, CTAs |
| `wb-sand` | #f0d4ae | Card backgrounds |
| `wb-cream` | #ede5ce | Light backgrounds |
| `wb-mint` | #72d397 | Active/Live status |
| `wb-gold` | #fcc900 | Completed/Winner |
| `wb-yellow` | #fde68b | Pending status |
| `wb-pink` | #ffa3a2 | Cancelled status |

## Status Mapping

| BetStatus | Color | Emoji | Label |
|-----------|-------|-------|-------|
| `open` | yellow | ⏳ | Pending |
| `active` | mint | 🤝 | Live |
| `completed` | gold | 🏆 | Resolved |
| `cancelled` | pink | ❌ | Not Live |

## Data Flow

```
On-chain events → Envio Indexer → /api/bets → get-bets.ts
                                      ↓
                              Neynar API (address → Farcaster user)
                                      ↓
                              useBets() React Query hook
                                      ↓
                              BetsTable component
```

## Smart Contracts (Base mainnet)

```typescript
BETFACTORY_ADDRESS = '0x0F0A585aF686397d94428825D8cCfa2589b159A0'
USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
```

**Key functions:**
- `createBet(taker, judge, asset, makerStake, takerStake, acceptBy, resolveBy, description)`
- `accept()` - Taker accepts bet
- `resolve(winner)` - Judge declares winner
- `cancel()` - Cancel before acceptance

## Key Timestamps

When creating a bet:
- `acceptBy` = now + 7 days (taker must accept)
- `expiresAt` = user-selected bet end date
- `resolveBy` = expiresAt + 90 days (judge grace period)

**Important:** `resolveBy` is what's stored on-chain. To display actual bet end date: `expiresAt = resolveBy - 90 days`

## Core Types (lib/types.ts)

```typescript
interface Bet {
  id: string              // Contract address
  description: string
  maker: FarcasterUser
  taker: FarcasterUser
  judge: FarcasterUser
  makerAddress: string
  takerAddress: string
  judgeAddress: string
  amount: string          // USDC per side
  status: BetStatus       // 'open' | 'active' | 'completed' | 'cancelled'
  createdAt: Date
  expiresAt: Date         // Actual bet end
  acceptBy: Date          // Taker deadline
  resolveBy: Date         // Judge deadline
  winner: FarcasterUser | null
}

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio: string
}
```

## Component Patterns

**Dialogs:** Use vaul `Drawer` for mobile-optimized sheets (CreateBetDialog, BetDetailDialog)

**Forms:** Local `useState` + `updateField()` pattern, `isFormValid` derived via useMemo

**User Selection:** `UserSearch` component with debounced Neynar search, excludes already-selected FIDs

**Status Display:** `StatusPennant` component for consistent badge rendering

**Winner Display:** Gold ring + small trophy overlay on avatar, grayscale on loser

## API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/bets` | All bets from indexer |
| `GET /api/neynar/user/[fid]` | User by FID |
| `GET /api/neynar/search-users?q=` | Search users |
| `GET /api/neynar/bulk-users-by-address?addresses=` | Batch address lookup |

## Environment Variables

```
NEYNAR_API_KEY              # Required - Farcaster user data
NEXT_PUBLIC_BASE_URL        # http://localhost:3000 for server-side API calls
NEXT_PUBLIC_BASE_RPC_URL    # RPC endpoint for viem/wagmi
```

## React Query Config

```typescript
staleTime: 30000              // 30 seconds
refetchOnWindowFocus: false   // Avoid MetaMask circuit breaker
retry: 1
```

## Dev Tips

- **Add color:** Edit `globals.css` @theme block, use as `bg-wb-newcolor`
- **Add API route:** Create `src/app/api/path/route.ts` with GET/POST handler
- **Contract interaction:** Import from `lib/contracts.ts`, use wagmi hooks
- **Test bet states:** Set `DEV_SIMULATE_ROLE` in bet-detail-dialog.tsx

## Conventions

- Lowercase commit messages
- Components are client components (`'use client'`)
- Drawer for forms/details, Dialog for modals
- All bet amounts in USDC (6 decimals)
