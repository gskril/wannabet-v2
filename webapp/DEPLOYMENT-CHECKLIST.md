# WannaBet Mini App - Deployment Checklist

## Pre-Deployment

### ✅ Environment Variables

- [ ] Add `NEYNAR_API_KEY` to your hosting platform's environment variables
- [ ] Set `NEXT_PUBLIC_BASE_URL` to your production URL
- [ ] Test that API routes work with production env vars

### ✅ Build Test

```bash
cd webapp
pnpm build
pnpm start
```

- [ ] Verify the build completes without errors
- [ ] Test the production build locally

## Deployment Options

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
cd webapp
vercel

# Set environment variables in Vercel dashboard:
# - NEYNAR_API_KEY
# - NEXT_PUBLIC_BASE_URL (your .vercel.app URL)
```

### Option 2: Railway

1. Connect your GitHub repo to Railway
2. Set root directory to `webapp`
3. Add environment variables in Railway dashboard
4. Deploy automatically on push

### Option 3: Cloudflare Pages

```bash
cd webapp
pnpm build

# Upload .next folder to Cloudflare Pages
# Add environment variables in Cloudflare dashboard
```

## Post-Deployment

### Register Your Mini App in Farcaster

1. **Enable Developer Mode**
   - Visit: https://farcaster.xyz/~/settings/developer-tools
   - Toggle on "Developer Mode"

2. **Create Mini App Manifest**
   - Go to Developer Tools in Farcaster
   - Click "Create Mini App"
   - Fill in details:
     - **Name**: WannaBet
     - **Short Name**: WannaBet
     - **Home URL**: `https://your-domain.com`
     - **Icon URL**: `https://your-domain.com/img/bettingmutt.png`
     - **Splash Image**: `https://your-domain.com/img/bettingmutt.png`
     - **Splash Color**: `#fefce8`

3. **Verify Manifest**
   - Test opening your Mini App from Farcaster
   - Verify authentication works
   - Test user search functionality
   - Try sharing a bet link in a cast

### Test the Full Flow

- [ ] Open Mini App from Farcaster client
- [ ] Verify your profile shows correctly in bottom nav
- [ ] Test user search in create bet dialog
- [ ] Share a bet URL in a cast
- [ ] Verify the Mini App Embed displays properly
- [ ] Test launching from the embed

## Update Production URL

After deployment, update your `.env.local` for local dev:

```bash
NEXT_PUBLIC_BASE_URL=https://your-production-url.com
```

And ensure your production environment has:

```bash
NEYNAR_API_KEY=your_key_here
NEXT_PUBLIC_BASE_URL=https://your-production-url.com
```

## Monitoring

### Check These After Deployment

1. **Vercel Logs** (or your platform's logs)
   - Look for any runtime errors
   - Verify API routes are working

2. **Browser Console**
   - Open Mini App in Farcaster
   - Check for JavaScript errors
   - Verify SDK initialization logs

3. **Neynar API Usage**
   - Monitor your API key usage
   - Check for rate limit issues

## Common Issues

### Issue: "API key not configured" error

**Solution**: Ensure `NEYNAR_API_KEY` is set in your hosting platform's environment variables

### Issue: User search returns no results

**Solution**:

- Check API key is valid
- Verify `/api/neynar/search-users` route is accessible
- Check Neynar API status

### Issue: Mini App Embed not showing in casts

**Solution**:

- Verify `NEXT_PUBLIC_BASE_URL` is set correctly
- Check that `/bet/[id]` pages have proper metadata
- Use Farcaster's embed debugger tool

### Issue: Authentication not working

**Solution**:

- Only works when opened from Farcaster client
- Check SDK initialization logs
- Verify manifest is properly registered

## Sharing Your Mini App

Once deployed and registered:

1. **Share the home page**: Post your Mini App URL in a cast
2. **Share specific bets**: Use `/bet/[id]` URLs for rich embeds
3. **Add to profile**: Pin your Mini App in your Farcaster profile

## Security Notes

- ✅ API key is server-side only (not exposed to client)
- ✅ User searches go through your backend
- ✅ Environment variables are properly configured
- ⚠️ Remember: `.env.local` should NEVER be committed to git

## Next: Smart Contract Integration

When your contracts team is ready:

1. Add wagmi/viem for blockchain interaction
2. Connect to deployed Bet and BetFactory contracts
3. Replace dummy bet creation with real transactions
4. Implement bet acceptance and settlement
5. Add wallet connection via Farcaster SDK

---

**Quick Deploy Command:**

```bash
cd webapp && vercel --prod
```

Good luck! 🚀
