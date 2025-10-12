"use client"

import type { Bet } from "@/lib/types"
import { formatAddress } from "@/lib/dummy-data"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BetStatusBadge } from "./bet-status-badge"
import { UserAvatar } from "./user-avatar"
import { Calendar, Coins, Trophy, Clock } from "lucide-react"
import { format } from "date-fns"

interface BetDetailDialogProps {
  bet: Bet | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BetDetailDialog({ bet, open, onOpenChange }: BetDetailDialogProps) {
  if (!bet) return null

  const canAccept = bet.status === "open"
  const isCompleted = bet.status === "completed"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl">Bet Details</DialogTitle>
            <BetStatusBadge status={bet.status} />
          </div>
          <DialogDescription>ID: {bet.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-base text-pretty">{bet.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span>Bet Amount</span>
              </div>
              <p className="text-2xl font-bold text-primary">{bet.amount} ETH</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Expires</span>
              </div>
              <p className="text-lg font-semibold">{format(bet.expiresAt, "MMM dd, yyyy")}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar address={bet.creator} size="md" />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Creator</p>
                  <p className="font-mono text-sm font-medium">{formatAddress(bet.creator)}</p>
                </div>
              </div>
              {isCompleted && bet.winner === bet.creator && <Trophy className="h-5 w-5 text-success" />}
            </div>

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {bet.acceptedBy ? (
                  <UserAvatar address={bet.acceptedBy} size="md" />
                ) : (
                  <div className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">?</span>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Counterparty</p>
                  <p className="font-mono text-sm font-medium">
                    {bet.acceptedBy
                      ? formatAddress(bet.acceptedBy)
                      : bet.counterparty
                        ? formatAddress(bet.counterparty)
                        : "Open to anyone"}
                  </p>
                </div>
              </div>
              {isCompleted && bet.winner === bet.acceptedBy && <Trophy className="h-5 w-5 text-success" />}
            </div>
          </div>

          {bet.acceptedAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Accepted on {format(bet.acceptedAt, "MMM dd, yyyy")}</span>
            </div>
          )}

          {isCompleted && bet.winner && (
            <div className="rounded-lg border border-success/30 bg-success/10 p-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-success" />
                <UserAvatar address={bet.winner} size="sm" />
                <div>
                  <p className="font-semibold text-success">Winner</p>
                  <p className="font-mono text-sm text-success">{formatAddress(bet.winner)}</p>
                </div>
              </div>
            </div>
          )}

          {canAccept && (
            <div className="flex gap-3 pt-4">
              <Button className="flex-1" size="lg">
                Accept Bet
              </Button>
              <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
