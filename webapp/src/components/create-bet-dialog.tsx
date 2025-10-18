'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function CreateBetDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    expiresAt: '',
    counterparty: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Create bet:', formData)
    // TODO: Implement bet creation
    alert('Bet created! (dummy submission)')
    setOpen(false)
    setFormData({
      description: '',
      amount: '',
      expiresAt: '',
      counterparty: '',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg sm:bottom-4 sm:h-auto sm:w-auto sm:rounded-md sm:px-6"
        >
          <Plus className="h-6 w-6 sm:mr-2" />
          <span className="hidden sm:inline">Create Bet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Bet</DialogTitle>
          <DialogDescription>
            Challenge someone or create an open bet anyone can accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">What are you betting on?</Label>
            <Textarea
              id="description"
              placeholder="e.g., ETH will reach $5000 by end of Q1"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
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
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires On</Label>
            <Input
              id="expiresAt"
              type="date"
              value={formData.expiresAt}
              onChange={(e) =>
                setFormData({ ...formData, expiresAt: e.target.value })
              }
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="counterparty">Specific Opponent (optional)</Label>
            <Input
              id="counterparty"
              type="text"
              placeholder="@username or FID"
              value={formData.counterparty}
              onChange={(e) =>
                setFormData({ ...formData, counterparty: e.target.value })
              }
            />
            <p className="text-muted-foreground text-xs">
              Leave empty to allow anyone to accept
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Bet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
