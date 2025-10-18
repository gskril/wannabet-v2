import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:opacity-90',
        secondary:
          'border-transparent bg-muted text-foreground hover:opacity-90',
        destructive:
          'border-transparent bg-danger text-white shadow hover:opacity-90',
        outline: 'text-foreground',
        success:
          'border-transparent bg-success text-white shadow hover:opacity-90',
        warning:
          'border-transparent bg-warning text-black shadow hover:opacity-90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
