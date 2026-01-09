import { NextRequest, NextResponse } from 'next/server'
import { fetchBets } from '@/lib/indexer'
import { sendNotification, notifications } from '@/lib/notifications'
import { BetStatus } from 'indexer/types'

// Cron job to remind takers before their accept deadline passes
// Should be called every few hours (e.g., via Vercel Cron or external service)

// Send reminder when less than these hours remain
const REMINDER_THRESHOLDS_HOURS = [24, 6, 1]

export async function GET(request: NextRequest) {
  // Optional: Verify cron secret for security
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bets = await fetchBets()
    const now = Date.now()

    // Find bets in PENDING status (not yet accepted)
    const pendingBets = bets.filter((bet) => bet.status === BetStatus.PENDING)

    let sentCount = 0
    let skippedCount = 0

    for (const bet of pendingBets) {
      // Skip if taker has no FID (can't send notification)
      if (!bet.taker.fid) {
        skippedCount++
        continue
      }

      // Calculate hours until deadline
      const hoursRemaining = Math.floor((bet.acceptBy - now) / (1000 * 60 * 60))

      // Skip if deadline already passed or more than 24 hours away
      if (hoursRemaining < 0 || hoursRemaining > 24) {
        continue
      }

      // Find the appropriate threshold for notification
      // This simple approach sends at each threshold crossing
      // In production, you'd want to track which reminders were already sent
      const shouldNotify = REMINDER_THRESHOLDS_HOURS.some(
        (threshold) => hoursRemaining <= threshold && hoursRemaining > threshold - 1
      )

      if (!shouldNotify) {
        continue
      }

      const payload = notifications.acceptDeadlineReminder({
        takerFid: bet.taker.fid,
        makerUsername: bet.maker.username || 'Someone',
        amount: bet.amount,
        description: bet.description,
        betAddress: bet.address,
        hoursRemaining: Math.max(1, hoursRemaining),
      })

      const success = await sendNotification(payload)
      if (success) {
        sentCount++
      }
    }

    console.log('[Accept Reminders] Completed:', {
      totalPending: pendingBets.length,
      sent: sentCount,
      skipped: skippedCount,
    })

    return NextResponse.json({
      success: true,
      totalPending: pendingBets.length,
      remindersSent: sentCount,
      skipped: skippedCount,
    })
  } catch (error) {
    console.error('[Accept Reminders] Error:', error)
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 })
  }
}
