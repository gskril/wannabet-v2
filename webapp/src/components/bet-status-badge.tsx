import { Badge } from '@/components/ui/badge'
import { BetStatus } from 'indexer/types'

interface BetStatusBadgeProps {
  status: BetStatus
}

export function BetStatusBadge({ status }: BetStatusBadgeProps) {
  const variants: Record<
    BetStatus,
    { variant: 'success' | 'warning' | 'default' | 'secondary'; label: string }
  > = {
    [BetStatus.PENDING]: { variant: 'success', label: 'Pending' },
    [BetStatus.ACTIVE]: { variant: 'warning', label: 'Active' },
    [BetStatus.JUDGING]: { variant: 'warning', label: 'Judging' },
    [BetStatus.RESOLVED]: { variant: 'default', label: 'Resolved' },
    [BetStatus.CANCELLED]: { variant: 'secondary', label: 'Cancelled' },
  }

  const config = variants[status]

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  )
}
