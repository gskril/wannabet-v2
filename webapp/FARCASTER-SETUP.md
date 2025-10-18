# Farcaster Mini App Setup Complete! 🎉

Your WannaBet webapp has been successfully transformed into a Farcaster Mini App with authentication and real user data.

## What Was Done

### ✅ Authentication

- **SDK Integration**: Proper initialization with the Farcaster Mini App SDK
- **User Context**: Auth context provider exposes authenticated user throughout the app
- **Profile Loading**: Automatically fetches user profile from Neynar when authenticated

### ✅ Real User Data

- **Neynar Integration**: Set up client and API routes for fetching Farcaster users
- **User Search**: Real-time search with debouncing for finding users
- **API Route**: Server-side endpoint to protect your Neynar API key

### ✅ UI Updates

- **Create Bet Dialog**: Now uses your authenticated Farcaster identity
- **Bottom Navigation**: Profile link dynamically points to your FID
- **User Avatar**: Shows your actual Farcaster profile picture

### ✅ Mini App Publishing

- **Manifest**: Created `manifest.json` with app metadata
- **Embed Metadata**: Proper Mini App Embed tags for sharing bets in casts
- **Splash Screen**: Branded loading screen with BettingMutt logo

## Setup Instructions

### 1. Add Your Neynar API Key

Edit `webapp/.env.local` and add your Neynar API key:

```bash
NEYNAR_API_KEY=your_actual_neynar_api_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Get your API key from: https://neynar.com

### 2. Start the Development Server

```bash
cd webapp
pnpm dev
```

The app will run on http://localhost:3000

### 3. Enable Farcaster Developer Mode

1. Visit: https://farcaster.xyz/~/settings/developer-tools
2. Toggle on "Developer Mode"
3. Access developer tools from the left sidebar (desktop recommended)

### 4. Test Your Mini App

#### Option A: Test in Farcaster Client (Warpcast)

1. Deploy your app to a public URL (Vercel, Railway, etc.)
2. Update `NEXT_PUBLIC_BASE_URL` in `.env.local` to your deployed URL
3. Create a Mini App manifest in Farcaster developer tools
4. Launch your Mini App from within Warpcast

#### Option B: Test Locally with Tunneling

1. Use a tool like `ngrok` or `cloudflared` to expose localhost:

   ```bash
   # With ngrok
   ngrok http 3000

   # With cloudflared
   cloudflared tunnel --url http://localhost:3000
   ```

2. Update `NEXT_PUBLIC_BASE_URL` to your tunnel URL
3. Create a Mini App manifest pointing to the tunnel URL
4. Test in Farcaster client

## Key Features

### Authentication Flow

When users open your Mini App in a Farcaster client:

1. SDK automatically detects the Farcaster context
2. Gets the user's FID (Farcaster ID)
3. Fetches their profile from Neynar
4. Provides user data throughout the app via `useAuth()` hook

### User Search

The create bet dialog now searches real Farcaster users:

- Type at least 2 characters to search
- Results are fetched from Neynar API
- Debounced to prevent excessive API calls
- Shows user avatars and display names

### Sharing Bets

When you share a bet URL (`/bet/[id]`) in a cast:

- Displays as a rich Mini App Embed
- Shows bet details and amount in the card
- "View Bet" button launches the full Mini App
- Branded splash screen during load

## File Structure

```
webapp/
├── .env.local                          # Your API keys (git-ignored)
├── .env.example                        # Template for env vars
├── public/
│   └── manifest.json                   # Mini App metadata
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── neynar/
│   │   │       └── search-users/
│   │   │           └── route.ts        # User search API endpoint
│   │   ├── bet/[id]/page.tsx          # Bet detail with embed metadata
│   │   └── layout.tsx                  # App layout with manifest link
│   ├── components/
│   │   ├── sdk-provider.tsx           # SDK initialization & auth
│   │   ├── user-search.tsx            # Real Farcaster user search
│   │   ├── create-bet-dialog.tsx      # Uses authenticated user
│   │   └── bottom-nav.tsx             # Dynamic profile link
│   └── lib/
│       ├── auth-context.tsx           # Auth state management
│       └── neynar.ts                  # Neynar API client
```

## Using Authentication in Components

```tsx
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const { user, fid, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <div>Please open in Farcaster</div>
  }

  return (
    <div>
      <h1>Hello, {user?.displayName}!</h1>
      <p>Your FID: {fid}</p>
    </div>
  )
}
```

## Next Steps

1. **Add API Key**: Don't forget to add your Neynar API key to `.env.local`
2. **Test Locally**: Run the dev server and test the UI
3. **Deploy**: Push to Vercel or your preferred hosting platform
4. **Register**: Create a Mini App manifest in Farcaster developer tools
5. **Test in Client**: Open your Mini App in Warpcast to test authentication

## Troubleshooting

### "NEYNAR_API_KEY not set" warning

- Make sure `.env.local` exists with your API key
- Restart the dev server after adding the key

### User search not working

- Check browser console for API errors
- Verify your Neynar API key is valid
- Ensure the `/api/neynar/search-users` route is accessible

### SDK context is null

- This is expected when testing in a regular browser
- The Mini App must be opened from within a Farcaster client
- Use developer mode in Farcaster to test properly

### Create Bet button not showing

- The button only appears when authenticated
- Open the app from within Farcaster client
- Check console logs for SDK initialization errors

## Resources

- [Farcaster Mini Apps Docs](https://miniapps.farcaster.xyz)
- [Neynar API Docs](https://docs.neynar.com)
- [Quick Auth Guide](https://miniapps.farcaster.xyz/docs/sdk/quick-auth)
- [Mini App Embeds](https://miniapps.farcaster.xyz/docs/specification)

## What's Still Using Dummy Data

As planned, the following still use dummy/fake data:

- Bet listings (`DUMMY_BETS`)
- Bet creation (no blockchain calls)
- Bet acceptance and settlement
- Wallet integration

These will be implemented by your contracts team later.

---

**Note**: Remember to never commit your `.env.local` file with real API keys to version control!
