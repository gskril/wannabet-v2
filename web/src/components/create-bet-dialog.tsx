'use client'

import type React from 'react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CreateBetDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateBetDialog({ open, onOpenChange }: CreateBetDialogProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [counterparty, setCounterparty] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would create a bet on-chain
    console.log({ description, amount, counterparty, expiresAt })
    onOpenChange?.(false)
    // Reset form
    setDescription('')
    setAmount('')
    setCounterparty('')
    setExpiresAt('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Bet</DialogTitle>
          <DialogDescription>
            Create a peer-to-peer bet on Ethereum. Set your terms and wait for
            someone to accept.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Bet Description</Label>
            <Textarea
              id="description"
              placeholder="e.g., ETH will reach $5000 by end of Q1 2025"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETH)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="counterparty">
              Counterparty Address (Optional)
            </Label>
            <Input
              id="counterparty"
              type="text"
              placeholder="0x... (leave empty for open bet)"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Leave empty to allow anyone to accept the bet
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Bet</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
