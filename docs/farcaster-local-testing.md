# Farcaster Mini App Local Testing

Instructions for Claude to set up local Farcaster testing environment.

## Prerequisites
- cloudflared installed (`brew install cloudflared`)

## Setup Steps

### 1. Pull latest and install dependencies
```bash
git pull
pnpm install
```

### 2. Kill any existing processes on port 3000
```bash
pkill -f "next dev" 2>/dev/null
lsof -i :3000  # verify port is free (should return nothing)
```

### 3. Start the dev server in background
```bash
pnpm dev:web > /tmp/wannabet-dev.log 2>&1 &
```

### 4. Wait for server to be ready and verify
```bash
sleep 10
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```
Expected: `200`. If not 200 or times out, check `/tmp/wannabet-dev.log` for errors.

### 5. Start cloudflared tunnel and capture URL
```bash
cloudflared tunnel --url http://localhost:3000 > /tmp/cloudflared.log 2>&1 &
sleep 5
grep -o 'https://[^[:space:]]*\.trycloudflare\.com' /tmp/cloudflared.log | head -1
```

### 6. Verify tunnel is working
```bash
curl -s -o /dev/null -w "%{http_code}" <TUNNEL_URL>
```
Expected: `200`

### 7. Provide URL to user
Give the user the trycloudflare.com URL to use in Farcaster Preview Tool:
https://farcaster.xyz/~/developers/mini-apps/preview

## Cleanup
When done testing:
```bash
pkill -f "next dev"
pkill cloudflared
```
