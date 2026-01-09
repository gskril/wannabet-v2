import { NextRequest, NextResponse } from 'next/server'
import { fetchBets } from '@/lib/indexer'
import { sendNotification, notifications } from '@/lib/notifications'
import { BetStatus } from 'indexer/types'

// Cron job to send daily reminders to judges for bets awaiting their decision
// Should be called daily (e.g., via Vercel Cron or external service)

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

    // Find bets in JUDGING status (past endsBy, not yet resolved)
    const judgingBets = bets.filter((bet) => bet.status === BetStatus.JUDGING)

    let sentCount = 0
    let skippedCount = 0

    for (const bet of judgingBets) {
      // Skip if judge has no FID (can't send notification)
      if (!bet.judge.fid) {
        skippedCount++
        continue
      }

      // Calculate days overdue (since endsBy)
      const daysOverdue = Math.floor((now - bet.expiresAt) / (1000 * 60 * 60 * 24))

      // Only send if at least 1 day overdue
      if (daysOverdue < 1) {
        continue
      }

      const payload = notifications.judgingReminder({
        judgeFid: bet.judge.fid,
        makerUsername: bet.maker.username || 'Someone',
        takerUsername: bet.taker.username || 'Someone',
        description: bet.description,
        betAddress: bet.address,
        daysOverdue,
      })

      const success = await sendNotification(payload)
      if (success) {
        sentCount++
      }
    }

    console.log('[Judging Reminders] Completed:', {
      totalJudging: judgingBets.length,
      sent: sentCount,
      skipped: skippedCount,
    })

    return NextResponse.json({
      success: true,
      totalJudging: judgingBets.length,
      remindersSent: sentCount,
      skipped: skippedCount,
    })
  } catch (error) {
    console.error('[Judging Reminders] Error:', error)
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 })
  }
}
