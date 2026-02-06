import { useCallback } from 'react'
import type { Bet } from 'indexer/types'

type NotificationPayload = {
  targetFids: number[]
  title: string
  body: string
  targetUrl: string
}

// Helper to truncate text to max length
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Send notification via API route (fire-and-forget)
async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    // Silent fail - notifications are best effort
    console.error('[Notification] Failed to send:', error)
  }
}

export function useNotifications() {
  // Notify taker when a bet is created for them
  const notifyBetCreated = useCallback(
    async (bet: {
      address: string
      description: string
      amount: string
      maker: { fid: number | null; username: string | null }
      taker: { fid: number | null }
    }) => {
      if (!bet.taker.fid) return
      await sendNotification({
        targetFids: [bet.taker.fid],
        title: 'New bet challenge!',
        body: truncate(
          `${bet.maker.username || 'Someone'} challenged you to bet ${bet.amount} USDC: ${bet.description}`,
          128
        ),
        targetUrl: `https://farcaster.xyz/miniapps/E7dxAafMr7wy/wannabet/bet/${bet.address}`,
      })
    },
    []
  )

  // Notify maker when their bet is accepted
  const notifyBetAccepted = useCallback(
    async (bet: {
      address: string
      description: string
      maker: { fid: number | null }
      taker: { fid: number | null; username: string | null }
    }) => {
      if (!bet.maker.fid) return
      await sendNotification({
        targetFids: [bet.maker.fid],
        title: 'Bet accepted!',
        body: truncate(
          `${bet.taker.username || 'Someone'} accepted your bet: ${bet.description}`,
          128
        ),
        targetUrl: `https://farcaster.xyz/miniapps/E7dxAafMr7wy/wannabet/bet/${bet.address}`,
      })
    },
    []
  )

  // Notify judge when a bet needs their decision
  const notifyJudgingNeeded = useCallback(
    async (bet: {
      address: string
      description: string
      maker: { username: string | null }
      taker: { username: string | null }
      judge: { fid: number | null }
    }) => {
      if (!bet.judge.fid) return
      await sendNotification({
        targetFids: [bet.judge.fid],
        title: 'Your ruling needed',
        body: truncate(
          `Bet between ${bet.maker.username || 'Someone'} and ${bet.taker.username || 'Someone'}: ${bet.description}`,
          128
        ),
        targetUrl: `https://farcaster.xyz/miniapps/E7dxAafMr7wy/wannabet/bet/${bet.address}`,
      })
    },
    []
  )

  // Notify winner and loser when bet is resolved
  const notifyBetResolved = useCallback(
    async (bet: {
      address: string
      description: string
      amount: string
      maker: { fid: number | null; address: string }
      taker: { fid: number | null; address: string }
      winner: { address: string } | null
    }) => {
      if (!bet.winner) return

      const winnerAddress = bet.winner.address.toLowerCase()
      const isWinnerMaker = bet.maker.address.toLowerCase() === winnerAddress

      const winnerFid = isWinnerMaker ? bet.maker.fid : bet.taker.fid
      const loserFid = isWinnerMaker ? bet.taker.fid : bet.maker.fid

      // Notify winner
      if (winnerFid) {
        await sendNotification({
          targetFids: [winnerFid],
          title: 'You won!',
          body: truncate(`You won ${bet.amount} USDC on: ${bet.description}`, 128),
          targetUrl: `https://farcaster.xyz/miniapps/E7dxAafMr7wy/wannabet/bet/${bet.address}`,
        })
      }

      // Notify loser
      if (loserFid) {
        await sendNotification({
          targetFids: [loserFid],
          title: 'Bet settled',
          body: truncate(`You lost your bet: ${bet.description}`, 128),
          targetUrl: `https://farcaster.xyz/miniapps/E7dxAafMr7wy/wannabet/bet/${bet.address}`,
        })
      }
    },
    []
  )

  // Notify taker when bet is cancelled by maker
  const notifyBetCancelled = useCallback(
    async (bet: {
      address: string
      description: string
      maker: { username: string | null }
      taker: { fid: number | null }
    }) => {
      if (!bet.taker.fid) return
      await sendNotification({
        targetFids: [bet.taker.fid],
        title: 'Bet cancelled',
        body: truncate(
          `${bet.maker.username || 'Someone'} cancelled the bet: ${bet.description}`,
          128
        ),
        targetUrl: `https://farcaster.xyz/miniapps/E7dxAafMr7wy/wannabet/bet/${bet.address}`,
      })
    },
    []
  )

  return {
    notifyBetCreated,
    notifyBetAccepted,
    notifyJudgingNeeded,
    notifyBetResolved,
    notifyBetCancelled,
  }
}
