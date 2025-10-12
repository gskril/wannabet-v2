"use client"

import { useState } from "react"
import type { Bet } from "@/lib/types"
import { formatAddress } from "@/lib/dummy-data"
import { BetStatusBadge } from "./bet-status-badge"
import { BetDetailDialog } from "./bet-detail-dialog"
import { formatDistanceToNow } from "date-fns"
import { Card } from "@/components/ui/card"
import { UserAvatar } from "./user-avatar"
import { ArrowRight, Coins } from "lucide-react"

interface BetsTableProps {
  bets: Bet[]
}

export function BetsTable({ bets }: BetsTableProps) {
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleBetClick = (bet: Bet) => {
    setSelectedBet(bet)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="space-y-3">
        {bets.map((bet) => (
          <Card
            key={bet.id}
            className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => handleBetClick(bet)}
          >
            <div className="flex gap-3">
              {/* Avatar */}
              <UserAvatar address={bet.creator} size="md" />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Header with creator and status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{formatAddress(bet.creator)}</span>
                      <span className="text-muted-foreground text-sm">created a bet</span>
                      {bet.acceptedBy && (
                        <>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <UserAvatar address={bet.acceptedBy} size="sm" />
                          <span className="font-semibold text-sm">{formatAddress(bet.acceptedBy)}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(bet.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <BetStatusBadge status={bet.status} />
                </div>

                {/* Bet description */}
                <p className="text-sm text-pretty leading-relaxed">{bet.description}</p>

                {/* Amount and metadata */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary text-sm">{bet.amount} ETH</span>
                  </div>
                  {bet.status === "open" && (
                    <span className="text-xs text-muted-foreground">
                      {bet.counterparty ? `Waiting for ${formatAddress(bet.counterparty)}` : "Open to anyone"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <BetDetailDialog bet={selectedBet} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  )
}
