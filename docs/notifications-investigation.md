# WannaBet Notifications Investigation

**Date:** January 2026
**Branch:** `fix-notifications`
**Investigator:** Claude (assisted by slobo)

---

## Executive Summary

The WannaBet notification system was implemented but **does not work** because users have never been prompted to opt-in. Farcaster miniapp notifications require explicit user consent, which the app never requests. All notification attempts silently fail with `422 NoNotificationTokens`.

---

## Table of Contents

1. [Current Implementation](#current-implementation)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Technical Findings](#technical-findings)
4. [Test Harness](#test-harness)
5. [Solution Paths](#solution-paths)
6. [Relevant Documentation](#relevant-documentation)
7. [Implementation Recommendations](#implementation-recommendations)

---

## Current Implementation

### Files Involved

| File | Purpose |
|------|---------|
| `webapp/src/app/api/notifications/send/route.ts` | API route that posts to Neynar |
| `webapp/src/app/api/notifications/webhook/route.ts` | Receives opt-in/opt-out events from Neynar |
| `webapp/src/hooks/useNotifications.ts` | Client-side hook to trigger notifications on bet events |
| `webapp/src/lib/notifications.ts` | Server-side notification builders (for cron jobs) |
| `webapp/src/app/api/cron/accept-reminders/route.ts` | Cron job for accept deadline reminders |
| `webapp/src/app/api/cron/judging-reminders/route.ts` | Cron job for judge reminders |
| `webapp/public/.well-known/farcaster.json` | Miniapp manifest with webhook URL |

### Notification Types Implemented

| Event | Recipient | Trigger Point |
|-------|-----------|---------------|
| `betCreated` | Taker | `create-bet-dialog.tsx` after bet creation |
| `betAccepted` | Maker | `bet-detail-dialog.tsx` after acceptance |
| `judgingNeeded` | Judge | `bet-detail-dialog.tsx` (not currently wired) |
| `betResolved` | Winner + Loser | `bet-detail-dialog.tsx` after resolution |
| `betCancelled` | Taker | `bet-detail-dialog.tsx` after cancellation |
| `acceptDeadlineReminder` | Taker | Cron job |
| `judgingReminder` | Judge | Cron job |

### Manifest Configuration

```json
// webapp/public/.well-known/farcaster.json
{
  "frame": {
    "webhookUrl": "https://api.neynar.com/f/app/817e51c1-3c90-452c-9bc7-aa1510944494/event"
  }
}
```

The webhook URL is correctly configured to use Neynar's managed notification service.

---

## Root Cause Analysis

### The Core Problem

**Farcaster miniapp notifications are opt-in only.** Users must:

1. **Add the miniapp** to their Farcaster client (e.g., Warpcast)
2. **Enable notifications** for that specific miniapp

Without both steps, Neynar has no notification token to deliver messages to.

### What's Missing

The WannaBet app **never prompts users to enable notifications**. There is:

- No UI button to trigger `sdk.actions.addFrame()`
- No notification settings page
- No indication to users that notifications are available
- No tracking of which users have opted in

### Evidence

Testing with FID 851 (slobo.eth) and FID 12345 both returned:

```json
{
  "httpStatus": 422,
  "responseBody": "{\"code\":\"NoNotificationTokens\",\"message\":\"No notification tokens found for the specified target FIDs\"}"
}
```

This confirms that even the app creator hasn't opted in to notifications.

---

## Technical Findings

### Issue 1: Silent Failures

The client-side hook swallows all errors:

```typescript
// webapp/src/hooks/useNotifications.ts
async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    await fetch('/api/notifications/send', { ... })
  } catch (error) {
    // Silent fail - notifications are best effort
    console.error('[Notification] Failed to send:', error)
  }
}
```

The API route returns 422 errors, but the hook catches and ignores them. There's no visibility into whether notifications are actually being delivered.

### Issue 2: Missing `uuid` Field

The Neynar API documentation states that `notification.uuid` is required:

```typescript
// Current implementation (missing uuid)
body: JSON.stringify({
  target_fids: payload.targetFids,
  notification: {
    title: payload.title,
    body: payload.body,
    target_url: payload.targetUrl,
    // uuid: missing!
  },
})
```

However, testing shows the API accepts requests without it, so this may be optional despite documentation.

### Issue 3: No Opt-In Flow

The SDK provider only reads context:

```typescript
// webapp/src/components/sdk-provider.tsx
export function useMiniApp() {
  const context = useContext(Context)
  return { isMiniApp: !!context, miniAppUser: context }
}
```

It doesn't expose `sdk.actions.addFrame()` or any method to prompt for notification permissions.

### Issue 4: Cron Jobs Will Always Fail

The cron jobs (`accept-reminders`, `judging-reminders`) iterate through bets and attempt to send notifications. Since no users have opted in, every notification attempt fails, wasting API calls.

### Issue 5: No Deduplication for Cron Jobs

The cron jobs don't track which reminders have already been sent:

```typescript
// webapp/src/app/api/cron/accept-reminders/route.ts
// This simple approach sends at each threshold crossing
// In production, you'd want to track which reminders were already sent
```

---

## Test Harness

A test endpoint was created to debug notification issues:

### Endpoint

```
GET /api/notifications/test?fid=<FID>&dryRun=<true|false>
POST /api/notifications/test
  Body: { "targetFid": number, "dryRun": boolean }
```

### Location

`webapp/src/app/api/notifications/test/route.ts`

### Features

- Validates payload structure
- Shows full diagnostics including API key presence
- Includes the `uuid` field (fixing Issue 2)
- Returns detailed error information from Neynar
- Works in development mode or with `x-test-secret` header matching `CRON_SECRET`

### Example Response (Failure Case)

```json
{
  "success": false,
  "error": "Neynar API returned error",
  "httpStatus": 422,
  "responseBody": "{\"code\":\"NoNotificationTokens\",\"message\":\"No notification tokens found for the specified target FIDs\"}",
  "diagnostics": {
    "apiKeyPresent": true,
    "targetFid": 851,
    "uuid": "38cb578b-4950-4ce7-bf05-1765dc7012e1",
    "payload": { ... }
  }
}
```

---

## Solution Paths

### Path A: Minimal Fix (Add Opt-In Prompt)

**Effort:** Low
**Impact:** Enables notifications for users who opt in

1. Add a "Enable Notifications" button to the app (e.g., in profile or welcome modal)
2. Wire it to `sdk.actions.addFrame()`
3. Track opt-in state in the SDK context
4. Show notification status to users

```typescript
// Example implementation
const handleEnableNotifications = async () => {
  const result = await sdk.actions.addFrame()
  if (result.added) {
    // User added the miniapp
    if (result.notificationDetails) {
      // User also enabled notifications
    }
  }
}
```

### Path B: Comprehensive Fix

**Effort:** Medium
**Impact:** Full notification system with visibility and reliability

Everything in Path A, plus:

1. **Add `uuid` to all notifications** for idempotency
2. **Create notification preferences UI** (per-type toggles)
3. **Add success/failure feedback** when sending notifications
4. **Track notification state in database** (who has opted in, what was sent)
5. **Add retry logic** for `retryable_fids`
6. **Deduplication for cron jobs** (track sent reminders in DB)

### Path C: Alternative Notification Channels

**Effort:** High
**Impact:** Reaches users who don't opt in to miniapp notifications

Consider supplementing with:

1. **In-app notification center** (polling or websockets)
2. **Email notifications** (requires collecting emails)
3. **Farcaster direct casts** (via Neynar's cast API)

---

## Relevant Documentation

### Farcaster MiniApp SDK

- **Main SDK Docs:** https://miniapps.farcaster.xyz/docs/sdk
- **addFrame Action:** https://miniapps.farcaster.xyz/docs/sdk/actions/add-frame
- **Notification Context:** https://miniapps.farcaster.xyz/docs/sdk/context

### Neynar API

- **Send Notifications:** https://docs.neynar.com/reference/publish-frame-notifications
- **Notification Guide:** https://docs.neynar.com/docs/send-notifications-to-mini-app-users
- **Fetch User Notifications:** https://docs.neynar.com/reference/fetch-all-notifications
- **Fetch by Parent URL:** https://docs.neynar.com/reference/fetch-notifications-by-parent-url-for-user

### Key API Details

**Send Notification Endpoint:**
```
POST https://api.neynar.com/v2/farcaster/frame/notifications/
Headers: x-api-key: <NEYNAR_API_KEY>
```

**Required Fields:**
| Field | Type | Constraints |
|-------|------|-------------|
| `target_fids` | number[] | Max 100, empty = all opted-in users |
| `notification.title` | string | Max 32 chars |
| `notification.body` | string | Max 128 chars |
| `notification.target_url` | string | Deep link URL |
| `notification.uuid` | string | UUID for idempotency |

**Rate Limits (Farcaster-enforced):**
- 1 notification per 30 seconds per token
- 100 notifications per day per token

**Optional Filters:**
- `filters.exclude_fids`: FIDs to skip
- `filters.following_fid`: Only followers of this FID
- `filters.minimum_user_score`: Quality threshold (0-1)
- `filters.near_location`: Geographic targeting

### Neynar React SDK

- **Package:** `@neynar/react`
- **MiniAppProvider:** Wraps app for Neynar integration
- **useMiniApp Hook:** Access context including `addMiniApp()` method

---

## Implementation Recommendations

### Phase 1: Quick Win (Enable Opt-In)

1. **Update `sdk-provider.tsx`** to expose notification methods:
   ```typescript
   export function useMiniApp() {
     const context = useContext(Context)

     const promptNotifications = async () => {
       return await sdk.actions.addFrame()
     }

     return {
       isMiniApp: !!context,
       miniAppUser: context,
       promptNotifications,
       notificationsEnabled: context?.notificationDetails?.enabled ?? false
     }
   }
   ```

2. **Add notification prompt UI** in `welcome-modal.tsx` or create a dedicated component

3. **Update `useNotifications` hook** to check if user has notifications enabled before attempting to send

### Phase 2: Reliability

1. **Add `uuid` to send route:**
   ```typescript
   import { randomUUID } from 'crypto'

   notification: {
     title: payload.title,
     body: payload.body,
     target_url: payload.targetUrl,
     uuid: randomUUID(),
   }
   ```

2. **Return meaningful responses** from the hook instead of fire-and-forget

3. **Add logging/monitoring** for notification success rates

### Phase 3: Production Readiness

1. **Database table** to track:
   - Which users have opted in
   - Which notifications were sent (for deduplication)
   - Delivery status

2. **Admin dashboard** to view notification analytics

3. **Rate limit handling** for the 100/day per user limit

---

## Files Changed in This Investigation

| File | Change |
|------|--------|
| `webapp/src/app/api/notifications/test/route.ts` | Created - Test harness for debugging |

---

## Next Steps

1. [ ] Review this document with another LLM for feedback
2. [ ] Decide on solution path (A, B, or C)
3. [ ] Implement opt-in UI prompt
4. [ ] Test with a real opted-in user
5. [ ] Monitor notification delivery rates
6. [ ] Consider database tracking for production

---

## Appendix: Manual Testing Steps

To manually test notifications:

1. Open WannaBet in Warpcast
2. Go to Warpcast Settings > Developer Tools > Domains
3. Find wannabet.cc and add it as a miniapp
4. Enable notifications when prompted
5. Run the test endpoint:
   ```bash
   curl "https://wannabet.cc/api/notifications/test?fid=YOUR_FID"
   ```
6. Check for notification in Warpcast
