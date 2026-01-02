import { BetStatus } from 'indexer/types'

const PENNANT_CLIP = 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)'

export const STATUS_CONFIG: Record<
  BetStatus,
  {
    bg: string
    emoji: string
    label: string
    description: string
    emojiSize?: string
  }
> = {
  [BetStatus.PENDING]: {
    bg: 'bg-wb-yellow',
    emoji: '⏳',
    label: 'Pending',
    description: 'Waiting for opponent to accept',
  },
  [BetStatus.ACTIVE]: {
    bg: 'bg-wb-mint',
    emoji: '🤝',
    label: 'Live',
    description: 'Bet is active',
  },
  [BetStatus.JUDGING]: {
    bg: 'bg-wb-mint',
    emoji: '⚖️',
    label: 'Judging',
    description: 'Waiting for judge to decide',
  },
  [BetStatus.RESOLVED]: {
    bg: 'bg-wb-gold',
    emoji: '🏆',
    label: 'Resolved',
    description: 'Winner was decided',
  },
  [BetStatus.CANCELLED]: {
    bg: 'bg-wb-pink',
    emoji: '❌',
    label: 'Not Live',
    description: 'Bet was canceled or expired',
    emojiSize: 'text-xl',
  },
}

interface StatusPennantProps {
  status: BetStatus
}

export function StatusPennant({ status }: StatusPennantProps) {
  const config = STATUS_CONFIG[status]
  return (
    <div
      className={`${config.bg} flex h-10 w-8 items-center justify-center pb-2`}
      style={{ clipPath: PENNANT_CLIP }}
    >
      <span className={config.emojiSize ?? 'text-2xl'}>{config.emoji}</span>
    </div>
  )
}
