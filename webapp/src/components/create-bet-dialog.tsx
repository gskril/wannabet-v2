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
import { UserAvatar } from '@/components/user-avatar'
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
  // Template fields for bet description
  subject: string
  action: string
}

// Common action suggestions (just examples to inspire users)
// Some use "will", some don't - showing variety in bet construction
const COMMON_ACTIONS = [
  'will run a marathon',
  'loses 10 lbs',
  'will ship a new feature',
  'bets the Vikings win the Super Bowl',
]

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
    subject: '', // No default - user must select
    action: '',
  })
  const DATE_PRESETS: { key: DateOption; label: string; days: number }[] = [
    { key: '1day', label: 'Day', days: 1 },
    { key: '7days', label: 'Days', days: 7 },
    { key: '30days', label: 'Days', days: 30 },
  ]
  const [showActionSuggestions, setShowActionSuggestions] = useState(false)

  // Listen for hash changes to open dialog from bottom nav
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#create') {
        setOpen(true)
        // Clear the hash without adding to history
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        )
      }
    }

    // Only listen for changes, don't check on mount
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleReset = () => {
    setStep(1)
    setFormData({
      taker: '',
      judge: '',
      amount: '',
      expiresAt: '',
      dateOption: null,
      subject: '',
      action: '',
    })
  }

  // Construct the full bet description from template
  const getFullDescription = (): string => {
    const parts = []

    // Action already includes subject name and "will"
    if (formData.action) parts.push(formData.action)

    // Add date context
    if (formData.expiresAt) {
      const byDate = formatDisplayDate(formData.expiresAt)
      parts.push('by', byDate)
    }

    return parts.join(' ')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullDescription = getFullDescription()
    console.log('Create bet:', { ...formData, description: fullDescription })
    // TODO: Implement bet creation
    alert(`Bet created! (dummy submission)\n\n"${fullDescription}"`)
    setOpen(false)
    handleReset()
  }

  const handleNext = () => {
    if (canProceed()) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
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
      case 4:
        return (
          formData.subject.trim().length > 0 &&
          formData.action.trim().length > 0 &&
          formData.action.split(' ').length >= 2
        )
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
      // custom - don't set expiry date yet
      setFormData({
        ...formData,
        dateOption: option,
        expiresAt: '',
      })
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
      // Set time to end of day
      date.setHours(23, 59, 59, 999)
      setFormData({
        ...formData,
        dateOption: 'custom',
        expiresAt: date.toISOString(),
      })
    } else {
      setFormData({
        ...formData,
        dateOption: 'custom',
        expiresAt: '',
      })
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

  // For testing: Use authenticated user if available, otherwise use a mock user
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
        if (!isOpen) {
          handleReset()
        }
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
          {[1, 2, 3, 4].map((s) => (
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
          {/* Step 1: Who's Involved */}
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

          {/* Step 2: How Much */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">How much USDC?</Label>

              {/* Quick select amounts */}
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

              {/* Custom amount input */}
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

          {/* Step 3: When Does It End */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                When does the bet end?
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {DATE_PRESETS.map(({ key, label, days }) => {
                  const active = formData.dateOption === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleDateSelect(key)}
                      className={`flex h-24 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted bg-primary/10 hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl font-bold">{days}</span>
                      <span className="text-sm">{label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Custom date input */}
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  const input = document.querySelector(
                    'input[type="date"]'
                  ) as HTMLInputElement
                  if (input) {
                    input.showPicker?.()
                  }
                }}
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
                  placeholder="Select a date"
                  className={`h-12 cursor-pointer pr-10 text-base [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none ${
                    formData.expiresAt ? 'border-primary bg-primary/10' : ''
                  }`}
                />
                <Calendar className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Step 4: Template Builder */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="mb-4">
                <Label className="text-lg font-semibold">Build your bet</Label>
              </div>

              {/* Subject */}
              <div className="space-y-3">
                <Label htmlFor="subject" className="text-sm font-medium">
                  Who is this bet about?
                </Label>

                {/* Two users side by side */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Maker button */}
                  <button
                    type="button"
                    onClick={() => {
                      const userName = displayUser.username
                      setFormData({
                        ...formData,
                        subject: 'maker',
                        action: `${userName} `,
                      })
                    }}
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                      formData.subject === 'maker'
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <UserAvatar
                      user={displayUser}
                      size="sm"
                      clickable={false}
                    />
                    <span className="truncate text-sm font-medium">
                      @{displayUser.username}
                    </span>
                  </button>

                  {/* Taker (Opponent) */}
                  {formData.takerUser && (
                    <button
                      type="button"
                      onClick={() => {
                        const userName = formData.takerUser!.username
                        setFormData({
                          ...formData,
                          subject: 'taker',
                          action: `${userName} `,
                        })
                      }}
                      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                        formData.subject === 'taker'
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <UserAvatar
                        user={formData.takerUser}
                        size="sm"
                        clickable={false}
                      />
                      <span className="truncate text-sm font-medium">
                        @{formData.takerUser.username}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action - only show after subject is selected */}
              {formData.subject && (
                <div className="space-y-2">
                  <Label htmlFor="action" className="text-sm font-medium">
                    What&apos;s the bet?
                  </Label>
                  <div className="relative">
                    <Input
                      id="action"
                      type="text"
                      placeholder="e.g., will run a marathon, bets Vikings win..."
                      value={formData.action}
                      onChange={(e) =>
                        setFormData({ ...formData, action: e.target.value })
                      }
                      onFocus={() => setShowActionSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowActionSuggestions(false), 200)
                      }
                      required
                      autoFocus
                      className="h-12 text-base"
                    />
                    {showActionSuggestions &&
                    (formData.action.trim().endsWith(displayUser.username) ||
                      (formData.takerUser &&
                        formData.action
                          .trim()
                          .endsWith(formData.takerUser.username))) ? (
                      <div className="bg-background absolute top-full z-50 mt-1 max-h-[200px] w-full overflow-y-auto rounded-lg border shadow-lg">
                        {COMMON_ACTIONS.map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => {
                              const userName =
                                formData.subject === 'maker'
                                  ? displayUser.username
                                  : formData.takerUser?.username || ''
                              setFormData({
                                ...formData,
                                action: `${userName} ${action}`,
                              })
                              setShowActionSuggestions(false)
                            }}
                            className="hover:bg-muted w-full border-b p-3 text-left text-sm last:border-b-0"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Preview - only show if user has entered action */}
              {formData.action && (
                <div className="bg-primary/10 border-primary/20 rounded-lg border-2 border-dashed p-4">
                  <p className="text-muted-foreground mb-1 text-xs font-medium">
                    Preview:
                  </p>
                  <p className="text-base font-medium leading-relaxed">
                    {(() => {
                      const parts = formData.action.split(' ')
                      const username = parts[0]
                      const rest = parts.slice(1).join(' ')
                      return (
                        <>
                          <span className="text-farcaster-brand">
                            {username}
                          </span>
                          {rest && ` ${rest}`}
                        </>
                      )
                    })()}
                    {formData.expiresAt && (
                      <>
                        {' by '}
                        <span className="text-muted-foreground underline decoration-dotted">
                          {formatDisplayDate(formData.expiresAt)}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
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
            {step < 4 ? (
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
                type="submit"
                className="h-12 flex-1 text-base"
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
