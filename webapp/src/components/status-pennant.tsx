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
    bg: 'bg-wb-lavender',
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
  size?: 'sm' | 'md'
}

export function StatusPennant({ status, size = 'md' }: StatusPennantProps) {
  const config = STATUS_CONFIG[status]
  const sizeClasses = size === 'sm' ? 'h-7 w-6 pb-1' : 'h-10 w-8 pb-2'
  const emojiSize = size === 'sm' ? 'text-base' : (config.emojiSize ?? 'text-2xl')

  return (
    <div
      className={`${config.bg} flex ${sizeClasses} shrink-0 items-center justify-center`}
      style={{ clipPath: PENNANT_CLIP }}
    >
      <span className={emojiSize}>{config.emoji}</span>
    </div>
  )
}
