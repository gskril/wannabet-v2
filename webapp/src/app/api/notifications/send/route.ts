import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

// Send notification via Neynar's managed notification service
// API Reference: https://docs.neynar.com/reference/publish-frame-notifications

export type NotificationPayload = {
  targetFids: number[]
  title: string // Max 32 chars
  body: string // Max 128 chars
  targetUrl: string
}

type NeynarResponse = {
  campaign_id: string
  success_count: number
  failure_count: number
  not_attempted_count: number
  retryable_fids: number[]
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) {
    console.error('[Send Notification] NEYNAR_API_KEY not set')
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const payload: NotificationPayload = await request.json()

    // Validate payload
    if (!payload.targetFids?.length) {
      return NextResponse.json({ error: 'targetFids required' }, { status: 400 })
    }
    if (!payload.title || payload.title.length > 32) {
      return NextResponse.json({ error: 'title required (max 32 chars)' }, { status: 400 })
    }
    if (!payload.body || payload.body.length > 128) {
      return NextResponse.json({ error: 'body required (max 128 chars)' }, { status: 400 })
    }
    if (!payload.targetUrl) {
      return NextResponse.json({ error: 'targetUrl required' }, { status: 400 })
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/frame/notifications/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        target_fids: payload.targetFids,
        notification: {
          title: payload.title,
          body: payload.body,
          target_url: payload.targetUrl,
          uuid: randomUUID(),
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Send Notification] Neynar API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to send notification', details: errorText },
        { status: response.status }
      )
    }

    const result: NeynarResponse = await response.json()

    console.log('[Send Notification] Success:', {
      targetFids: payload.targetFids,
      title: payload.title,
      successCount: result.success_count,
      failureCount: result.failure_count,
    })

    return NextResponse.json({
      success: true,
      campaignId: result.campaign_id,
      successCount: result.success_count,
      failureCount: result.failure_count,
    })
  } catch (error) {
    console.error('[Send Notification] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
