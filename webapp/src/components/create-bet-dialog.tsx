'use client'

import { Calendar, Plus } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserSearch } from '@/components/user-search'
import { useAuth } from '@/lib/auth-context'
import type { FarcasterUser } from '@/lib/types'

type DateOption = '1day' | '7days' | '30days' | 'custom'

interface FormData {
  taker: string
  takerUser?: FarcasterUser
  judge: string
  judgeUser?: FarcasterUser
  amount: string
  expiresAt: string
  dateOption: DateOption | null
  description: string
}

export function CreateBetDialog() {
  const { user: currentUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    taker: '',
    judge: '',
    amount: '',
    expiresAt: '',
    dateOption: null,
    description: '',
  })

  const DATE_PRESETS: { key: DateOption; label: string; days: number }[] = [
    { key: '1day', label: 'Day', days: 1 },
    { key: '7days', label: 'Days', days: 7 },
    { key: '30days', label: 'Days', days: 30 },
  ]

  // Allow opening via #create hash
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#create') {
        setOpen(true)
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        )
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Prefill description when entering step 4
  useEffect(() => {
    if (step === 4 && !formData.description) {
      const username = currentUser?.username || 'testuser'
      setFormData((prev) => ({
        ...prev,
        description: `${username} bets that `,
      }))
    }
  }, [step, currentUser, formData.description])

  const handleReset = () => {
    setStep(1)
    setFormData({
      taker: '',
      judge: '',
      amount: '',
      expiresAt: '',
      dateOption: null,
      description: '',
    })
  }

  const getFullDescription = (): string => {
    const parts = [formData.description]
    if (formData.expiresAt) {
      parts.push('by', formatDisplayDate(formData.expiresAt))
    }
    return parts.join(' ')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('handleSubmit called, current step:', step)
    // Only allow actual submission on step 5
    if (step !== 5) {
      // Prevent form submission on earlier steps
      console.log('Blocked submission - not on step 5')
      return
    }

    console.log('Creating bet!')
    const fullDescription = getFullDescription()
    alert(`Bet created! (dummy submission)\n\n"${fullDescription}"`)
    setOpen(false)
    handleReset()
  }

  const handleNext = () => {
    console.log('handleNext called, current step:', step)
    if (canProceed() && step < 5) {
      console.log('Advancing from step', step, 'to', step + 1)
      setStep((prev) => {
        console.log('setState: prev=', prev, 'next=', prev + 1)
        return prev < 5 ? prev + 1 : prev
      })
    }
  }

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1)
  }

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return formData.judge.trim().length > 0
      case 2:
        return (
          formData.amount.trim().length > 0 && parseFloat(formData.amount) > 0
        )
      case 3:
        return formData.dateOption !== null && formData.expiresAt !== ''
      case 4: {
        const username = currentUser?.username || 'testuser'
        const prefill = `${username} bets that `
        // User must have added content beyond the prefill
        return formData.description.length > prefill.length
      }
      case 5:
        return true
      default:
        return false
    }
  }

  const handleDateSelect = (option: DateOption) => {
    const now = new Date()
    let expiryDate: Date

    if (option === '1day') {
      expiryDate = new Date(now)
      expiryDate.setDate(now.getDate() + 1)
    } else if (option === '7days') {
      expiryDate = new Date(now)
      expiryDate.setDate(now.getDate() + 7)
    } else if (option === '30days') {
      expiryDate = new Date(now)
      expiryDate.setDate(now.getDate() + 30)
    } else {
      setFormData({ ...formData, dateOption: option, expiresAt: '' })
      return
    }

    setFormData({
      ...formData,
      dateOption: option,
      expiresAt: expiryDate.toISOString(),
    })
  }

  const handleCustomDateChange = (dateString: string) => {
    if (dateString) {
      const date = new Date(dateString)
      date.setHours(23, 59, 59, 999)
      setFormData({
        ...formData,
        dateOption: 'custom',
        expiresAt: date.toISOString(),
      })
    } else {
      setFormData({ ...formData, dateOption: 'custom', expiresAt: '' })
    }
  }

  const formatDisplayDate = (isoString: string): string => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Mock display user if no auth
  const displayUser = currentUser || {
    fid: 0,
    username: 'testuser',
    displayName: 'Test User',
    pfpUrl: '/img/bettingmutt.png',
    bio: 'Testing mode - open in Farcaster for real auth',
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) handleReset()
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="hidden sm:fixed sm:bottom-4 sm:right-4 sm:z-50 sm:flex sm:h-auto sm:w-auto sm:items-center sm:gap-2 sm:rounded-md sm:px-6 sm:shadow-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Create Bet</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a New Bet</DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-all ${
                s === step
                  ? 'bg-primary'
                  : s < step
                    ? 'bg-primary/50'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <UserSearch
                label="Who are you betting?"
                placeholder="@username"
                helperText="Leave empty to allow anyone to accept"
                value={formData.taker}
                onChange={(value, user) =>
                  setFormData({ ...formData, taker: value, takerUser: user })
                }
              />
              <UserSearch
                label="Who should judge?"
                placeholder="@username"
                helperText="Pick someone both parties trust to decide the outcome"
                required
                value={formData.judge}
                onChange={(value, user) =>
                  setFormData({ ...formData, judge: value, judgeUser: user })
                }
              />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">How much USDC?</Label>
              <div className="grid grid-cols-3 gap-3">
                {[1, 5, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, amount: preset.toString() })
                    }
                    className={`flex h-20 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                      formData.amount === preset.toString()
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-primary/10 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl font-bold">{preset}</span>
                    <span className="text-xs">USDC</span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center">
                  <Image
                    src="/img/usdc.png"
                    alt="USDC"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Custom amount"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  className="h-14 pl-14 pr-16 text-xl font-semibold"
                />
                <span className="text-muted-foreground absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium">
                  USDC
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Both you and your opponent will put up this amount
              </p>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                When does the bet end?
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {DATE_PRESETS.map(({ key, label, days }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDateSelect(key)}
                    className={`flex h-24 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                      formData.dateOption === key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted bg-primary/10 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl font-bold">{days}</span>
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
              <div
                className="relative cursor-pointer"
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>('input[type="date"]')
                    ?.showPicker?.()
                }
              >
                <Input
                  type="date"
                  value={
                    formData.expiresAt
                      ? new Date(formData.expiresAt).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleCustomDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`h-12 cursor-pointer pr-10 text-base [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${
                    formData.expiresAt ? 'border-primary bg-primary/10' : ''
                  }`}
                />
                <Calendar className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                What&apos;s the bet?
              </Label>
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Complete the sentence:
                </p>
                <Input
                  id="description"
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  autoFocus
                  className="h-20 text-lg"
                />
                {formData.expiresAt && (
                  <p className="text-muted-foreground text-sm">
                    Bet ends:{' '}
                    <span className="font-medium">
                      {formatDisplayDate(formData.expiresAt)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Review Your Bet</Label>
              <div className="space-y-3">
                <div className="bg-card space-y-3 rounded-lg border p-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Opponent</p>
                    <p className="font-medium">
                      {formData.takerUser
                        ? `@${formData.takerUser.username}`
                        : 'Open to anyone'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Judge</p>
                    <p className="font-medium">
                      {formData.judgeUser
                        ? `@${formData.judgeUser.username}`
                        : formData.judge}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Amount</p>
                    <p className="font-medium">{formData.amount} USDC (each)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">End Date</p>
                    <p className="font-medium">
                      {formatDisplayDate(formData.expiresAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Bet Description
                    </p>
                    <p className="font-medium">{formData.description}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 text-base"
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            {step < 5 ? (
              <Button
                type="button"
                className="h-12 flex-1 text-base"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                className="h-12 flex-1 text-base"
                onClick={() => {
                  console.log('Create Bet button clicked')
                  handleSubmit(new Event('submit') as any)
                }}
                disabled={!canProceed()}
              >
                Create Bet
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
