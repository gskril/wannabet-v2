import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// Test endpoint to manually trigger notifications and debug issues
// Usage: POST /api/notifications/test with { targetFid: number, dryRun?: boolean }

type TestPayload = {
  targetFid: number
  dryRun?: boolean // If true, validate but don't send
}

type NeynarResponse = {
  campaign_id: string
  success_count: number
  failure_count: number
  not_attempted_count: number
  retryable_fids: number[]
}

export async function POST(request: NextRequest) {
  // Only allow in development or with explicit override
  const isDev = process.env.NODE_ENV === 'development'
  const testSecret = request.headers.get('x-test-secret')
  const allowTest = isDev || testSecret === process.env.CRON_SECRET

  if (!allowTest) {
    return NextResponse.json(
      { error: 'Test endpoint only available in development' },
      { status: 403 }
    )
  }

  const apiKey = process.env.NEYNAR_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'NEYNAR_API_KEY not set',
        debug: { envKeys: Object.keys(process.env).filter((k) => k.includes('NEYNAR')) },
      },
      { status: 500 }
    )
  }

  try {
    const { targetFid, dryRun = false }: TestPayload = await request.json()

    if (!targetFid || typeof targetFid !== 'number') {
      return NextResponse.json({ error: 'targetFid (number) required' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fc.heywannabet.com'
    const uuid = randomUUID()

    const notificationPayload = {
      target_fids: [targetFid],
      notification: {
        title: 'Test notification',
        body: 'This is a test from WannaBet notification system',
        target_url: `${baseUrl}`,
        uuid,
      },
    }

    const diagnostics = {
      apiKeyPresent: !!apiKey,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      targetFid,
      baseUrl,
      uuid,
      payload: notificationPayload,
      dryRun,
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        message: 'Payload validated, not sent',
        diagnostics,
      })
    }

    // Try with trailing slash (per docs)
    const response = await fetch('https://api.neynar.com/v2/farcaster/frame/notifications/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(notificationPayload),
    })

    const responseText = await response.text()
    let responseJson: NeynarResponse | null = null
    try {
      responseJson = JSON.parse(responseText)
    } catch {
      // Response wasn't JSON
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neynar API returned error',
          httpStatus: response.status,
          httpStatusText: response.statusText,
          responseBody: responseText,
          diagnostics,
        },
        { status: 200 } // Return 200 so we see full debug info
      )
    }

    return NextResponse.json({
      success: true,
      neynarResponse: responseJson,
      interpretation: {
        delivered: responseJson?.success_count ?? 0,
        failed: responseJson?.failure_count ?? 0,
        notAttempted: responseJson?.not_attempted_count ?? 0,
        retryable: responseJson?.retryable_fids ?? [],
        notes:
          responseJson?.success_count === 0
            ? 'No notifications delivered - user may not have added miniapp or enabled notifications'
            : 'Notification delivered successfully',
      },
      diagnostics,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Exception occurred',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// GET endpoint for quick browser testing
export async function GET(request: NextRequest) {
  const fid = request.nextUrl.searchParams.get('fid')
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'

  if (!fid) {
    return NextResponse.json({
      usage: 'GET /api/notifications/test?fid=12345&dryRun=true',
      description: 'Test notification sending to a specific FID',
      params: {
        fid: 'Required - Farcaster ID to send test notification to',
        dryRun: 'Optional - if true, validate but do not send',
      },
      notes: [
        'Only works in development mode or with x-test-secret header',
        'User must have added the WannaBet miniapp and enabled notifications',
        'Check Neynar dashboard for notification delivery status',
      ],
    })
  }

  // Forward to POST handler
  const mockRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ targetFid: parseInt(fid, 10), dryRun }),
  })

  return POST(mockRequest)
}
