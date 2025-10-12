import type { BetStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface BetStatusBadgeProps {
  status: BetStatus
}

export function BetStatusBadge({ status }: BetStatusBadgeProps) {
  const variants: Record<BetStatus, { label: string; className: string }> = {
    open: { label: "Open", className: "bg-primary/20 text-primary border-primary/30" },
    active: { label: "Active", className: "bg-warning/20 text-warning border-warning/30" },
    completed: { label: "Completed", className: "bg-success/20 text-success border-success/30" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground border-border" },
  }

  const variant = variants[status]

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}
