import { NextRequest, NextResponse } from 'next/server'

// Neynar webhook events for mini app notifications
// With Neynar's managed service, they handle token storage
// This webhook is for logging/analytics purposes

type WebhookEvent = {
  event: 'miniapp_added' | 'miniapp_removed' | 'notifications_enabled' | 'notifications_disabled'
  fid: number
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const event: WebhookEvent = await request.json()

    // Log the event for debugging/analytics
    console.log('[Notification Webhook]', {
      event: event.event,
      fid: event.fid,
      timestamp: new Date(event.timestamp * 1000).toISOString(),
    })

    // With Neynar's managed service, token storage is handled automatically
    // We just acknowledge the event

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Notification Webhook] Error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
