'use client'

import { Coins, Plus } from 'lucide-react'
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
import { UserAvatar } from '@/components/user-avatar'
import { UserSearch } from '@/components/user-search'
import type { FarcasterUser } from '@/lib/types'

type DateOption = '1day' | '1week'

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

// Common action suggestions
const COMMON_ACTIONS = [
  'run a marathon',
  'lose 10 lbs',
  'complete a project',
  'read 3 books',
  'go to the gym 5 times',
  'wake up before 6am every day',
  'cook dinner 4 times',
  'finish a side project',
  'ship a new feature',
  'get 1000 new followers',
]

// Mock current user for demo (in real app, this comes from auth)
const MOCK_CURRENT_USER: FarcasterUser = {
  fid: 12345,
  username: 'slobo',
  displayName: 'Slobo',
  pfpUrl: 'https://i.imgur.com/placeholder.jpg',
  bio: 'Current user',
}

export function CreateBetDialog() {
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

  const [showActionSuggestions, setShowActionSuggestions] = useState(false)

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

  // Get the display text for subject
  const getSubjectText = (): string => {
    if (formData.subject === 'maker') {
      return MOCK_CURRENT_USER.displayName
    } else if (formData.subject === 'taker' && formData.takerUser) {
      return formData.takerUser.displayName
    } else if (
      formData.subject &&
      formData.subject !== '' &&
      formData.subject !== 'maker' &&
      formData.subject !== 'taker' &&
      formData.subject !== 'custom'
    ) {
      return formData.subject // Custom text
    }
    return ''
  }

  // Construct the full bet description from template
  const getFullDescription = (): string => {
    const parts = []
    const subjectText = getSubjectText()

    if (subjectText) parts.push(subjectText)
    if (formData.action) parts.push('will', formData.action)

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
          formData.action.trim().length > 0
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
    } else {
      expiryDate = new Date(now)
      expiryDate.setDate(now.getDate() + 7)
    }

    setFormData({
      ...formData,
      dateOption: option,
      expiresAt: expiryDate.toISOString(),
    })
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
          className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg sm:bottom-4 sm:h-auto sm:w-auto sm:rounded-md sm:px-6"
        >
          <Plus className="h-6 w-6 sm:mr-2" />
          <span className="hidden sm:inline">Create Bet</span>
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
                placeholder="@username or FID"
                helperText="Leave empty to allow anyone to accept"
                value={formData.taker}
                onChange={(value, user) =>
                  setFormData({ ...formData, taker: value, takerUser: user })
                }
              />

              <UserSearch
                label="Who should judge?"
                placeholder="@username or FID"
                helperText="Pick someone both parties trust to decide the outcome"
                required
                value={formData.judge}
                onChange={(value, user) =>
                  setFormData({ ...formData, judge: value, judgeUser: user })
                }
                excludeFids={formData.takerUser ? [formData.takerUser.fid] : []}
              />
            </div>
          )}

          {/* Step 2: How Much */}
          {step === 2 && (
            <div className="space-y-4">
              <Label htmlFor="amount" className="text-lg font-semibold">
                How much USDC?
              </Label>
              <div className="relative">
                <div className="bg-muted absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg">
                  <Coins className="text-primary h-6 w-6" />
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="100"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  required
                  className="h-16 pl-16 text-2xl font-semibold"
                />
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
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleDateSelect('1day')}
                  className={`flex h-24 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                    formData.dateOption === '1day'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-primary/10 hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl font-bold">1</span>
                  <span className="text-sm">Day</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDateSelect('1week')}
                  className={`flex h-24 flex-col items-center justify-center rounded-lg border-2 transition-all ${
                    formData.dateOption === '1week'
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted bg-primary/10 hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl font-bold">7</span>
                  <span className="text-sm">Days</span>
                </button>
              </div>
              {formData.expiresAt && (
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-muted-foreground text-sm">Bet ends on:</p>
                  <p className="text-lg font-semibold">
                    {formatDisplayDate(formData.expiresAt)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Template Builder */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="mb-4">
                <Label className="text-lg font-semibold">Build your bet</Label>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium">
                  Subject (who?)
                </Label>

                {/* Maker and Taker side by side */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Maker */}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, subject: 'maker' })
                    }
                    className={`flex items-center gap-2 rounded-lg border-2 p-2 transition-all ${
                      formData.subject === 'maker'
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }`}
                  >
                    <UserAvatar
                      user={MOCK_CURRENT_USER}
                      size="sm"
                      clickable={false}
                    />
                    <span className="truncate text-sm font-semibold">
                      {MOCK_CURRENT_USER.displayName}
                    </span>
                  </button>

                  {/* Taker (Opponent) - only show if opponent was selected */}
                  {formData.takerUser && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, subject: 'taker' })
                      }
                      className={`flex items-center gap-2 rounded-lg border-2 p-2 transition-all ${
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
                      <span className="truncate text-sm font-semibold">
                        {formData.takerUser.displayName}
                      </span>
                    </button>
                  )}
                </div>

                {/* Someone else - custom input, separate and distinct */}
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, subject: 'custom' })
                    }
                    className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed p-2 transition-all ${
                      formData.subject !== '' &&
                      formData.subject !== 'maker' &&
                      formData.subject !== 'taker'
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/30'
                    }`}
                  >
                    <span className="text-muted-foreground text-sm">
                      Or someone else...
                    </span>
                  </button>
                  {formData.subject !== '' &&
                    formData.subject !== 'maker' &&
                    formData.subject !== 'taker' && (
                      <Input
                        type="text"
                        placeholder="Enter custom subject..."
                        value={
                          formData.subject === 'custom' ? '' : formData.subject
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subject: e.target.value || 'custom',
                          })
                        }
                        autoFocus
                        className="mt-2 h-11"
                      />
                    )}
                </div>
              </div>

              {/* Action */}
              <div className="space-y-2">
                <Label htmlFor="action" className="text-sm font-medium">
                  Action (what will happen?)
                </Label>
                <div className="relative">
                  <Input
                    id="action"
                    type="text"
                    placeholder="e.g., run a marathon, lose 10 lbs..."
                    value={formData.action}
                    onChange={(e) =>
                      setFormData({ ...formData, action: e.target.value })
                    }
                    onFocus={() => setShowActionSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowActionSuggestions(false), 200)
                    }
                    required
                    className="h-12 text-base"
                  />
                  {showActionSuggestions && formData.action.length === 0 && (
                    <div className="bg-background absolute top-full z-50 mt-1 max-h-[200px] w-full overflow-y-auto rounded-lg border shadow-lg">
                      {COMMON_ACTIONS.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, action })
                            setShowActionSuggestions(false)
                          }}
                          className="hover:bg-muted w-full border-b p-3 text-left text-sm last:border-b-0"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview - only show if user has entered some data */}
              {(getSubjectText() || formData.action) && (
                <div className="bg-primary/10 border-primary/20 rounded-lg border-2 border-dashed p-4">
                  <p className="text-muted-foreground mb-1 text-xs font-medium">
                    Preview:
                  </p>
                  <p className="text-base font-semibold leading-relaxed">
                    {getSubjectText() && (
                      <span className="text-muted-foreground underline decoration-dotted">
                        {getSubjectText()}
                      </span>
                    )}
                    {getSubjectText() && formData.action && ' will '}
                    {formData.action && (
                      <span className="text-muted-foreground underline decoration-dotted">
                        {formData.action}
                      </span>
                    )}
                    {formData.expiresAt && (
                      <>
                        {' by '}
                        <span className="text-muted-foreground underline decoration-dotted">
                          {formatDisplayDate(formData.expiresAt)}
                        </span>
                      </>
                    )}
                    {!getSubjectText() && !formData.action && (
                      <span className="text-muted-foreground">
                        Your bet will appear here...
                      </span>
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
