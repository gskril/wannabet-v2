import { Badge } from '@/components/ui/badge'
import type { BetStatus } from '@/lib/types'

interface BetStatusBadgeProps {
  status: BetStatus
}

export function BetStatusBadge({ status }: BetStatusBadgeProps) {
  const variants: Record<
    BetStatus,
    { variant: 'success' | 'warning' | 'default' | 'secondary' | 'destructive'; label: string }
  > = {
    pending: { variant: 'secondary', label: 'Pending' },
    active: { variant: 'warning', label: 'Active' },
    resolved: { variant: 'success', label: 'Resolved' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
    expired: { variant: 'destructive', label: 'Expired' },
  }

  const config = variants[status]

  return <Badge variant={config.variant}>{config.label}</Badge>
}
