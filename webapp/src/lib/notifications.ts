import type { NotificationPayload } from '@/app/api/notifications/send/route'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://wannabet.cc'

// Send notification via the internal API route
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return response.ok
  } catch (error) {
    console.error('[Notification] Failed to send:', error)
    return false
  }
}

// Helper to truncate text to max length
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Notification builders for each bet event
export const notifications = {
  betCreated: (params: {
    takerFid: number
    makerUsername: string
    amount: string
    description: string
    betAddress: string
  }): NotificationPayload => ({
    targetFids: [params.takerFid],
    title: 'New bet challenge!',
    body: truncate(
      `${params.makerUsername} challenged you to bet ${params.amount} USDC: ${params.description}`,
      128
    ),
    targetUrl: `${BASE_URL}/bet/${params.betAddress}`,
  }),

  betAccepted: (params: {
    makerFid: number
    takerUsername: string
    description: string
    betAddress: string
  }): NotificationPayload => ({
    targetFids: [params.makerFid],
    title: 'Bet accepted!',
    body: truncate(`${params.takerUsername} accepted your bet: ${params.description}`, 128),
    targetUrl: `${BASE_URL}/bet/${params.betAddress}`,
  }),

  judgingNeeded: (params: {
    judgeFid: number
    makerUsername: string
    takerUsername: string
    description: string
    betAddress: string
  }): NotificationPayload => ({
    targetFids: [params.judgeFid],
    title: 'Your ruling needed',
    body: truncate(
      `Bet between ${params.makerUsername} and ${params.takerUsername}: ${params.description}`,
      128
    ),
    targetUrl: `${BASE_URL}/bet/${params.betAddress}`,
  }),

  judgingReminder: (params: {
    judgeFid: number
    makerUsername: string
    takerUsername: string
    description: string
    betAddress: string
    daysOverdue: number
  }): NotificationPayload => ({
    targetFids: [params.judgeFid],
    title: 'Ruling reminder',
    body: truncate(
      `${params.daysOverdue}d overdue: ${params.makerUsername} vs ${params.takerUsername} - ${params.description}`,
      128
    ),
    targetUrl: `${BASE_URL}/bet/${params.betAddress}`,
  }),

  betResolved: (params: {
    winnerFid: number
    loserFid: number
    amount: string
    description: string
    betAddress: string
  }): { winner: NotificationPayload; loser: NotificationPayload } => ({
    winner: {
      targetFids: [params.winnerFid],
      title: 'You won!',
      body: truncate(`You won ${params.amount} USDC on: ${params.description}`, 128),
      targetUrl: `${BASE_URL}/bet/${params.betAddress}`,
    },
    loser: {
      targetFids: [params.loserFid],
      title: 'Bet settled',
      body: truncate(`You lost your bet: ${params.description}`, 128),
      targetUrl: `${BASE_URL}/bet/${params.betAddress}`,
    },
  }),

  betCancelled: (params: {
    takerFid: number
    makerUsername: string
    description: string
    betAddress: string
  }): NotificationPayload => ({
    targetFids: [params.takerFid],
    title: 'Bet cancelled',
    body: truncate(`${params.makerUsername} cancelled the bet: ${params.description}`, 128),
    targetUrl: `${BASE_URL}/bet/${params.betAddress}`,
  }),

  acceptDeadlineReminder: (params: {
    takerFid: number
    makerUsername: string
    amount: string
    description: string
    betAddress: string
    hoursRemaining: number
  }): NotificationPayload => ({
    targetFids: [params.takerFid],
    title: 'Bet expiring soon!',
    body: truncate(
      `${params.hoursRemaining}h left to accept ${params.makerUsername}'s ${params.amount} USDC bet`,
      128
    ),
    targetUrl: `${BASE_URL}/bet/${params.betAddress}`,
  }),
}
