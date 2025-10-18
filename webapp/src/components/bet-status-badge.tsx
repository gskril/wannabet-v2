import { Badge } from '@/components/ui/badge'
import type { BetStatus } from '@/lib/types'

interface BetStatusBadgeProps {
  status: BetStatus
}

export function BetStatusBadge({ status }: BetStatusBadgeProps) {
  const variants: Record<
    BetStatus,
    { variant: 'success' | 'warning' | 'default' | 'secondary'; label: string }
  > = {
    open: { variant: 'success', label: 'Open' },
    active: { variant: 'warning', label: 'Active' },
    completed: { variant: 'default', label: 'Completed' },
    cancelled: { variant: 'secondary', label: 'Cancelled' },
  }

  const config = variants[status]

  return <Badge variant={config.variant}>{config.label}</Badge>
}
