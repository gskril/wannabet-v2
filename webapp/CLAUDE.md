# WannaBet Webapp

Next.js frontend for the WannaBet peer-to-peer betting app. Runs as a Farcaster MiniApp.

## Tech Stack

- **Framework:** Next.js 16, React 19, TypeScript, App Router
- **Web3:** wagmi 2.18, viem 2.38, Base mainnet
- **UI:** Tailwind v4, Radix UI, vaul (drawers), lucide-react icons
- **Data:** React Query, Ponder indexer (direct fetch)
- **MiniApp:** @farcaster/miniapp-sdk for Farcaster frame integration

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout + providers
│   ├── page.tsx              # Home - bet list
│   ├── globals.css           # Tailwind + CSS variables
│   ├── bet/[id]/page.tsx     # Bet detail page
│   └── profile/[fid]/page.tsx
├── components/
│   ├── bets-table.tsx        # Bet list cards
│   ├── bet-detail-dialog.tsx # Full bet view + actions (Drawer)
│   ├── create-bet-dialog.tsx # Create bet form (Drawer)
│   ├── bet-status-badge.tsx  # Status badge component
│   ├── status-pennant.tsx    # Alternate status display
│   ├── user-avatar.tsx       # Avatar with fallback
│   ├── user-search.tsx       # Farcaster user autocomplete
│   ├── connect-wallet-button.tsx
│   ├── bottom-nav.tsx        # Mobile navigation
│   ├── welcome-modal.tsx
│   ├── sdk-provider.tsx      # Farcaster MiniApp context
│   ├── wagmi-provider.tsx    # Web3 provider
│   ├── theme-provider.tsx    # Light/dark theme
│   └── ui/                   # Shadcn-style Radix primitives
├── lib/
│   ├── contracts.ts          # Re-exports ABIs from shared, addresses
│   ├── indexer.ts            # Fetch from Ponder indexer
│   ├── wagmi-config.ts       # Wagmi/viem setup
│   └── utils.ts              # cn(), shortenAddress(), getUsername()
└── hooks/
    ├── useBets.ts            # React Query for all bets
    ├── useBet.ts             # React Query for single bet
    └── useFarcasterProfile.ts
```

## Color Palette

CSS variables defined in `globals.css`. Use via Tailwind classes like `bg-primary`, `text-muted`, `bg-wb-mint`.

### Theme Variables

| Variable          | Light       | Dark        | Usage               |
| ----------------- | ----------- | ----------- | ------------------- |
| `background`      | amber-50    | #0a0a0a     | Page background     |
| `foreground`      | #171717     | #fafafa     | Primary text        |
| `primary`         | amber-400   | amber-400   | Buttons, CTAs       |
| `accent`          | sky-400     | sky-400     | Highlights          |
| `muted`           | neutral-400 | neutral-500 | Secondary text      |
| `success`         | green-500   | green-500   | Open/pending status |
| `warning`         | yellow-500  | yellow-500  | Active status       |
| `danger`          | red-500     | red-500     | Error states        |
| `farcaster-brand` | #7f5fc7     | #7f5fc7     | Farcaster purple    |

### WannaBet Brand Colors (wb-\*)

| Token       | Hex     | Usage              |
| ----------- | ------- | ------------------ |
| `wb-mint`   | #72d397 | Active/Live status |
| `wb-brown`  | #774e38 | Primary text       |
| `wb-taupe`  | #9a7b6b | Secondary text     |
| `wb-coral`  | #e08e79 | Buttons            |
| `wb-cream`  | #ede5ce | Light backgrounds  |
| `wb-sand`   | #f0d4ae | Card backgrounds   |
| `wb-gold`   | #fcc900 | Winner/completed   |
| `wb-yellow` | #fde68b | Pending status     |
| `wb-pink`   | #ffa3a2 | Cancelled status   |

## Provider Hierarchy

```tsx
<ThemeProvider>
  <SdkProvider>
    {' '}
    {/* Farcaster MiniApp SDK */}
    <WagmiProvider>
      {' '}
      {/* Web3/wallet */}
      {children}
      <BottomNav />
    </WagmiProvider>
  </SdkProvider>
</ThemeProvider>
```

## Component Patterns

- **Dialogs:** Use vaul `Drawer` for mobile-optimized sheets (CreateBetDialog, BetDetailDialog)
- **Forms:** Local `useState` + `updateField()` pattern, `isFormValid` derived via useMemo
- **User Selection:** `UserSearch` component with debounced search
- **Status Display:** `BetStatusBadge` or `StatusPennant` for consistent badge rendering
- **Winner Display:** Gold ring + small trophy overlay on avatar, grayscale on loser

## Environment Variables

```bash
NEYNAR_API_KEY              # Farcaster user data (used by indexer)
NEXT_PUBLIC_BASE_URL        # App URL for server-side calls
```

## React Query Config

Use default options for all queries unless otherwise specified.

## Dev Commands

```bash
pnpm dev        # Start Next.js dev server
pnpm build      # Production build
pnpm lint       # Run ESLint
```

## Dev Tips

- **Add color:** Edit `globals.css` @theme block, use as `bg-wb-newcolor`
- **Contract interaction:** Import ABIs from `lib/contracts.ts`, use wagmi hooks
- **Test bet states:** Set `DEV_SIMULATE_ROLE` in bet-detail-dialog.tsx
- **MiniApp context:** Use `useMiniApp()` hook to check if running in Farcaster frame
- **React Query:** Always use React Query for data fetching instead of React's useEffect + useState.
- **Types:** Import types from the `indexer` or `shared` package where possible. Derived types are always preferred.
